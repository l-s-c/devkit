// ============================================================
// DevKit JSON — Main Application
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Theme ──
(function initTheme() {
  const saved = localStorage.getItem('devkit-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('devkit-theme', next);
    });
  }
})();

// ── Analytics ──
function trackEvent(category, action, label) {
  // Baidu tongji
  if (window._hmt) window._hmt.push(['_trackEvent', category, action, label]);
  // GA4
  if (window.gtag) window.gtag('event', action, { event_category: category, event_label: label });
}

// ── Toast ──
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-bar ${type}"></div><span class="toast-text">${message}</span>`;
  $('#toasts').appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Loading ──
function showLoading(text) {
  $('#loadingText').textContent = text;
  $('#loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  $('#loadingOverlay').classList.add('hidden');
}

// ── Route → View mapping ──
const VALID_TOOLS = ['format', 'tree', 'convert', 'diff', 'jsonpath'];


function switchView(tool, pushState = true) {
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`.nav-btn[data-tool="${tool}"]`).classList.add('active');
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#view-${tool}`).classList.add('active');
  // Update URL + meta
  if (pushState) {
    location.hash = '#' + tool;
    trackEvent('navigation', 'switch', tool);
  }
  const titles = {
    format: 'JSON 格式化 — DevKit', tree: 'JSON 树形视图 — DevKit',
    convert: 'JSON 转换 — DevKit', diff: 'JSON 对比 — DevKit',
  };
  document.title = titles[tool] || 'DevKit — JSON 在线工具箱';
}

// ── View Switching ──
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.tool));
});

// Handle hash change (browser back/forward)
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '');
  if (VALID_TOOLS.includes(hash)) switchView(hash, false);
});

// Init view from URL on page load
(function initRoute() {
  const hash = location.hash.replace('#', '');
  const tool = VALID_TOOLS.includes(hash) ? hash : 'format';
  switchView(tool, false);
})();

// Keyboard shortcuts (⌘1-4)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    const tools = ['format', 'tree', 'convert', 'diff'];
    switchView(tools[parseInt(e.key) - 1]);
  }
});

// ── Resizer ──
$$('.resizer').forEach(resizer => {
  let startX, leftPane, rightPane, startLeftWidth;
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    leftPane = resizer.previousElementSibling;
    rightPane = resizer.nextElementSibling;
    startLeftWidth = leftPane.offsetWidth;
    resizer.classList.add('active');
    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      const containerWidth = leftPane.parentElement.offsetWidth - 4;
      const newLeftWidth = Math.max(280, Math.min(containerWidth - 280, startLeftWidth + dx));
      const pct = (newLeftWidth / containerWidth) * 100;
      leftPane.style.flex = `0 0 ${pct}%`;
      rightPane.style.flex = `0 0 ${100 - pct}%`;
    };
    const onMouseUp = () => {
      resizer.classList.remove('active');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
});

// ── Drag & Drop ──
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  const pane = e.target.closest('.editor-pane');
  if (pane) pane.classList.add('drop-active');
});
document.addEventListener('dragleave', (e) => {
  const pane = e.target.closest('.editor-pane');
  if (pane) pane.classList.remove('drop-active');
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  $$('.editor-pane').forEach(p => p.classList.remove('drop-active'));
  const file = e.dataTransfer.files[0];
  if (file) {
    if (file.size > 50 * 1024 * 1024) {
      showToast('文件过大（最大 50MB）', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const activeView = $('.view.active');
      const textarea = activeView.querySelector('.code-textarea:not([readonly])');
      if (textarea) {
        textarea.value = ev.target.result;
        textarea.dispatchEvent(new Event('input'));
        showToast(`已加载 ${file.name}（${formatBytes(file.size)}）`, 'success');
      }
    };
    reader.readAsText(file);
  }
});

// ── File Upload Button ──
$('#formatUpload').addEventListener('click', () => {
  $('#fileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast('文件过大（最大 50MB）', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      $('#formatInput').value = ev.target.result;
      showToast(`已加载 ${file.name}`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  $('#fileInput').click();
});

// ── Utility ──
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function countLines(str) {
  if (!str) return 0;
  return str.split('\n').length;
}

function updateStats(prefix, text) {
  const el = (id) => document.getElementById(id);
  if (el(`${prefix}Lines`)) el(`${prefix}Lines`).textContent = countLines(text) + ' 行';
  if (el(`${prefix}Bytes`)) el(`${prefix}Bytes`).textContent = formatBytes(new Blob([text]).size);
}

// ============================================================
// FORMAT MODULE (includes validate)
// ============================================================

async function doFormat(mode) {
  const input = $('#formatInput').value.trim();
  if (!input) { showToast('请输入要处理的 JSON', 'error'); return; }

  const start = performance.now();
  const bigFile = input.length > 1024 * 1024;
  const label = mode === 'format' ? '格式化' : '压缩';
  if (bigFile) showLoading(`正在${label} ${formatBytes(input.length)} 文件...`);

  const lenient = $('#lenientMode')?.checked || false;

  try {
    // Validate first
    const valResult = await workerManager.run('validate', { input, lenient });
    const errorPanel = $('#formatErrorPanel');
    const resultDiv = $('#formatValidateResult');

    if (valResult.valid) {
      // Format/minify
      const indent = $('#indentSelect').value;
      const formatInput = (typeof valResult.cleaned === 'string') ? valResult.cleaned : input;
      const result = await workerManager.run(mode, { input: formatInput, indent });
      const elapsed = Math.round(performance.now() - start);

      clearErrorHighlights();
      // 原地替换输入区内容
      $('#formatInput').value = result.output;
      $('#formatValid').style.display = 'inline';
      $('#formatValid').textContent = '✓ JSON 有效';
      $('#formatError').style.display = 'none';
      $('#formatTime').textContent = `${label}用时 ${elapsed}ms`;
      // 清除错误面板
      if (errorPanel) errorPanel.style.display = 'none';
      updateStats('format', result.output);
      showToast(`${label}成功（${elapsed}ms）`, 'success');
      trackEvent('format', label, `${elapsed}ms`);
    } else {
      // Show errors
      $('#formatValid').style.display = 'none';
      $('#formatError').style.display = 'inline';
      $('#formatError').textContent = `✗ ${valResult.errors.length} 个错误`;
      $('#formatTime').textContent = '';

      let html = '';
      valResult.errors.forEach((err, i) => {
        html += `
          <div class="error-item">
            <div class="error-item-header">
              <span class="error-item-label">错误 ${i + 1}</span>
              <span class="error-item-pos">第 ${err.line} 行，第 ${err.col} 列</span>
            </div>
            <div class="error-item-msg">${escapeHtml(err.message)}</div>
          </div>
        `;
      });
      resultDiv.innerHTML = html;
      errorPanel.style.display = 'block';
      // Highlight error lines in input
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

// Sample data
const SAMPLE_JSON = JSON.stringify({
  "name": "DevKit JSON",
  "version": "1.0.0",
  "description": "JSON 在线工具箱",
  "features": ["格式化", "校验", "树形视图", "转换", "对比"],
  "author": {
    "name": "开发团队",
    "url": "https://devkit.dev"
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

$('#loadSample').addEventListener('click', () => {
  $('#formatInput').value = SAMPLE_JSON;
  updateStats('format', SAMPLE_JSON);
  showToast('已加载示例 JSON', 'success');
  trackEvent('format', 'sample', 'load');
});

// Error line highlighting
function highlightErrorLines(errors) {
  const input = $('#formatInput');
  const parent = input.closest('.editor-area');
  // Remove existing highlights
  clearErrorHighlights();

  if (!errors || errors.length === 0) return;

  const errorLineSet = new Set(errors.map(e => e.line));

  // Try CM6: query line positions from the view
  const cmView = window._cmFormatView;
  if (cmView) {
    // Use CM6 Decoration through StateEffect for reliable highlighting
    // (direct DOM manipulation doesn't survive CM6 re-renders)
    // Fallback: use DOM with scroll-to-line for visibility
    const doc = cmView.state.doc;
    const firstErrorLine = Math.min(...errorLineSet);
    if (firstErrorLine >= 1 && firstErrorLine <= doc.lines) {
      // Scroll to first error line to ensure it's rendered
      const lineInfo = doc.line(firstErrorLine);
      cmView.dispatch({
        effects: cmView.constructor.scrollIntoView ? undefined : undefined,
        selection: { anchor: lineInfo.from }
      });
      cmView.focus();
    }
    // Apply after a tick to let CM6 render
    setTimeout(() => {
      errorLineSet.forEach(lineNum => {
        if (lineNum >= 1 && lineNum <= doc.lines) {
          try {
            const linePos = doc.line(lineNum);
            const dom = cmView.domAtPos(linePos.from);
            let lineEl = dom.node.nodeType === 1 ? dom.node : dom.node.parentElement;
            while (lineEl && !lineEl.classList.contains('cm-line')) {
              lineEl = lineEl.parentElement;
            }
            if (lineEl) {
              lineEl.classList.add('cm-error-line');
            }
          } catch(e) {
            console.warn('Error highlighting line', lineNum, e);
          }
        }
      });
    }, 100);
    window._errorLineCleanup = () => {
      if (cmView.dom) cmView.dom.querySelectorAll('.cm-error-line').forEach(el => el.classList.remove('cm-error-line'));
    };
  } else {
    // Fallback: textarea overlay
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

    input.addEventListener('scroll', function syncErr() {
      overlay.scrollTop = input.scrollTop;
    });
  }
}

function clearErrorHighlights() {
  // Clear CM6 line classes
  if (window._errorLineCleanup) {
    window._errorLineCleanup();
    window._errorLineCleanup = null;
  }
  // Clear overlay fallback
  const el = document.getElementById('errorHighlightOverlay');
  if (el) el.remove();
}

// Format button
$('#formatBtn').addEventListener('click', () => doFormat('format'));

// Minify button
$('#minifyBtn').addEventListener('click', () => doFormat('minify'));

// Input stats
$('#formatInput').addEventListener('input', () => {
  updateStats('format', $('#formatInput').value);
});

// Clear
$('#formatClear').addEventListener('click', () => {
  $('#formatInput').value = '';
  $('#formatValid').style.display = 'none';
  $('#formatError').style.display = 'none';
  $('#formatTime').textContent = '';
  $('#formatErrorPanel').style.display = 'none';
  updateStats('format', '');
});

// Copy
$('#formatCopy').addEventListener('click', () => {
  const output = $('#formatInput').value;
  if (!output) { showToast('没有可复制的内容', 'error'); return; }
  navigator.clipboard.writeText(output).then(() => showToast('已复制到剪贴板', 'success'));
});

// Download
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

// ============================================================
// TREE VIEW MODULE — Virtual Scrolling
// ============================================================
const TREE_ROW_HEIGHT = 28;
const TREE_INDENT_PX = 20;
const TREE_OVERSCAN = 10;

let treeData = null;
let treeFlat = [];       // all nodes flattened
let treeVisible = [];    // currently visible (respecting collapsed)
let treeCollapsed = new Set();  // collapsed node ids
let treeSelectedId = null;
let treeSearchQuery = '';

// Flatten JSON into a flat node array
function flattenTree(data, key, path, depth, parentId) {
  const id = path || '$';
  const node = { id, key, path, depth, parentId, data };

  if (data === null) { node.type = 'null'; node.valueStr = 'null'; return [node]; }
  if (typeof data === 'boolean') { node.type = 'boolean'; node.valueStr = String(data); return [node]; }
  if (typeof data === 'number') { node.type = 'number'; node.valueStr = String(data); return [node]; }
  if (typeof data === 'string') { node.type = 'string'; node.valueStr = `"${data}"`; return [node]; }

  const isArray = Array.isArray(data);
  node.type = isArray ? 'array' : 'object';
  node.isContainer = true;
  const entries = isArray ? data.map((v, i) => [`[${i}]`, v]) : Object.entries(data);
  node.childCount = entries.length;
  node.childIds = [];

  const result = [node];
  entries.forEach(([k, v]) => {
    const childPath = path ? `${path}.${k}` : k;
    const children = flattenTree(v, k, childPath, depth + 1, id);
    node.childIds.push(children[0].id);
    result.push(...children);
  });
  return result;
}

// Build visible list from flat nodes respecting collapsed state
function buildVisibleList(query) {
  const visible = [];
  const hiddenParents = new Set();

  for (const node of treeFlat) {
    // Skip if any ancestor is collapsed
    if (node.parentId && hiddenParents.has(node.parentId)) {
      if (node.isContainer) hiddenParents.add(node.id);
      continue;
    }
    // Search filter
    if (query) {
      const text = `${node.key || ''} ${node.valueStr || ''} ${node.type}`.toLowerCase();
      if (!text.includes(query) && !node.isContainer) continue;
    }
    visible.push(node);
    // If this container is collapsed, mark it so children are hidden
    if (node.isContainer && treeCollapsed.has(node.id)) {
      hiddenParents.add(node.id);
    }
  }
  return visible;
}

// Render a single row element
function renderTreeRow(node) {
  const row = document.createElement('div');
  row.className = 'tree-node' + (node.id === treeSelectedId ? ' selected' : '');
  row.style.height = TREE_ROW_HEIGHT + 'px';
  row.style.paddingLeft = (node.depth * TREE_INDENT_PX + 8) + 'px';
  row.dataset.nodeId = node.id;

  let html = '';
  if (node.isContainer) {
    const collapsed = treeCollapsed.has(node.id);
    html += `<span class="tree-arrow">${collapsed ? '▶' : '▼'}</span>`;
    if (node.key) html += `<span class="tree-key">${escapeHtml(node.key)}</span><span class="tree-colon">:</span>`;
    html += `<span class="type-badge ${node.type}">${node.type}</span>`;
    html += `<span class="tree-count">${node.childCount} ${node.type === 'array' ? '项' : '个键'}</span>`;
  } else {
    html += `<span style="width:16px;display:inline-block"></span>`;
    if (node.key) html += `<span class="tree-key">${escapeHtml(node.key)}</span><span class="tree-colon">:</span>`;
    html += `<span class="tree-value ${node.type}">${escapeHtml(node.valueStr)}</span>`;
    html += `<span class="type-badge ${node.type}" style="margin-left:auto">${node.type}</span>`;
  }
  html += `<button class="tree-copy-btn" title="复制路径"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>`;

  row.innerHTML = html;
  return row;
}

// Virtual scroll renderer
function renderVirtualTree() {
  const container = $('#treeOutput');
  if (treeVisible.length === 0) {
    container.innerHTML = '<div class="empty-state-sm">粘贴 JSON 以查看树形结构</div>';
    return;
  }

  // Setup virtual scroll container
  container.innerHTML = '';
  const totalHeight = treeVisible.length * TREE_ROW_HEIGHT;

  const spacerTop = document.createElement('div');
  spacerTop.className = 'tree-spacer-top';
  const viewport = document.createElement('div');
  viewport.className = 'tree-viewport';
  const spacerBottom = document.createElement('div');
  spacerBottom.className = 'tree-spacer-bottom';

  container.appendChild(spacerTop);
  container.appendChild(viewport);
  container.appendChild(spacerBottom);

  let lastStart = -1, lastEnd = -1;

  function updateVisibleRows() {
    const scrollTop = container.scrollTop;
    const viewHeight = container.clientHeight;
    let start = Math.floor(scrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN;
    let end = Math.ceil((scrollTop + viewHeight) / TREE_ROW_HEIGHT) + TREE_OVERSCAN;
    start = Math.max(0, start);
    end = Math.min(treeVisible.length, end);

    if (start === lastStart && end === lastEnd) return;
    lastStart = start;
    lastEnd = end;

    spacerTop.style.height = (start * TREE_ROW_HEIGHT) + 'px';
    spacerBottom.style.height = ((treeVisible.length - end) * TREE_ROW_HEIGHT) + 'px';

    viewport.innerHTML = '';
    for (let i = start; i < end; i++) {
      viewport.appendChild(renderTreeRow(treeVisible[i]));
    }
  }

  container.addEventListener('scroll', () => requestAnimationFrame(updateVisibleRows));
  updateVisibleRows();

  // Event delegation for clicks
  container.addEventListener('click', (e) => {
    const row = e.target.closest('.tree-node');
    if (!row) return;
    const nodeId = row.dataset.nodeId;

    if (e.target.closest('.tree-copy-btn')) {
      navigator.clipboard.writeText(nodeId).then(() => showToast('路径已复制', 'success'));
      return;
    }

    if (e.target.closest('.tree-arrow')) {
      if (treeCollapsed.has(nodeId)) {
        treeCollapsed.delete(nodeId);
      } else {
        treeCollapsed.add(nodeId);
      }
      treeVisible = buildVisibleList(treeSearchQuery);
      renderVirtualTree();
      // Restore scroll position near the toggled node
      const idx = treeVisible.findIndex(n => n.id === nodeId);
      if (idx >= 0) container.scrollTop = idx * TREE_ROW_HEIGHT;
      return;
    }

    treeSelectedId = nodeId;
    viewport.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
    row.classList.add('selected');
    $('#treePath').textContent = `路径：${nodeId}`;
  });
}

// Main tree input handler
$('#treeInput').addEventListener('input', debounce(() => {
  const input = $('#treeInput').value.trim();
  if (!input) {
    treeFlat = []; treeVisible = []; treeCollapsed.clear();
    $('#treeOutput').innerHTML = '<div class="empty-state-sm">粘贴 JSON 以查看树形结构</div>';
    $('#treeStats').textContent = '';
    return;
  }
  try {
    treeData = JSON.parse(input);
    treeCollapsed.clear();
    treeSearchQuery = '';
    treeFlat = flattenTree(treeData, '', '', 0, null);
    treeVisible = buildVisibleList('');

    const maxDepth = treeFlat.reduce((m, n) => Math.max(m, n.depth), 0);
    const rootInfo = typeof treeData === 'object' && treeData !== null
      ? (Array.isArray(treeData) ? treeData.length + ' 项' : Object.keys(treeData).length + ' 个键')
      : '';
    $('#treeStats').textContent = `${rootInfo} · 共 ${treeFlat.length} 个节点 · 最大深度：${maxDepth}`;

    renderVirtualTree();
  } catch (e) {
    $('#treeOutput').innerHTML = `<div class="empty-state-sm" style="color: var(--error)">JSON 无效：${escapeHtml(e.message)}</div>`;
  }
}, 300));

$('#treeExpandAll').addEventListener('click', () => {
  treeCollapsed.clear();
  treeVisible = buildVisibleList(treeSearchQuery);
  renderVirtualTree();
});
$('#treeCollapseAll').addEventListener('click', () => {
  treeFlat.forEach(n => { if (n.isContainer) treeCollapsed.add(n.id); });
  treeVisible = buildVisibleList(treeSearchQuery);
  renderVirtualTree();
});

$('#treeSearch').addEventListener('input', debounce(() => {
  treeSearchQuery = $('#treeSearch').value.trim().toLowerCase();
  treeVisible = buildVisibleList(treeSearchQuery);
  renderVirtualTree();
}, 200));

// ============================================================
// JSONPATH MODULE
// ============================================================

// Simple JSONPath evaluator supporting: $, ., [], *, .., ?() filter
function evaluateJSONPath(data, expr) {
  if (!expr || expr === '$') return [{ path: '$', value: data }];
  
  const tokens = tokenizeJSONPath(expr);
  let results = [{ path: '$', value: data }];
  
  for (const token of tokens) {
    const next = [];
    for (const { path, value } of results) {
      if (token.type === 'recursive') {
        // .. recursive descent
        collectRecursive(value, path, token.key, next);
      } else if (token.type === 'wildcard') {
        if (typeof value === 'object' && value !== null) {
          const entries = Array.isArray(value)
            ? value.map((v, i) => [`[${i}]`, v])
            : Object.entries(value);
          entries.forEach(([k, v]) => {
            const p = Array.isArray(value) ? `${path}[${k.replace(/[\[\]]/g, '')}]` : `${path}.${k}`;
            next.push({ path: p, value: v });
          });
        }
      } else if (token.type === 'index') {
        if (Array.isArray(value) && value[token.index] !== undefined) {
          next.push({ path: `${path}[${token.index}]`, value: value[token.index] });
        }
      } else if (token.type === 'filter') {
        if (Array.isArray(value)) {
          value.forEach((item, i) => {
            if (typeof item === 'object' && item !== null && matchFilter(item, token.expr)) {
              next.push({ path: `${path}[${i}]`, value: item });
            }
          });
        }
      } else if (token.type === 'key') {
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && token.key in value) {
          next.push({ path: `${path}.${token.key}`, value: value[token.key] });
        }
      }
    }
    results = next;
  }
  return results;
}

function tokenizeJSONPath(expr) {
  const tokens = [];
  let i = 0;
  // Skip leading $
  if (expr[0] === '$') i = 1;
  
  while (i < expr.length) {
    if (expr[i] === '.') {
      if (expr[i+1] === '.') {
        // Recursive descent
        i += 2;
        let key = '';
        while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; }
        tokens.push({ type: 'recursive', key: key || '*' });
      } else {
        i++;
        let key = '';
        while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; }
        if (key === '*') tokens.push({ type: 'wildcard' });
        else if (key) tokens.push({ type: 'key', key });
      }
    } else if (expr[i] === '[') {
      i++;
      if (expr[i] === '*') {
        tokens.push({ type: 'wildcard' });
        i += 2; // skip *]
      } else if (expr[i] === '?') {
        // Filter expression
        i += 2; // skip ?(
        let filterExpr = '';
        let depth = 1;
        while (i < expr.length && depth > 0) {
          if (expr[i] === '(') depth++;
          if (expr[i] === ')') depth--;
          if (depth > 0) filterExpr += expr[i];
          i++;
        }
        i++; // skip ]
        tokens.push({ type: 'filter', expr: filterExpr });
      } else {
        let idx = '';
        while (i < expr.length && expr[i] !== ']') { idx += expr[i]; i++; }
        i++; // skip ]
        if (/^\d+$/.test(idx)) tokens.push({ type: 'index', index: parseInt(idx) });
        else if (idx.startsWith("'") || idx.startsWith('"')) {
          tokens.push({ type: 'key', key: idx.slice(1, -1) });
        }
      }
    } else {
      i++;
    }
  }
  return tokens;
}

function collectRecursive(value, path, key, results) {
  if (typeof value !== 'object' || value === null) return;
  const visited = new Set();

  function recurse(val, p) {
    if (typeof val !== 'object' || val === null) return;
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        const cp = `${p}[${i}]`;
        if (key === '*') { results.push({ path: cp, value: v }); }
        recurse(v, cp);
      });
    } else {
      if (key !== '*' && key in val) {
        const matchPath = `${p}.${key}`;
        if (!visited.has(matchPath)) {
          visited.add(matchPath);
          results.push({ path: matchPath, value: val[key] });
        }
      }
      if (key === '*') {
        Object.entries(val).forEach(([k, v]) => {
          results.push({ path: `${p}.${k}`, value: v });
        });
      }
      Object.entries(val).forEach(([k, v]) => {
        recurse(v, `${p}.${k}`);
      });
    }
  }
  recurse(value, path);
}

function matchFilter(item, expr) {
  // Simple filter: @.key op value
  const m = expr.match(/@\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
  if (!m) return false;
  const [, key, op, rawVal] = m;
  if (!(key in item)) return false;
  let val = rawVal.trim();
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
  else if (val === 'true') val = true;
  else if (val === 'false') val = false;
  else if (val === 'null') val = null;
  else if (!isNaN(Number(val))) val = Number(val);

  const itemVal = item[key];
  switch (op) {
    case '==': return itemVal == val;
    case '!=': return itemVal != val;
    case '>': return itemVal > val;
    case '<': return itemVal < val;
    case '>=': return itemVal >= val;
    case '<=': return itemVal <= val;
  }
  return false;
}

// JSONPath UI
$('#jsonpathInput').addEventListener('input', debounce(() => {
  const expr = '$' + $('#jsonpathInput').value.trim();
  const clearBtn = $('#jsonpathClear');
  const resultsPanel = $('#jsonpathResults');

  if (expr === '$' || !treeData) {
    clearBtn.style.display = 'none';
    resultsPanel.style.display = 'none';
    // Remove highlights
    document.querySelectorAll('.tree-node.jsonpath-match, .tree-node.jsonpath-dimmed').forEach(n => {
      n.classList.remove('jsonpath-match', 'jsonpath-dimmed');
    });
    return;
  }
  clearBtn.style.display = '';

  try {
    const results = evaluateJSONPath(treeData, expr);
    const matchPaths = new Set(results.map(r => r.path));

    // Highlight matched nodes in virtual tree
    document.querySelectorAll('.tree-node').forEach(node => {
      const nodeId = node.dataset.nodeId;
      if (!nodeId) return;
      const fullPath = '$' + (nodeId ? '.' + nodeId : '');
      if (matchPaths.has(fullPath) || matchPaths.has(nodeId)) {
        node.classList.add('jsonpath-match');
        node.classList.remove('jsonpath-dimmed');
      } else {
        node.classList.remove('jsonpath-match');
        node.classList.add('jsonpath-dimmed');
      }
    });

    // Show results panel
    resultsPanel.style.display = 'block';
    $('#jsonpathCount').textContent = `${results.length} 个匹配`;
    $('#jsonpathHint').textContent = '';

    if (results.length === 0) {
      $('#jsonpathList').innerHTML = '<div class="jsonpath-result-item" style="color:var(--text-500);justify-content:center">无匹配结果 · 支持 $ . [] * .. ?() 语法</div>';
    } else {
      $('#jsonpathList').innerHTML = results.slice(0, 100).map(r => {
        const valStr = truncate(JSON.stringify(r.value), 60);
        return `<div class="jsonpath-result-item" data-path="${escapeHtml(r.path)}">
          <span class="jsonpath-result-path">${escapeHtml(r.path)}</span>
          <span class="jsonpath-result-value">${escapeHtml(valStr)}</span>
        </div>`;
      }).join('') + (results.length > 100 ? `<div class="jsonpath-result-item" style="color:var(--text-500)">… 还有 ${results.length - 100} 个结果</div>` : '');
    }
  } catch (e) {
    resultsPanel.style.display = 'block';
    $('#jsonpathCount').textContent = '表达式错误';
    $('#jsonpathHint').textContent = e.message;
    $('#jsonpathList').innerHTML = '';
  }
}, 300));

// Click result to scroll to node in tree
$('#jsonpathList').addEventListener('click', (e) => {
  const item = e.target.closest('.jsonpath-result-item');
  if (!item) return;
  const path = item.dataset.path;
  if (!path) return;

  // Find node in visible tree and scroll to it
  const nodeId = path.startsWith('$.') ? path.substring(2) : path === '$' ? '' : path;
  const idx = treeVisible.findIndex(n => n.id === nodeId || n.path === nodeId);
  if (idx >= 0) {
    const container = $('#treeOutput');
    container.scrollTop = idx * TREE_ROW_HEIGHT;
    treeSelectedId = treeVisible[idx].id;
    // Re-render to show selection
    const viewport = container.querySelector('.tree-viewport');
    if (viewport) {
      viewport.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
      const row = viewport.querySelector(`[data-node-id="${treeVisible[idx].id}"]`);
      if (row) row.classList.add('selected');
    }
    $('#treePath').textContent = `路径：${path}`;
  }
});

$('#jsonpathClear').addEventListener('click', () => {
  $('#jsonpathInput').value = '';
  $('#jsonpathInput').dispatchEvent(new Event('input'));
});

// ============================================================
// CONVERT MODULE
// ============================================================
const formatNames = { json:'JSON', yaml:'YAML', xml:'XML', csv:'CSV', typescript:'TypeScript', go:'Go Struct', java:'Java Class', python:'Python Dataclass', jsonschema:'JSON Schema' };
const formatExts = { json:'.json', yaml:'.yaml', xml:'.xml', csv:'.csv', typescript:'.ts', go:'.go', java:'.java', python:'.py', jsonschema:'.schema.json' };

// Update labels when selects change
function updateConvertLabels() {
  const from = $('#convertFrom').value;
  const to = $('#convertTo').value;
  $('#convertInputLabel').textContent = (formatNames[from] || from.toUpperCase()) + ' 输入';
  $('#convertOutputLabel').textContent = (formatNames[to] || to.toUpperCase()) + ' 输出';
}
function updateConvertOptions() {
  const to = $('#convertTo').value;
  // Hide all options first
  $$('.convert-option').forEach(el => el.style.display = 'none');
  // Show relevant options
  if (to === 'java') {
    $('#optGetterSetter').style.display = '';
    $('#optLombok').style.display = '';
  } else if (to === 'typescript') {
    $('#optInterface').style.display = '';
  } else if (to === 'python') {
    $('#optPydantic').style.display = '';
  }
}
$('#convertFrom').addEventListener('change', () => { updateConvertLabels(); updateConvertOptions(); });
$('#convertTo').addEventListener('change', () => { updateConvertLabels(); updateConvertOptions(); });
updateConvertLabels();
updateConvertOptions();

// Swap direction
$('#convertSwap').addEventListener('click', () => {
  const from = $('#convertFrom');
  const to = $('#convertTo');
  const fromVal = from.value;
  const toVal = to.value;
  // Only swap if both values exist in both selects
  const fromOpts = [...from.options].map(o => o.value);
  const toOpts = [...to.options].map(o => o.value);
  if (fromOpts.includes(toVal) && toOpts.includes(fromVal)) {
    from.value = toVal;
    to.value = fromVal;
    updateConvertLabels();
  } else {
    showToast('无法交换：目标格式不支持作为源格式', 'error');
  }
});

// Convert button
$('#convertBtn').addEventListener('click', () => {
  const input = $('#convertInput').value.trim();
  if (!input) { showToast('请输入要转换的内容', 'error'); return; }

  const from = $('#convertFrom').value;
  const to = $('#convertTo').value;
  if (from === to) { showToast('源格式和目标格式相同', 'error'); return; }

  const start = performance.now();
  try {
    const options = {
      getterSetter: $('#convertGetterSetter')?.checked || false,
      lombok: $('#convertLombok')?.checked || false,
      useInterface: $('#convertInterface')?.checked !== false,
      pydantic: $('#convertPydantic')?.checked || false,
    };
    const result = Converters.convert(input, from, to, options);
    const elapsed = Math.round(performance.now() - start);
    $('#convertOutput').value = result;
    $('#convertStatus').textContent = `${formatNames[from]} → ${formatNames[to]}`;
    $('#convertTime').textContent = `转换用时 ${elapsed}ms`;
    showToast(`转换成功（${elapsed}ms）`, 'success');
    trackEvent('convert', `${from}-to-${to}`, `${elapsed}ms`);
  } catch (err) {
    $('#convertOutput').value = '';
    $('#convertStatus').textContent = '';
    $('#convertTime').textContent = '';
    showToast('转换失败：' + err.message, 'error');
  }
});

// Clear
$('#convertClear').addEventListener('click', () => {
  $('#convertInput').value = '';
  $('#convertOutput').value = '';
  $('#convertStatus').textContent = '';
  $('#convertTime').textContent = '';
});

// Copy
$('#convertCopy').addEventListener('click', () => {
  const output = $('#convertOutput').value;
  if (!output) { showToast('没有可复制的内容', 'error'); return; }
  navigator.clipboard.writeText(output).then(() => showToast('已复制到剪贴板', 'success'));
});

// Download
$('#convertDownload').addEventListener('click', () => {
  const output = $('#convertOutput').value;
  if (!output) { showToast('没有可下载的内容', 'error'); return; }
  const to = $('#convertTo').value;
  const ext = formatExts[to] || '.txt';
  const mimeTypes = { json:'application/json', yaml:'text/yaml', xml:'application/xml', csv:'text/csv' };
  const blob = new Blob([output], { type: mimeTypes[to] || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'converted' + ext; a.click();
  URL.revokeObjectURL(url);
  showToast(`已下载 converted${ext}`, 'success');
});

// ============================================================
// DIFF MODULE
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

function truncate(str, max = 80) {
  return str.length > max ? str.substring(0, max) + '…' : str;
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
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
