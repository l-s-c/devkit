// ============================================================
// DIFF MODULE
// ============================================================

export function initDiff({ $, $$, showToast, showLoading, hideLoading, escapeHtml, formatBytes, trackEvent, truncate, debounce, workerManager }) {

  // ============================================================
  // ============================================================
  $('#diffBtn').addEventListener('click', async () => {
    // Read from textarea/CM6 and cache
    const leftEl = document.getElementById('diffLeft');
    const rightEl = document.getElementById('diffRight');
    let left = '', right = '';
    // Try CM6 first
    if (window._cmDiffViews?.left) {
      try { left = window._cmDiffViews.left.state.doc.toString(); } catch(e) {}
    }
    if (!left && leftEl) left = HTMLTextAreaElement.prototype.__lookupGetter__('value') ? leftEl.value : leftEl.textContent;
    if (!left) left = _diffTextCache.left;

    if (window._cmDiffViews?.right) {
      try { right = window._cmDiffViews.right.state.doc.toString(); } catch(e) {}
    }
    if (!right && rightEl) right = HTMLTextAreaElement.prototype.__lookupGetter__('value') ? rightEl.value : rightEl.textContent;
    if (!right) right = _diffTextCache.right;

    _diffTextCache.left = left;
    _diffTextCache.right = right;
    left = left.trim();
    right = right.trim();
    if (!left || !right) { showToast('请在两侧都输入 JSON', 'error'); return; }

    const bigFile = left.length + right.length > 2 * 1024 * 1024;
    if (bigFile) showLoading('正在对比 JSON 文件...');

    try {
      // Try lenient parse: clean comments/trailing commas before diff
      let cleanLeft = left, cleanRight = right;
      try { JSON.parse(left); } catch(e) {
        const valResult = await workerManager.run('validate', { input: left, lenient: true });
        if (valResult.valid && typeof valResult.cleaned === 'string') cleanLeft = valResult.cleaned;
      }
      try { JSON.parse(right); } catch(e) {
        const valResult = await workerManager.run('validate', { input: right, lenient: true });
        if (valResult.valid && typeof valResult.cleaned === 'string') cleanRight = valResult.cleaned;
      }
      left = cleanLeft;
      right = cleanRight;
      _diffTextCache.left = left;
      _diffTextCache.right = right;

      const ignoreOrder = $('#diffIgnoreOrder').checked;
      const result = await workerManager.run('diff', { left, right, ignoreOrder });
      const changes = result.changes;

      const added = changes.filter(c => c.type === 'added').length;
      const removed = changes.filter(c => c.type === 'removed').length;
      const modified = changes.filter(c => c.type === 'modified').length;

      $('#diffAdded').textContent = added ? `● ${added} 项新增` : '';
      $('#diffRemoved').textContent = removed ? `● ${removed} 项删除` : '';
      $('#diffModified').textContent = modified ? `● ${modified} 项修改` : '';
      $('#diffMode').textContent = ignoreOrder ? '语义对比 · 忽略键顺序' : '语义对比';

      window._lastDiff = changes;

      if (changes.length === 0) {
        if (!_suppressToast) showToast('未发现差异', 'success');
      } else {
        if (!_suppressToast) showToast(`发现 ${changes.length} 处差异`, 'info');
        _suppressToast = false;
      }

      const foldUnchanged = $('#diffFoldUnchanged').checked;
      highlightDiff($('#diffLeft'), $('#diffRight'), left, right, changes, foldUnchanged);
      renderDiffList(changes);
      _autoDiffEnabled = true;
    } catch (err) {
      showToast('对比失败：' + err.message, 'error');
    } finally {
      if (bigFile) hideLoading();
    }
  });

  // Apply CM6 decorations for diff highlighting
  function applyDiffDecorations(view, lines) {
    if (!view || !window._cmDiffTools) return;
    const { Decoration, setDiffDecorations } = window._cmDiffTools;
    const doc = view.state.doc;
    const decorations = [];

    lines.forEach(line => {
      if (line.type === 'unchanged' || line.type === 'padding' || line.type === 'fold') return;
      if (line.lineNum === undefined) return;
      if (line.lineNum < 1 || line.lineNum > doc.lines) return;

      const docLine = doc.line(line.lineNum);
      const cls = line.type === 'added' ? 'cm-diff-added' :
                  line.type === 'removed' ? 'cm-diff-removed' :
                  line.type === 'modified' ? 'cm-diff-modified' : '';
      if (cls) {
        decorations.push(Decoration.line({ class: cls }).range(docLine.from));
      }

      // Character-level highlights
      if (line.charHighlights) {
        let pos = docLine.from;
        line.charHighlights.forEach(part => {
          if (part.highlight && part.text.length > 0) {
            const end = Math.min(pos + part.text.length, docLine.to);
            if (pos < end) {
              decorations.push(Decoration.mark({ class: 'cm-diff-char' }).range(pos, end));
            }
          }
          pos += part.text.length;
        });
      }
    });

    // Sort by position (required by RangeSet)
    decorations.sort((a, b) => a.from - b.from || a.startSide - b.startSide);
    const decoSet = Decoration.set(decorations);
    view.dispatch({ effects: setDiffDecorations.of(decoSet) });
  }

  function highlightDiff(leftEl, rightEl, leftText, rightText, changes, foldUnchanged = false) {
    let leftFormatted, rightFormatted;
    try {
      leftFormatted = JSON.stringify(JSON.parse(leftText), null, 2);
      rightFormatted = JSON.stringify(JSON.parse(rightText), null, 2);
    } catch (e) {
      leftFormatted = leftText;
      rightFormatted = rightText;
    }
    setDiffText('left', leftFormatted);
    setDiffText('right', rightFormatted);

    // Build path→change map
    const changeMap = {};
    changes.forEach(c => { changeMap[c.path] = c; });

    // Line diff via LCS on formatted lines
    const leftLines = leftFormatted.split('\n');
    const rightLines = rightFormatted.split('\n');
    const lineDiff = computeLineDiff(leftLines, rightLines);

    // Tag lines with their line numbers in the formatted text
    let leftLineNum = 0, rightLineNum = 0;
    lineDiff.left.forEach(line => {
      if (line.type !== 'padding') {
        leftLineNum++;
        line.lineNum = leftLineNum;
      }
    });
    lineDiff.right.forEach(line => {
      if (line.type !== 'padding') {
        rightLineNum++;
        line.lineNum = rightLineNum;
      }
    });

    // Apply decorations: CM6 if available, otherwise overlay fallback
    const hasCM6 = window._cmDiffViews && window._cmDiffTools &&
                    window._cmDiffViews.left && window._cmDiffViews.right;
    if (hasCM6) {
      try {
        applyDiffDecorations(window._cmDiffViews.left, lineDiff.left);
        applyDiffDecorations(window._cmDiffViews.right, lineDiff.right);
      } catch(e) {
        renderDiffOverlayFallback('diffLeftOverlay', leftEl, lineDiff.left);
        renderDiffOverlayFallback('diffRightOverlay', rightEl, lineDiff.right);
      }
    } else {
      renderDiffOverlayFallback('diffLeftOverlay', leftEl, lineDiff.left);
      renderDiffOverlayFallback('diffRightOverlay', rightEl, lineDiff.right);
    }

    // Render center gutter with merge arrows
    renderDiffGutter(lineDiff, changes);
  }

  // Simple line-level diff using LCS
  function computeLineDiff(leftLines, rightLines) {
    const m = leftLines.length, n = rightLines.length;
    // For very large files, do a simplified diff
    if (m + n > 10000) {
      return {
        left: leftLines.map(l => ({ text: l, type: 'unchanged' })),
        right: rightLines.map(l => ({ text: l, type: 'unchanged' })),
      };
    }

    // LCS table
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = leftLines[i-1] === rightLines[j-1]
          ? dp[i-1][j-1] + 1
          : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }

    // Backtrack
    const leftResult = [];
    const rightResult = [];
    let i = m, j = n;
    const leftTemp = [], rightTemp = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && leftLines[i-1] === rightLines[j-1]) {
        leftTemp.push({ text: leftLines[i-1], type: 'unchanged' });
        rightTemp.push({ text: rightLines[j-1], type: 'unchanged' });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        rightTemp.push({ text: rightLines[j-1], type: 'added' });
        leftTemp.push({ text: '', type: 'padding' });
        j--;
      } else {
        leftTemp.push({ text: leftLines[i-1], type: 'removed' });
        rightTemp.push({ text: '', type: 'padding' });
        i--;
      }
    }

    // Find modified lines (adjacent removed+added with similar content)
    const left = leftTemp.reverse();
    const right = rightTemp.reverse();

    for (let k = 0; k < left.length; k++) {
      if (left[k].type === 'removed' && right[k].type === 'padding' &&
          k + 1 < left.length && left[k+1].type === 'padding' && right[k+1].type === 'added') {
        // Merge into modified pair
        const charDiff = computeCharDiff(left[k].text, right[k+1].text);
        left[k].type = 'modified';
        left[k].charHighlights = charDiff.left;
        right[k].type = 'modified';
        right[k].text = right[k+1].text;
        right[k].charHighlights = charDiff.right;
        // Remove the extra pair
        left.splice(k+1, 1);
        right.splice(k+1, 1);
      }
    }

    return { left, right };
  }

  // Character-level diff for modified lines
  function computeCharDiff(a, b) {
    // Simple character LCS for short lines
    if (a.length + b.length > 200) {
      return { left: [{ text: a, highlight: true }], right: [{ text: b, highlight: true }] };
    }

    const m = a.length, n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }

    const leftParts = [], rightParts = [];
    let i = m, j = n;
    let lBuf = '', rBuf = '', cBufL = '', cBufR = '';

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
        if (lBuf) { leftParts.push({ text: lBuf, highlight: true }); lBuf = ''; }
        if (rBuf) { rightParts.push({ text: rBuf, highlight: true }); rBuf = ''; }
        cBufL = a[i-1] + cBufL;
        cBufR = b[j-1] + cBufR;
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        if (cBufL) { leftParts.push({ text: cBufL, highlight: false }); cBufL = ''; }
        if (cBufR) { rightParts.push({ text: cBufR, highlight: false }); cBufR = ''; }
        rBuf = b[j-1] + rBuf;
        j--;
      } else {
        if (cBufL) { leftParts.push({ text: cBufL, highlight: false }); cBufL = ''; }
        if (cBufR) { rightParts.push({ text: cBufR, highlight: false }); cBufR = ''; }
        lBuf = a[i-1] + lBuf;
        i--;
      }
    }
    if (lBuf) leftParts.push({ text: lBuf, highlight: true });
    if (rBuf) rightParts.push({ text: rBuf, highlight: true });
    if (cBufL) leftParts.push({ text: cBufL, highlight: false });
    if (cBufR) rightParts.push({ text: cBufR, highlight: false });

    return { left: leftParts.reverse(), right: rightParts.reverse() };
  }

  // Overlay fallback for when CM6 is not available
  function renderDiffOverlayFallback(overlayId, textarea, lines) {
    const parent = textarea.closest('.editor-area');
    if (!parent) return;
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('pre');
      overlay.id = overlayId;
      overlay.className = 'diff-overlay';
      parent.appendChild(overlay);
    }
    overlay.style.display = 'block';
    // Click overlay to dismiss and edit
    overlay.onclick = () => {
      overlay.style.display = 'none';
    };
    overlay.style.cursor = 'text';

    overlay.innerHTML = lines.map(line => {
      if (line.type === 'padding') return `<div class="diff-line diff-padding">&nbsp;</div>`;
      const cls = line.type === 'added' ? 'diff-added' :
                  line.type === 'removed' ? 'diff-removed' :
                  line.type === 'modified' ? 'diff-modified' : '';
      let content;
      if (line.charHighlights) {
        content = line.charHighlights.map(part =>
          part.highlight
            ? `<mark class="diff-char-highlight">${escapeHtml(part.text)}</mark>`
            : escapeHtml(part.text)
        ).join('');
      } else {
        content = escapeHtml(line.text) || '&nbsp;';
      }
      return `<div class="diff-line ${cls}">${content}</div>`;
    }).join('');
  }

  // Render center gutter with merge arrows between diff panes
  function renderDiffGutter(lineDiff, changes) {
    let gutter = document.getElementById('diffCenterGutter');
    if (!gutter) {
      // Insert gutter between the two editor panes
      const resizer = $('#view-diff .resizer');
      gutter = document.createElement('div');
      gutter.id = 'diffCenterGutter';
      gutter.className = 'diff-gutter';
      resizer.parentElement.insertBefore(gutter, resizer);
    }

    // Build gutter content - one arrow per change
    if (!changes || changes.length === 0) {
      gutter.innerHTML = '';
      return;
    }

    // Find line numbers for each change to position arrows
    const changeLineMap = new Map();
    lineDiff.left.forEach(line => {
      if (line.type !== 'unchanged' && line.type !== 'padding' && line.lineNum) {
        // Map the line text to find which change it belongs to
        changes.forEach((c, idx) => {
          if (!changeLineMap.has(idx)) {
            const pathInLine = line.text && line.text.includes(c.path.split('.').pop());
            if (pathInLine || line.type === c.type || (c.type === 'modified' && line.type === 'modified')) {
              changeLineMap.set(idx, line.lineNum);
            }
          }
        });
      }
    });

    const lineHeight = 20; // approximate CM6 line height
    const headerOffset = 40; // toolbar/header offset
    gutter.innerHTML = changes.map((c, i) => {
      const color = c.type === 'added' ? 'var(--success)' : c.type === 'removed' ? 'var(--error)' : 'var(--warning)';
      return `<div class="diff-gutter-item">
        <button class="diff-gutter-btn" data-idx="${i}" data-dir="toRight" title="→ 应用到右边" style="border-color:${color}">→</button>
        <button class="diff-gutter-btn" data-idx="${i}" data-dir="toLeft" title="← 应用到左边" style="border-color:${color}">←</button>
      </div>`;
    }).join('');

    gutter.onclick = (e) => {
      const btn = e.target.closest('.diff-gutter-btn');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      const dir = btn.dataset.dir;
      if (window._lastDiff && window._lastDiff[idx]) {
        applyMerge(dir, window._lastDiff[idx]);
      }
    };
  }

  function renderDiffList(changes) {
    let existing = document.getElementById('diffChangesList');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'diffChangesList';
      existing.style.cssText = 'max-height:180px;overflow-y:auto;border-top:1px solid var(--bg-700);background:var(--bg-850);padding:8px 16px;font-size:12px;font-family:"JetBrains Mono",monospace;';
      const statusbar = $('#view-diff .statusbar');
      statusbar.parentElement.insertBefore(existing, statusbar);
    }
    if (changes.length === 0) {
      existing.innerHTML = '<div style="color:var(--text-500);text-align:center;padding:12px">无差异</div>';
      return;
    }
    existing.onclick = (e) => {
      const btn = e.target.closest('.diff-merge-btn');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      const dir = btn.dataset.dir;
      if (window._lastDiff && window._lastDiff[idx]) {
        applyMerge(dir, window._lastDiff[idx]);
      }
    };
    existing.innerHTML = changes.map((c, i) => {
      const color = c.type === 'added' ? 'var(--success)' : c.type === 'removed' ? 'var(--error)' : 'var(--warning)';
      const symbol = c.type === 'added' ? '+' : c.type === 'removed' ? '−' : '~';
      const detail = c.type === 'modified'
        ? `${truncate(JSON.stringify(c.from))} → ${truncate(JSON.stringify(c.to))}`
        : truncate(JSON.stringify(c.value));
      return `<div style="padding:3px 0;color:var(--text-300);display:flex;align-items:center;gap:6px">
        <button class="diff-merge-btn" data-idx="${i}" data-dir="toLeft" title="移到左边">←</button>
        <span style="color:${color};font-weight:600">${symbol}</span>
        <span style="color:var(--text-400);flex:1">${escapeHtml(c.path)}: ${escapeHtml(detail)}</span>
        <button class="diff-merge-btn" data-idx="${i}" data-dir="toRight" title="移到右边">→</button>
      </div>`;
    }).join('');
  }

  function clearDiffDecorations() {
    // Clear CM6 decorations
    if (window._cmDiffViews && window._cmDiffTools) {
      const { Decoration, setDiffDecorations } = window._cmDiffTools;
      ['left', 'right'].forEach(side => {
        const view = window._cmDiffViews[side];
        if (view) {
          try { view.dispatch({ effects: setDiffDecorations.of(Decoration.none) }); } catch(e) {}
        }
      });
    }
    // Clear overlay fallbacks
    ['diffLeftOverlay', 'diffRightOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Clear gutter
    const gutter = document.getElementById('diffCenterGutter');
    if (gutter) gutter.innerHTML = '';
  }

  // ── Diff merge (move changes between sides) ──
  function setByPath(obj, path, value) {
    const parts = parsePath(path);
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
      if (current === undefined || current === null) return false;
    }
    current[parts[parts.length - 1]] = value;
    return true;
  }

  function deleteByPath(obj, path) {
    const parts = parsePath(path);
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
      if (current === undefined || current === null) return false;
    }
    const last = parts[parts.length - 1];
    if (Array.isArray(current)) {
      current.splice(Number(last), 1);
    } else {
      delete current[last];
    }
    return true;
  }

  function parsePath(path) {
    // Parse "users[0].name" → ["users", "0", "name"]
    return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  }

  // Store diff text in a simple cache to avoid CM6/textarea proxy issues
  const _diffTextCache = { left: '', right: '' };

  function getDiffText(side) {
    // Try CM6 view first
    if (window._cmDiffViews && window._cmDiffViews[side]) {
      try {
        return window._cmDiffViews[side].state.doc.toString();
      } catch(e) {}
    }
    // Fallback: use cached text (most reliable)
    return _diffTextCache[side] || '';
  }

  function setDiffText(side, text) {
    _diffTextCache[side] = text;
    const id = side === 'left' ? 'diffLeft' : 'diffRight';
    // Try CM6 view
    if (window._cmDiffViews && window._cmDiffViews[side]) {
      try {
        const view = window._cmDiffViews[side];
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
        return;
      } catch(e) {}
    }
    // Fallback: textarea
    const el = document.getElementById(id);
    if (el) {
      // Bypass potential CM6 proxy by using native setter
      const nativeSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      nativeSet.call(el, text);
    }
  }

  function applyMerge(direction, change) {
    // direction: 'toRight' = left→right, 'toLeft' = right→left
    try {
      const leftObj = JSON.parse(getDiffText('left'));
      const rightObj = JSON.parse(getDiffText('right'));

      if (direction === 'toRight') {
        if (change.type === 'removed') {
          // Was in left, not in right → add to right
          setByPath(rightObj, change.path, change.value);
        } else if (change.type === 'added') {
          // Was in right, not in left → delete from right
          deleteByPath(rightObj, change.path);
        } else if (change.type === 'modified') {
          // Use left's value
          setByPath(rightObj, change.path, change.from);
        }
        setDiffText('right', JSON.stringify(rightObj, null, 2));
      } else {
        if (change.type === 'added') {
          // Was in right, not in left → add to left
          setByPath(leftObj, change.path, change.value);
        } else if (change.type === 'removed') {
          // Was in left, not in right → delete from left
          deleteByPath(leftObj, change.path);
        } else if (change.type === 'modified') {
          // Use right's value
          setByPath(leftObj, change.path, change.to);
        }
        setDiffText('left', JSON.stringify(leftObj, null, 2));
      }

      // Re-run diff (suppress auto-diff from onChange)
      _merging = true;
      showToast('已合并', 'success');
      $('#diffBtn').click();
      setTimeout(() => { _merging = false; }, 600);
    } catch (err) {
      showToast('合并失败：' + err.message, 'error');
    }
  }

  $('#diffClearLeft').addEventListener('click', () => { $('#diffLeft').value = ''; clearDiffDecorations(); });
  $('#diffClearRight').addEventListener('click', () => { $('#diffRight').value = ''; clearDiffDecorations(); });
  $('#diffCopyResult').addEventListener('click', () => {
    if (!window._lastDiff || window._lastDiff.length === 0) {
      showToast('没有可复制的对比结果', 'error');
      return;
    }
    const text = window._lastDiff.map(c => {
      if (c.type === 'added') return `+ ${c.path}: ${JSON.stringify(c.value)}`;
      if (c.type === 'removed') return `- ${c.path}: ${JSON.stringify(c.value)}`;
      return `~ ${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`;
    }).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('对比结果已复制', 'success'));
  });

  // Auto re-diff on edit (debounced)
  let _autoDiffEnabled = false;
  let _merging = false; // suppress auto-diff during merge
  let _suppressToast = false; // suppress toast during auto-diff
  const autoDiff = debounce(() => {
    if (!_autoDiffEnabled || _merging) return;
    _suppressToast = true;
    const left = $('#diffLeft').value.trim();
    const right = $('#diffRight').value.trim();
    if (left && right) {
      $('#diffBtn').click();
    }
  }, 500);

  $('#diffLeft').addEventListener('input', () => { if (_autoDiffEnabled) autoDiff(); });
  $('#diffRight').addEventListener('input', () => { if (_autoDiffEnabled) autoDiff(); });

  // Sync scroll for diff
  const diffLeft = $('#diffLeft');
  const diffRight = $('#diffRight');
  let syncingScroll = false;
  diffLeft.addEventListener('scroll', () => {
    if (syncingScroll) return;
    syncingScroll = true;
    diffRight.scrollTop = diffLeft.scrollTop;
    diffRight.scrollLeft = diffLeft.scrollLeft;
    requestAnimationFrame(() => syncingScroll = false);
  });
  diffRight.addEventListener('scroll', () => {
    if (syncingScroll) return;
    syncingScroll = true;
    diffLeft.scrollTop = diffRight.scrollTop;
    diffLeft.scrollLeft = diffRight.scrollLeft;
    requestAnimationFrame(() => syncingScroll = false);
  });

  // ── Helpers ──

}
