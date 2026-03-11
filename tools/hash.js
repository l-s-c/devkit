// ============================================================
// Hash 生成器 — MD5/SHA-1/SHA-256/SHA-512
// ============================================================

async function computeHash(algorithm, text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  id: 'hash',
  name: 'Hash 生成器',

  init(container) {
    container.innerHTML = `
      <h1 class="seo-h1">Hash 生成器 — MD5/SHA1/SHA256/SHA512 在线计算</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:16px;height:100%">
        <div class="toolbar">
          <div class="toolbar-left">
            <button class="btn-primary" id="hashCalc">计算 Hash</button>
            <label class="checkbox-label">
              <input type="checkbox" id="hashUpper"> 大写
            </label>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" id="hashClear" title="清空">清空</button>
          </div>
        </div>
        <div class="editor-area" style="flex:0 0 40%">
          <textarea id="hashInput" class="code-textarea" placeholder="输入要计算 Hash 的文本..."></textarea>
        </div>
        <div id="hashResults" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
        </div>
        <div class="statusbar"><span id="hashStatus">就绪</span></div>
      </div>
    `;

    const algorithms = [
      { name: 'SHA-1', id: 'SHA-1' },
      { name: 'SHA-256', id: 'SHA-256' },
      { name: 'SHA-384', id: 'SHA-384' },
      { name: 'SHA-512', id: 'SHA-512' },
    ];

    async function calculate() {
      const text = container.querySelector('#hashInput').value;
      if (!text) return;
      const upper = container.querySelector('#hashUpper').checked;
      const results = container.querySelector('#hashResults');

      const entries = await Promise.all(algorithms.map(async alg => {
        const hash = await computeHash(alg.id, text);
        return { name: alg.name, hash: upper ? hash.toUpperCase() : hash };
      }));

      results.innerHTML = entries.map(e => `
        <div style="background:var(--bg-850);padding:10px 14px;border-radius:6px;display:flex;align-items:center;gap:12px">
          <span style="font-size:12px;font-weight:600;color:var(--brand-500);min-width:60px">${e.name}</span>
          <code style="flex:1;font-size:12px;color:var(--text-300);word-break:break-all;font-family:'JetBrains Mono',monospace">${e.hash}</code>
          <button class="btn-icon hash-copy-btn" data-hash="${e.hash}" title="复制" style="flex-shrink:0">复制</button>
        </div>
      `).join('');

      // Note: MD5 not available in Web Crypto API
      results.innerHTML += `<div style="font-size:11px;color:var(--text-600);padding:4px 14px">⚠ MD5 不安全且 Web Crypto API 不支持，建议使用 SHA-256</div>`;

      container.querySelector('#hashStatus').textContent = `已计算 ${algorithms.length} 种 Hash（${text.length} 字符）`;
    }

    container.querySelector('#hashCalc').addEventListener('click', calculate);
    container.querySelector('#hashResults').addEventListener('click', (e) => {
      const btn = e.target.closest('.hash-copy-btn');
      if (btn) {
        navigator.clipboard.writeText(btn.dataset.hash).then(() => {
          container.querySelector('#hashStatus').textContent = '已复制到剪贴板';
        });
      }
    });
    container.querySelector('#hashClear').addEventListener('click', () => {
      container.querySelector('#hashInput').value = '';
      container.querySelector('#hashResults').innerHTML = '';
      container.querySelector('#hashStatus').textContent = '就绪';
    });
  }
};
