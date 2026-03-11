function d(e){for(e=e.replace(/-/g,"+").replace(/_/g,"/");e.length%4;)e+="=";return decodeURIComponent(escape(atob(e)))}function a(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const c={id:"jwt",name:"JWT 解码",init(e){e.innerHTML=`
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
    `,e.querySelector("#jwtDecode").addEventListener("click",()=>{const n=e.querySelector("#jwtInput").value.trim();if(!n)return;const r=n.split(".");if(r.length!==3){e.querySelector("#jwtResults").innerHTML='<div style="color:var(--error);padding:20px">无效的 JWT 格式（应有 3 段，用 . 分隔）</div>',e.querySelector("#jwtStatus").textContent="解码失败";return}try{const o=JSON.parse(d(r[0])),t=JSON.parse(d(r[1])),p=r[2];let i="";if(t.exp){const s=new Date(t.exp*1e3),l=s<new Date;i=`<div style="margin-top:8px;padding:8px 12px;border-radius:4px;font-size:12px;background:${l?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)"};color:${l?"var(--error)":"var(--success)"}">
            ${l?"⚠ 已过期":"✓ 未过期"} — 过期时间: ${s.toLocaleString("zh-CN")}
          </div>`}t.iat&&(i+=`<div style="font-size:11px;color:var(--text-500);margin-top:4px">签发时间: ${new Date(t.iat*1e3).toLocaleString("zh-CN")}</div>`),e.querySelector("#jwtResults").innerHTML=`
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">HEADER</div>
            <pre style="margin:0;font-size:12px;color:var(--text-300);font-family:'JetBrains Mono',monospace;white-space:pre-wrap">${a(JSON.stringify(o,null,2))}</pre>
          </div>
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">PAYLOAD</div>
            <pre style="margin:0;font-size:12px;color:var(--text-300);font-family:'JetBrains Mono',monospace;white-space:pre-wrap">${a(JSON.stringify(t,null,2))}</pre>
            ${i}
          </div>
          <div style="background:var(--bg-850);padding:14px;border-radius:6px">
            <div style="font-size:12px;font-weight:600;color:var(--brand-500);margin-bottom:8px">SIGNATURE</div>
            <code style="font-size:11px;color:var(--text-400);word-break:break-all;font-family:'JetBrains Mono',monospace">${a(p)}</code>
          </div>
        `,e.querySelector("#jwtStatus").textContent=`解码成功 — 算法: ${o.alg||"unknown"}`}catch(o){e.querySelector("#jwtResults").innerHTML=`<div style="color:var(--error);padding:20px">解码失败：${a(o.message)}</div>`,e.querySelector("#jwtStatus").textContent="解码失败"}}),e.querySelector("#jwtClear").addEventListener("click",()=>{e.querySelector("#jwtInput").value="",e.querySelector("#jwtResults").innerHTML='<div style="text-align:center;color:var(--text-500);padding:40px">粘贴 JWT 后点击「解码」</div>',e.querySelector("#jwtStatus").textContent="就绪"})}};export{c as default};
