// ============================================================
// DevKit JSON — Main Application
// ============================================================
import { initConvert } from './pages/json/modules/convert.js';
import { initFormat } from './pages/json/modules/format.js';
import { initTree } from './pages/json/modules/tree.js';
import { initDiff } from './pages/json/modules/diff.js';

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


// ── Format Module (extracted to modules/format.js) ──
initFormat({ $, $$, showToast, showLoading, hideLoading, trackEvent, updateStats, formatBytes, escapeHtml, workerManager });


// ── Tree + JSONPath Module (extracted to modules/tree.js) ──
initTree({ $, $$, showToast, escapeHtml, debounce, truncate });

// ── Convert Module (extracted to modules/convert.js) ──
initConvert({ $, $$, showToast, trackEvent });


// ── Diff Module (extracted to modules/diff.js) ──
initDiff({ $, $$, showToast, escapeHtml, formatBytes, trackEvent, truncate, debounce, workerManager });

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, max = 80) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
