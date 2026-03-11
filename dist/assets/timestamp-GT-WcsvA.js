const c={id:"timestamp",name:"时间戳转换",init(t){const r=Math.floor(Date.now()/1e3);t.innerHTML=`
      <h1 class="seo-h1">时间戳转换 — Unix 时间戳在线转换工具</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:24px;height:100%;overflow-y:auto">
        <!-- Current time -->
        <div class="tool-card">
          <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-300)">当前时间</h3>
          <div style="font-family:'JetBrains Mono',monospace;font-size:24px;color:var(--brand-500)" id="tsNow">${r}</div>
          <div style="font-size:13px;color:var(--text-400);margin-top:4px" id="tsNowReadable">${new Date().toLocaleString("zh-CN")}</div>
          <button class="btn-secondary" id="tsCopyNow" style="margin-top:8px">复制当前时间戳</button>
        </div>

        <!-- Timestamp → Date -->
        <div class="tool-card">
          <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-300)">时间戳 → 日期时间</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="tsInput" class="input-sm" placeholder="输入 Unix 时间戳" style="flex:1;font-family:'JetBrains Mono',monospace" value="${r}">
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
    `;const l=t.querySelector("#tsNow"),d=t.querySelector("#tsNowReadable");this._timer=setInterval(()=>{const e=Math.floor(Date.now()/1e3);l.textContent=e,d.textContent=new Date().toLocaleString("zh-CN")},1e3),t.querySelector("#tsCopyNow").addEventListener("click",()=>{navigator.clipboard.writeText(l.textContent)});const p=t.querySelector("#tsDateInput"),o=new Date;p.value=o.getFullYear()+"-"+String(o.getMonth()+1).padStart(2,"0")+"-"+String(o.getDate()).padStart(2,"0")+"T"+String(o.getHours()).padStart(2,"0")+":"+String(o.getMinutes()).padStart(2,"0")+":"+String(o.getSeconds()).padStart(2,"0"),t.querySelector("#tsToDate").addEventListener("click",()=>{const e=t.querySelector("#tsInput").value.trim(),s=t.querySelector("#tsUnit").value;if(!e)return;const a=parseInt(e);if(isNaN(a)){t.querySelector("#tsDateResult").textContent="无效的时间戳";return}const i=s==="s"?a*1e3:a,n=new Date(i);t.querySelector("#tsDateResult").innerHTML=[`本地时间: ${n.toLocaleString("zh-CN")}`,`UTC 时间: ${n.toUTCString()}`,`ISO 8601: ${n.toISOString()}`,`秒: ${Math.floor(i/1e3)}`,`毫秒: ${i}`].join("<br>")}),t.querySelector("#tsToDate").click(),t.querySelector("#tsToTimestamp").addEventListener("click",()=>{const e=p.value;if(!e)return;const s=new Date(e),a=Math.floor(s.getTime()/1e3);t.querySelector("#tsTimestampResult").innerHTML=[`秒: ${a}`,`毫秒: ${s.getTime()}`,`ISO 8601: ${s.toISOString()}`].join("<br>")})},destroy(){this._timer&&clearInterval(this._timer)}};export{c as default};
