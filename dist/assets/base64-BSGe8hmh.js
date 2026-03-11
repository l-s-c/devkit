const r={id:"base64",name:"Base64 编解码",init(e){e.innerHTML=`
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
    `;const l=e.querySelector("#base64Input"),a=e.querySelector("#base64Output");e.querySelector("#base64Encode").addEventListener("click",()=>{const t=l.value;if(t)try{const s=e.querySelector("#base64UrlSafe").checked;let c=btoa(unescape(encodeURIComponent(t)));s&&(c=c.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")),a.value=c,e.querySelector("#base64Status").textContent=`编码成功（${t.length} → ${c.length} 字符）`}catch(s){a.value="编码失败："+s.message,e.querySelector("#base64Status").textContent="编码失败"}}),e.querySelector("#base64Decode").addEventListener("click",()=>{let t=l.value.trim();if(t)try{for(t=t.replace(/-/g,"+").replace(/_/g,"/");t.length%4;)t+="=";const s=decodeURIComponent(escape(atob(t)));a.value=s,e.querySelector("#base64Status").textContent=`解码成功（${l.value.length} → ${s.length} 字符）`}catch{a.value="解码失败：不是有效的 Base64 字符串",e.querySelector("#base64Status").textContent="解码失败"}}),e.querySelector("#base64Swap").addEventListener("click",()=>{const t=l.value;l.value=a.value,a.value=t}),e.querySelector("#base64Copy").addEventListener("click",()=>{const t=a.value;t&&navigator.clipboard.writeText(t).then(()=>{e.querySelector("#base64Status").textContent="已复制到剪贴板"})}),e.querySelector("#base64Clear").addEventListener("click",()=>{l.value="",a.value="",e.querySelector("#base64Status").textContent="就绪"})}};export{r as default};
