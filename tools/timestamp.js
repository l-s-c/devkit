// ============================================================
// 时间戳转换工具
// ============================================================

export default {
  id: 'timestamp',
  name: '时间戳转换',

  init(container) {
    const now = Math.floor(Date.now() / 1000);
    container.innerHTML = `
      <h1 class="seo-h1">时间戳转换 — Unix 时间戳在线转换工具</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:24px;height:100%;overflow-y:auto">
        <!-- Current time -->
        <div class="tool-card">
          <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-300)">当前时间</h3>
          <div style="font-family:'JetBrains Mono',monospace;font-size:24px;color:var(--brand-500)" id="tsNow">${now}</div>
          <div style="font-size:13px;color:var(--text-400);margin-top:4px" id="tsNowReadable">${new Date().toLocaleString('zh-CN')}</div>
          <button class="btn-secondary" id="tsCopyNow" style="margin-top:8px">复制当前时间戳</button>
        </div>

        <!-- Timestamp → Date -->
        <div class="tool-card">
          <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-300)">时间戳 → 日期时间</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="tsInput" class="input-sm" placeholder="输入 Unix 时间戳" style="flex:1;font-family:'JetBrains Mono',monospace" value="${now}">
            <select class="select-sm" id="tsUnit">
              <option value="s">秒</option>
              <option value="ms">毫秒</option>
            </select>
            <button class="btn-primary" id="tsToDate">转换 →</button>
          </div>
          <div id="tsDateResult" style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--text-200);background:var(--bg-850);padding:12px;border-radius:6px">
          </div>
        </div>

        <!-- Date → Timestamp -->
        <div class="tool-card">
          <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-300)">日期时间 → 时间戳</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="datetime-local" id="tsDateInput" class="input-sm" style="flex:1" step="1">
            <button class="btn-primary" id="tsToTimestamp">← 转换</button>
          </div>
          <div id="tsTimestampResult" style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--text-200);background:var(--bg-850);padding:12px;border-radius:6px">
          </div>
        </div>
      </div>
    `;

    // Update current time every second
    const nowEl = container.querySelector('#tsNow');
    const nowReadable = container.querySelector('#tsNowReadable');
    this._timer = setInterval(() => {
      const s = Math.floor(Date.now() / 1000);
      nowEl.textContent = s;
      nowReadable.textContent = new Date().toLocaleString('zh-CN');
    }, 1000);

    // Copy current
    container.querySelector('#tsCopyNow').addEventListener('click', () => {
      navigator.clipboard.writeText(nowEl.textContent);
    });

    // Set datetime-local to now
    const dtInput = container.querySelector('#tsDateInput');
    const d = new Date();
    dtInput.value = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');

    // Timestamp → Date
    container.querySelector('#tsToDate').addEventListener('click', () => {
      const val = container.querySelector('#tsInput').value.trim();
      const unit = container.querySelector('#tsUnit').value;
      if (!val) return;
      const ts = parseInt(val);
      if (isNaN(ts)) { container.querySelector('#tsDateResult').textContent = '无效的时间戳'; return; }
      const ms = unit === 's' ? ts * 1000 : ts;
      const date = new Date(ms);
      container.querySelector('#tsDateResult').innerHTML = [
        `本地时间: ${date.toLocaleString('zh-CN')}`,
        `UTC 时间: ${date.toUTCString()}`,
        `ISO 8601: ${date.toISOString()}`,
        `秒: ${Math.floor(ms/1000)}`,
        `毫秒: ${ms}`,
      ].join('<br>');
    });

    // Auto-convert on load
    container.querySelector('#tsToDate').click();

    // Date → Timestamp
    container.querySelector('#tsToTimestamp').addEventListener('click', () => {
      const val = dtInput.value;
      if (!val) return;
      const date = new Date(val);
      const s = Math.floor(date.getTime() / 1000);
      container.querySelector('#tsTimestampResult').innerHTML = [
        `秒: ${s}`,
        `毫秒: ${date.getTime()}`,
        `ISO 8601: ${date.toISOString()}`,
      ].join('<br>');
    });
  },

  destroy() {
    if (this._timer) clearInterval(this._timer);
  }
};
