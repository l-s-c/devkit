async function i(e,l){const t=new TextEncoder().encode(l),a=await crypto.subtle.digest(e,t);return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,"0")).join("")}const c={id:"hash",name:"Hash 生成器",init(e){e.innerHTML=`
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
    `;const l=[{name:"SHA-1",id:"SHA-1"},{name:"SHA-256",id:"SHA-256"},{name:"SHA-384",id:"SHA-384"},{name:"SHA-512",id:"SHA-512"}];async function o(){const t=e.querySelector("#hashInput").value;if(!t)return;const a=e.querySelector("#hashUpper").checked,r=e.querySelector("#hashResults"),n=await Promise.all(l.map(async s=>{const h=await i(s.id,t);return{name:s.name,hash:a?h.toUpperCase():h}}));r.innerHTML=n.map(s=>`
        <div style="background:var(--bg-850);padding:10px 14px;border-radius:6px;display:flex;align-items:center;gap:12px">
          <span style="font-size:12px;font-weight:600;color:var(--brand-500);min-width:60px">${s.name}</span>
          <code style="flex:1;font-size:12px;color:var(--text-300);word-break:break-all;font-family:'JetBrains Mono',monospace">${s.hash}</code>
          <button class="btn-icon hash-copy-btn" data-hash="${s.hash}" title="复制" style="flex-shrink:0">复制</button>
        </div>
      `).join(""),r.innerHTML+='<div style="font-size:11px;color:var(--text-600);padding:4px 14px">⚠ MD5 不安全且 Web Crypto API 不支持，建议使用 SHA-256</div>',e.querySelector("#hashStatus").textContent=`已计算 ${l.length} 种 Hash（${t.length} 字符）`}e.querySelector("#hashCalc").addEventListener("click",o),e.querySelector("#hashResults").addEventListener("click",t=>{const a=t.target.closest(".hash-copy-btn");a&&navigator.clipboard.writeText(a.dataset.hash).then(()=>{e.querySelector("#hashStatus").textContent="已复制到剪贴板"})}),e.querySelector("#hashClear").addEventListener("click",()=>{e.querySelector("#hashInput").value="",e.querySelector("#hashResults").innerHTML="",e.querySelector("#hashStatus").textContent="就绪"})}};export{c as default};
