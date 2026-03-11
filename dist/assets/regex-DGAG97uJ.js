function a(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const L={id:"regex",name:"正则测试",init(r){r.innerHTML=`
      <h1 class="seo-h1">正则表达式测试 — 在线 Regex 测试工具</h1>
      <div class="tool-panel" style="padding:24px;display:flex;flex-direction:column;gap:12px;height:100%">
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:16px;color:var(--text-400);font-family:'JetBrains Mono',monospace">/</span>
          <input type="text" id="regexPattern" class="input-sm" placeholder="输入正则表达式" style="flex:1;font-family:'JetBrains Mono',monospace;font-size:14px">
          <span style="font-size:16px;color:var(--text-400);font-family:'JetBrains Mono',monospace">/</span>
          <input type="text" id="regexFlags" class="input-sm" value="gm" placeholder="flags" style="width:60px;font-family:'JetBrains Mono',monospace">
        </div>
        <div style="display:flex;gap:8px;font-size:12px">
          <label class="checkbox-label"><input type="checkbox" id="regexG" checked> global (g)</label>
          <label class="checkbox-label"><input type="checkbox" id="regexI"> 忽略大小写 (i)</label>
          <label class="checkbox-label"><input type="checkbox" id="regexM" checked> 多行 (m)</label>
          <label class="checkbox-label"><input type="checkbox" id="regexS"> dotAll (s)</label>
        </div>
        <div class="editor-area" style="flex:1;position:relative">
          <textarea id="regexText" class="code-textarea" placeholder="输入要测试的文本..." style="position:absolute;inset:0;color:transparent;caret-color:var(--text-200);background:transparent;z-index:2"></textarea>
          <pre id="regexHighlight" style="position:absolute;inset:0;margin:0;padding:12px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;overflow:auto;color:var(--text-200);z-index:1;pointer-events:none"></pre>
        </div>
        <div id="regexMatches" style="flex:0 0 30%;overflow-y:auto;background:var(--bg-850);border-radius:6px;padding:12px">
          <div style="text-align:center;color:var(--text-500)">输入正则和文本开始匹配</div>
        </div>
        <div class="statusbar"><span id="regexStatus">就绪</span></div>
      </div>
    `;const b=r.querySelector("#regexPattern"),i=r.querySelector("#regexFlags"),c=r.querySelector("#regexText"),x=r.querySelector("#regexHighlight"),p=r.querySelector("#regexMatches"),g=r.querySelector("#regexStatus"),m={g:"#regexG",i:"#regexI",m:"#regexM",s:"#regexS"};Object.entries(m).forEach(([s,t])=>{r.querySelector(t).addEventListener("change",v=>{let l=i.value;v.target.checked?l.includes(s)||(l+=s):l=l.replace(s,""),i.value=l,u()})}),i.addEventListener("input",()=>{Object.entries(m).forEach(([s,t])=>{r.querySelector(t).checked=i.value.includes(s)}),u()}),c.addEventListener("scroll",()=>{x.scrollTop=c.scrollTop,x.scrollLeft=c.scrollLeft});function u(){const s=b.value,t=c.value,v=i.value;if(!s||!t){x.innerHTML=a(t||""),p.innerHTML='<div style="text-align:center;color:var(--text-500)">输入正则和文本开始匹配</div>',g.textContent="就绪";return}try{const l=new RegExp(s,v),d=[];let e,h=0,n="";const f=["rgba(99,102,241,0.25)","rgba(16,185,129,0.25)","rgba(245,158,11,0.25)","rgba(239,68,68,0.25)"];if(v.includes("g")){let o=0;for(;(e=l.exec(t))!==null;){if(e.index===l.lastIndex){l.lastIndex++;continue}const y=f[o%f.length];if(n+=a(t.slice(h,e.index)),n+=`<mark style="background:${y};border-radius:2px">${a(e[0])}</mark>`,d.push({index:e.index,text:e[0],groups:e.slice(1)}),h=l.lastIndex,o++,o>1e4)break}n+=a(t.slice(h))}else e=l.exec(t),e?(n=a(t.slice(0,e.index)),n+=`<mark style="background:${f[0]};border-radius:2px">${a(e[0])}</mark>`,n+=a(t.slice(e.index+e[0].length)),d.push({index:e.index,text:e[0],groups:e.slice(1)})):n=a(t);x.innerHTML=n,d.length===0?(p.innerHTML='<div style="color:var(--text-500)">没有匹配</div>',g.textContent="0 个匹配"):(p.innerHTML=d.map((o,y)=>`
            <div style="padding:6px 0;border-bottom:1px solid var(--bg-700);font-size:12px">
              <span style="color:var(--brand-500);font-weight:600">匹配 ${y+1}</span>
              <span style="color:var(--text-500);margin-left:8px">位置 ${o.index}</span>
              <div style="font-family:'JetBrains Mono',monospace;color:var(--text-200);margin-top:2px">${a(o.text)}</div>
              ${o.groups.length?`<div style="color:var(--text-500);margin-top:2px">${o.groups.map((k,M)=>`分组${M+1}: ${a(k||"")}`).join(" · ")}</div>`:""}
            </div>
          `).join(""),g.textContent=`${d.length} 个匹配`)}catch(l){x.innerHTML=a(t),p.innerHTML=`<div style="color:var(--error)">${a(l.message)}</div>`,g.textContent="正则语法错误"}}b.addEventListener("input",u),c.addEventListener("input",u)}};export{L as default};
