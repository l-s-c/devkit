// ============================================================
// JWT 解码器
// ============================================================

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default {
  id: 'jwt',
  name: 'JWT 解码',

  init(container) {
    container.innerHTML = `
      <h1 class="seo-h1">JWT 解码器 — 在线解析 JSON Web Token</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:16px;height:100%">
        <div class="toolbar">
          <div class="toolbar-left">
            <button class="btn-primary" id="jwtDecode">解码</button>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" id="jwtClear" title="清空">清空</button>
          </div>
        </div>
        <div class="editor-area" style="flex:0 0 30%">
          <textarea id="jwtInput" class="code-textarea" placeholder="粘贴 JWT token（eyJhbG...）"></textarea>
        </div>
        <div id="jwtResults" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
          <div style="text-align:center;color:var(--text-500);padding:40px">粘贴 JWT 后点击「解码」</div>
        </div>
        <div class="statusbar"><span id="jwtStatus">就绪</span></div>
      </div>
    `;

    container.querySelector('#jwtDecode').addEventListener('click', () => {
      const token = container.querySelector('#jwtInput').value.trim();
      if (!token) return;

      const parts = token.split('.');
      if (parts.length !== 3) {
        container.querySelector('#jwtResults').innerHTML = '<div style="color:var(--error);padding:20px">无效的 JWT 格式（应有 3 段，用 . 分隔）</div>';
        container.querySelector('#jwtStatus').textContent = '解码失败';
        return;
      }

      try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2];

        // Check expiration
        let expInfo = '';
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const isExpired = expDate < new Date();
          expInfo = `<div style="margin-top:8px;padding:8px 12px;border-radius:4px;font-size:12px;background:${isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'};color:${isExpired ? 'var(--error)' : 'var(--success)'}">
            ${isExpired ? '⚠ 已过期' : '✓ 未过期'} — 过期时间: ${expDate.toLocaleString('zh-CN')}
          </div>`;
        }
        if (payload.iat) {
          expInfo += `<div style="font-size:11px;color:var(--text-500);margin-top:4px">签发时间: ${new Date(payload.iat * 1000).toLocaleString('zh-CN')}</div>`;
        }

        container.querySelector('#jwtResults').innerHTML = `
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">HEADER</div>
            <pre style="margin:0;font-size:12px;color:var(--text-300);font-family:'JetBrains Mono',monospace;white-space:pre-wrap">${escapeHtml(JSON.stringify(header, null, 2))}</pre>
          </div>
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">PAYLOAD</div>
            <pre style="margin:0;font-size:12px;color:var(--text-300);font-family:'JetBrains Mono',monospace;white-space:pre-wrap">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
            ${expInfo}
          </div>
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">SIGNATURE</div>
            <code style="font-size:11px;color:var(--text-400);word-break:break-all;font-family:'JetBrains Mono',monospace">${escapeHtml(signature)}</code>
          </div>
        `;
        container.querySelector('#jwtStatus').textContent = `解码成功 — 算法: ${header.alg || 'unknown'}`;
      } catch (e) {
        container.querySelector('#jwtResults').innerHTML = `<div style="color:var(--error);padding:20px">解码失败：${escapeHtml(e.message)}</div>`;
        container.querySelector('#jwtStatus').textContent = '解码失败';
      }
    });

    container.querySelector('#jwtClear').addEventListener('click', () => {
      container.querySelector('#jwtInput').value = '';
      container.querySelector('#jwtResults').innerHTML = '<div style="text-align:center;color:var(--text-500);padding:40px">粘贴 JWT 后点击「解码」</div>';
      container.querySelector('#jwtStatus').textContent = '就绪';
    });
  }
};
