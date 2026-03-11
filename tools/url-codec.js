// ============================================================
// URL 编解码工具
// ============================================================

export default {
  id: 'url-codec',
  name: 'URL 编解码',

  init(container) {
    container.innerHTML = `
      <h1 class="seo-h1">URL 编解码 — 在线 URL Encode/Decode 工具</h1>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn-primary" id="urlEncode">编码</button>
          <button class="btn-secondary" id="urlDecode">解码</button>
          <select class="select-sm" id="urlMode">
            <option value="component">encodeURIComponent</option>
            <option value="uri">encodeURI</option>
          </select>
        </div>
        <div class="toolbar-right">
          <button class="btn-icon" id="urlSwap" title="交换">⇄</button>
          <button class="btn-icon" id="urlCopy" title="复制">复制</button>
          <button class="btn-icon" id="urlClear" title="清空">清空</button>
        </div>
      </div>
      <div class="editor-split">
        <div class="editor-pane">
          <div class="pane-header"><span class="pane-label">输入</span></div>
          <div class="editor-area">
            <textarea id="urlInput" class="code-textarea" placeholder="输入 URL 或文本..."></textarea>
          </div>
        </div>
        <div class="resizer"></div>
        <div class="editor-pane">
          <div class="pane-header"><span class="pane-label">输出</span></div>
          <div class="editor-area">
            <textarea id="urlOutput" class="code-textarea" readonly placeholder="结果将显示在这里..."></textarea>
          </div>
        </div>
      </div>
      <div class="statusbar"><span id="urlStatus">就绪</span></div>
    `;

    const input = container.querySelector('#urlInput');
    const output = container.querySelector('#urlOutput');
    const mode = container.querySelector('#urlMode');

    container.querySelector('#urlEncode').addEventListener('click', () => {
      const text = input.value;
      if (!text) return;
      const result = mode.value === 'component' ? encodeURIComponent(text) : encodeURI(text);
      output.value = result;
      container.querySelector('#urlStatus').textContent = `编码成功（${text.length} → ${result.length} 字符）`;
    });

    container.querySelector('#urlDecode').addEventListener('click', () => {
      const text = input.value;
      if (!text) return;
      try {
        const result = mode.value === 'component' ? decodeURIComponent(text) : decodeURI(text);
        output.value = result;
        container.querySelector('#urlStatus').textContent = `解码成功（${text.length} → ${result.length} 字符）`;
      } catch (e) {
        output.value = '解码失败：无效的编码字符串';
        container.querySelector('#urlStatus').textContent = '解码失败';
      }
    });

    container.querySelector('#urlSwap').addEventListener('click', () => {
      const tmp = input.value; input.value = output.value; output.value = tmp;
    });
    container.querySelector('#urlCopy').addEventListener('click', () => {
      if (output.value) navigator.clipboard.writeText(output.value).then(() => {
        container.querySelector('#urlStatus').textContent = '已复制到剪贴板';
      });
    });
    container.querySelector('#urlClear').addEventListener('click', () => {
      input.value = ''; output.value = '';
      container.querySelector('#urlStatus').textContent = '就绪';
    });
  }
};
