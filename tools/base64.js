// ============================================================
// Base64 编解码工具
// ============================================================

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default {
  id: 'base64',
  name: 'Base64 编解码',

  init(container) {
    container.innerHTML = `
      <h1 class="seo-h1">Base64 编解码 — 在线文本/图片 Base64 编码解码工具</h1>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn-primary" id="base64Encode">编码</button>
          <button class="btn-secondary" id="base64Decode">解码</button>
          <label class="checkbox-label">
            <input type="checkbox" id="base64UrlSafe"> URL 安全模式
          </label>
        </div>
        <div class="toolbar-right">
          <button class="btn-icon" id="base64Swap" title="交换输入输出">⇄</button>
          <button class="btn-icon" id="base64Copy" title="复制结果">复制</button>
          <button class="btn-icon" id="base64Clear" title="清空">清空</button>
        </div>
      </div>
      <div class="editor-split">
        <div class="editor-pane">
          <div class="pane-header"><span class="pane-label">输入</span></div>
          <div class="editor-area">
            <textarea id="base64Input" class="code-textarea" placeholder="输入文本或 Base64 字符串..."></textarea>
          </div>
        </div>
        <div class="resizer"></div>
        <div class="editor-pane">
          <div class="pane-header"><span class="pane-label">输出</span></div>
          <div class="editor-area">
            <textarea id="base64Output" class="code-textarea" readonly placeholder="结果将显示在这里..."></textarea>
          </div>
        </div>
      </div>
      <div class="statusbar">
        <span id="base64Status">就绪</span>
        <span id="base64Info"></span>
      </div>
    `;

    // Upload support
    const input = container.querySelector('#base64Input');
    const output = container.querySelector('#base64Output');

    container.querySelector('#base64Encode').addEventListener('click', () => {
      const text = input.value;
      if (!text) return;
      try {
        const urlSafe = container.querySelector('#base64UrlSafe').checked;
        let result = btoa(unescape(encodeURIComponent(text)));
        if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        output.value = result;
        container.querySelector('#base64Status').textContent = `编码成功（${text.length} → ${result.length} 字符）`;
      } catch (e) {
        output.value = '编码失败：' + e.message;
        container.querySelector('#base64Status').textContent = '编码失败';
      }
    });

    container.querySelector('#base64Decode').addEventListener('click', () => {
      let text = input.value.trim();
      if (!text) return;
      try {
        // Restore URL-safe encoding
        text = text.replace(/-/g, '+').replace(/_/g, '/');
        while (text.length % 4) text += '=';
        const result = decodeURIComponent(escape(atob(text)));
        output.value = result;
        container.querySelector('#base64Status').textContent = `解码成功（${input.value.length} → ${result.length} 字符）`;
      } catch (e) {
        output.value = '解码失败：不是有效的 Base64 字符串';
        container.querySelector('#base64Status').textContent = '解码失败';
      }
    });

    container.querySelector('#base64Swap').addEventListener('click', () => {
      const tmp = input.value;
      input.value = output.value;
      output.value = tmp;
    });

    container.querySelector('#base64Copy').addEventListener('click', () => {
      const text = output.value;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        container.querySelector('#base64Status').textContent = '已复制到剪贴板';
      });
    });

    container.querySelector('#base64Clear').addEventListener('click', () => {
      input.value = '';
      output.value = '';
      container.querySelector('#base64Status').textContent = '就绪';
    });
  }
};
