const r={id:"url-codec",name:"URL 编解码",init(e){e.innerHTML=`
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
    `;const o=e.querySelector("#urlInput"),l=e.querySelector("#urlOutput"),u=e.querySelector("#urlMode");e.querySelector("#urlEncode").addEventListener("click",()=>{const t=o.value;if(!t)return;const a=u.value==="component"?encodeURIComponent(t):encodeURI(t);l.value=a,e.querySelector("#urlStatus").textContent=`编码成功（${t.length} → ${a.length} 字符）`}),e.querySelector("#urlDecode").addEventListener("click",()=>{const t=o.value;if(t)try{const a=u.value==="component"?decodeURIComponent(t):decodeURI(t);l.value=a,e.querySelector("#urlStatus").textContent=`解码成功（${t.length} → ${a.length} 字符）`}catch{l.value="解码失败：无效的编码字符串",e.querySelector("#urlStatus").textContent="解码失败"}}),e.querySelector("#urlSwap").addEventListener("click",()=>{const t=o.value;o.value=l.value,l.value=t}),e.querySelector("#urlCopy").addEventListener("click",()=>{l.value&&navigator.clipboard.writeText(l.value).then(()=>{e.querySelector("#urlStatus").textContent="已复制到剪贴板"})}),e.querySelector("#urlClear").addEventListener("click",()=>{o.value="",l.value="",e.querySelector("#urlStatus").textContent="就绪"})}};export{r as default};
