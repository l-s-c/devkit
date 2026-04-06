// ============================================================
// FORMAT MODULE (includes validate)
// ============================================================

const SAMPLE_JSON = JSON.stringify({
  "name": "DevKit JSON",
  "version": "1.0.0",
  "description": "JSON 在线工具箱",
  "features": ["格式化", "校验", "树形视图", "转换", "对比"],
  "author": {
    "name": "开发团队",
    "url": "https://devkittool.cn"
  },
  "users": [
    { "id": 1, "name": "Alice", "age": 30, "active": true },
    { "id": 2, "name": "Bob", "age": 25, "active": false },
    { "id": 3, "name": "Charlie", "age": 28, "active": true }
  ],
  "config": {
    "theme": "light",
    "language": "zh-CN",
    "maxFileSize": "50MB"
  }
}, null, 2);

export function initFormat({ $, $$, showToast, showLoading, hideLoading, trackEvent, updateStats, formatBytes, escapeHtml, workerManager }) {

  function clearErrorHighlights() {
    if (window._errorLineCleanup) {
      window._errorLineCleanup();
      window._errorLineCleanup = null;
    }
    const el = document.getElementById('errorHighlightOverlay');
    if (el) el.remove();
  }

  function highlightErrorLines(errors) {
    const input = $('#formatInput');
    const parent = input.closest('.editor-area');
    clearErrorHighlights();
    if (!errors || errors.length === 0) return;
    const errorLineSet = new Set(errors.map(e => e.line));
    const cmView = window._cmFormatView;
    if (cmView) {
      const doc = cmView.state.doc;
      const firstErrorLine = Math.min(...errorLineSet);
      if (firstErrorLine >= 1 && firstErrorLine <= doc.lines) {
        const lineInfo = doc.line(firstErrorLine);
        cmView.dispatch({ selection: { anchor: lineInfo.from } });
        cmView.focus();
      }
      setTimeout(() => {
        errorLineSet.forEach(lineNum => {
          if (lineNum >= 1 && lineNum <= doc.lines) {
            try {
              const linePos = doc.line(lineNum);
              const dom = cmView.domAtPos(linePos.from);
              let lineEl = dom.node.nodeType === 1 ? dom.node : dom.node.parentElement;
              while (lineEl && !lineEl.classList.contains('cm-line')) lineEl = lineEl.parentElement;
              if (lineEl) lineEl.classList.add('cm-error-line');
            } catch(e) { console.warn('Error highlighting line', lineNum, e); }
          }
        });
      }, 100);
      window._errorLineCleanup = () => {
        if (cmView.dom) cmView.dom.querySelectorAll('.cm-error-line').forEach(el => el.classList.remove('cm-error-line'));
      };
    } else {
      const overlay = document.createElement('div');
      overlay.id = 'errorHighlightOverlay';
      overlay.className = 'error-highlight-overlay';
      parent.appendChild(overlay);
      const lines = input.value.split('\n');
      overlay.innerHTML = lines.map((line, i) => {
        const lineNum = i + 1;
        const isError = errorLineSet.has(lineNum);
        return `<div class="error-highlight-line${isError ? ' error-line-active' : ''}">${isError ? '<span class="error-line-marker">●</span>' : ''}&nbsp;</div>`;
      }).join('');
      input.addEventListener('scroll', function syncErr() { overlay.scrollTop = input.scrollTop; });
    }
  }

  async function doFormat(mode) {
    const input = $('#formatInput').value.trim();
    if (!input) { showToast('请输入要处理的 JSON', 'error'); return; }
    const start = performance.now();
    const bigFile = input.length > 1024 * 1024;
    const label = mode === 'format' ? '格式化' : '压缩';
    if (bigFile) showLoading(`正在${label} ${formatBytes(input.length)} 文件...`);
    const lenient = $('#lenientMode')?.checked || false;
    try {
      const valResult = await workerManager.run('validate', { input, lenient });
      const errorPanel = $('#formatErrorPanel');
      const resultDiv = $('#formatValidateResult');
      if (valResult.valid) {
        const indent = $('#indentSelect').value;
        const formatInput = (typeof valResult.cleaned === 'string') ? valResult.cleaned : input;
        const result = await workerManager.run(mode, { input: formatInput, indent });
        const elapsed = Math.round(performance.now() - start);
        clearErrorHighlights();
        $('#formatInput').value = result.output;
        $('#formatValid').style.display = 'inline';
        $('#formatValid').textContent = '✓ JSON 有效';
        $('#formatError').style.display = 'none';
        $('#formatTime').textContent = `${label}用时 ${elapsed}ms`;
        if (errorPanel) errorPanel.style.display = 'none';
        updateStats('format', result.output);
        showToast(`${label}成功（${elapsed}ms）`, 'success');
        trackEvent('format', label, `${elapsed}ms`);
      } else {
        $('#formatValid').style.display = 'none';
        $('#formatError').style.display = 'inline';
        $('#formatError').textContent = `✗ ${valResult.errors.length} 个错误`;
        $('#formatTime').textContent = '';
        let html = '';
        valResult.errors.forEach((err, i) => {
          html += `<div class="error-item"><div class="error-item-header"><span class="error-item-label">错误 ${i + 1}</span><span class="error-item-pos">第 ${err.line} 行，第 ${err.col} 列</span></div><div class="error-item-msg">${escapeHtml(err.message)}</div></div>`;
        });
        resultDiv.innerHTML = html;
        errorPanel.style.display = 'block';
        highlightErrorLines(valResult.errors);
        showToast(`发现 ${valResult.errors.length} 个错误`, 'error');
      }
    } catch (err) {
      $('#formatValid').style.display = 'none';
      $('#formatError').style.display = 'inline';
      $('#formatError').textContent = '✗ ' + err.message;
      $('#formatTime').textContent = '';
      showToast('JSON 无效：' + err.message, 'error');
    } finally {
      if (bigFile) hideLoading();
    }
  }

  $('#loadSample').addEventListener('click', () => {
    $('#formatInput').value = SAMPLE_JSON;
    updateStats('format', SAMPLE_JSON);
    showToast('已加载示例 JSON', 'success');
    trackEvent('format', 'sample', 'load');
  });

  $('#formatBtn').addEventListener('click', () => doFormat('format'));
  $('#minifyBtn').addEventListener('click', () => doFormat('minify'));
  $('#formatInput').addEventListener('input', () => updateStats('format', $('#formatInput').value));

  $('#formatClear').addEventListener('click', () => {
    $('#formatInput').value = '';
    $('#formatValid').style.display = 'none';
    $('#formatError').style.display = 'none';
    $('#formatTime').textContent = '';
    $('#formatErrorPanel').style.display = 'none';
    updateStats('format', '');
  });

  $('#formatCopy').addEventListener('click', () => {
    const output = $('#formatInput').value;
    if (!output) { showToast('没有可复制的内容', 'error'); return; }
    navigator.clipboard.writeText(output).then(() => showToast('已复制到剪贴板', 'success'));
  });

  $('#formatDownload').addEventListener('click', () => {
    const output = $('#formatInput').value;
    if (!output) { showToast('没有可下载的内容', 'error'); return; }
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'formatted.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('已下载 formatted.json', 'success');
  });
}
