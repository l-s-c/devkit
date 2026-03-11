// Theme toggle — shared across all pages
const saved = localStorage.getItem('devkit-theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);

export function toggleTheme() {
  const html = document.documentElement;
  const btn = document.querySelector('.theme-btn');
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('devkit-theme', 'light');
    if (btn) btn.textContent = '🌙';
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('devkit-theme', 'dark');
    if (btn) btn.textContent = '☀️';
  }
}

// Auto-set button text on load
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.theme-btn');
  if (btn) btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
});

window.toggleTheme = toggleTheme;

// Toast utility
let toastEl;
export function showToast(msg, ms = 1500) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
}
window.showToast = showToast;

// Copy with toast
export function copyText(text, label = '已复制') {
  navigator.clipboard.writeText(text).then(() => showToast(label));
}
window.copyText = copyText;
