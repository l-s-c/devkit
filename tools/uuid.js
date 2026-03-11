// ============================================================
// UUID 生成器
// ============================================================

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default {
  id: 'uuid',
  name: 'UUID 生成器',

  init(container) {
    container.innerHTML = `
      <h1 class="seo-h1">UUID 生成器 — 在线批量生成 UUID v4</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:16px;height:100%">
        <div class="toolbar">
          <div class="toolbar-left">
            <label style="font-size:13px;color:var(--text-400)">数量</label>
            <input type="number" id="uuidCount" class="input-sm" value="5" min="1" max="1000" style="width:80px">
            <label class="checkbox-label">
              <input type="checkbox" id="uuidUpper"> 大写
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="uuidNoDash"> 无连字符
            </label>
            <button class="btn-primary" id="uuidGen">生成</button>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" id="uuidCopy" title="复制全部">复制</button>
          </div>
        </div>
        <div class="editor-area" style="flex:1">
          <textarea id="uuidOutput" class="code-textarea" readonly placeholder="点击「生成」生成 UUID..."></textarea>
        </div>
        <div class="statusbar"><span id="uuidStatus">就绪</span></div>
      </div>
    `;

    function generate() {
      const count = Math.min(1000, Math.max(1, parseInt(container.querySelector('#uuidCount').value) || 5));
      const upper = container.querySelector('#uuidUpper').checked;
      const noDash = container.querySelector('#uuidNoDash').checked;
      const uuids = [];
      for (let i = 0; i < count; i++) {
        let u = uuidv4();
        if (noDash) u = u.replace(/-/g, '');
        if (upper) u = u.toUpperCase();
        uuids.push(u);
      }
      container.querySelector('#uuidOutput').value = uuids.join('\n');
      container.querySelector('#uuidStatus').textContent = `已生成 ${count} 个 UUID`;
    }

    container.querySelector('#uuidGen').addEventListener('click', generate);
    container.querySelector('#uuidCopy').addEventListener('click', () => {
      const text = container.querySelector('#uuidOutput').value;
      if (text) navigator.clipboard.writeText(text).then(() => {
        container.querySelector('#uuidStatus').textContent = '已复制到剪贴板';
      });
    });

    // Generate on load
    generate();
  }
};
