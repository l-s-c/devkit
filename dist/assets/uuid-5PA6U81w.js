function x(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}const o={id:"uuid",name:"UUID 生成器",init(e){e.innerHTML=`
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
    `;function t(){const u=Math.min(1e3,Math.max(1,parseInt(e.querySelector("#uuidCount").value)||5)),d=e.querySelector("#uuidUpper").checked,s=e.querySelector("#uuidNoDash").checked,i=[];for(let a=0;a<u;a++){let l=x();s&&(l=l.replace(/-/g,"")),d&&(l=l.toUpperCase()),i.push(l)}e.querySelector("#uuidOutput").value=i.join(`
`),e.querySelector("#uuidStatus").textContent=`已生成 ${u} 个 UUID`}e.querySelector("#uuidGen").addEventListener("click",t),e.querySelector("#uuidCopy").addEventListener("click",()=>{const u=e.querySelector("#uuidOutput").value;u&&navigator.clipboard.writeText(u).then(()=>{e.querySelector("#uuidStatus").textContent="已复制到剪贴板"})}),t()}};export{o as default};
