import"./modulepreload-polyfill-B5Qt9EMX.js";import"./theme-CrLl7tUf.js";function b(t){const r=[];t=t.replace(/```(\w*)\n([\s\S]*?)```/g,(c,o,s)=>(r.push(`<pre><code>${f(s.trim())}</code></pre>`),`%%CODEBLOCK_${r.length-1}%%`)),t=t.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm,(c,o,s,m)=>{const d=s.split("|").filter(Boolean).map(n=>(n=n.trim(),n.startsWith(":")&&n.endsWith(":")?"center":n.endsWith(":")?"right":"left")),g=o.split("|").filter(Boolean).map((n,p)=>`<th style="text-align:${d[p]||"left"}">${n.trim()}</th>`).join(""),u=m.trim().split(`
`).filter(Boolean).map(n=>`<tr>${n.split("|").filter(Boolean).map((h,$)=>`<td style="text-align:${d[$]||"left"}">${h.trim()}</td>`).join("")}</tr>`).join("");return`<table><thead><tr>${g}</tr></thead><tbody>${u}</tbody></table>`});let l=t.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/^######\s+(.+)$/gm,"<h6>$1</h6>").replace(/^#####\s+(.+)$/gm,"<h5>$1</h5>").replace(/^####\s+(.+)$/gm,"<h4>$1</h4>").replace(/^###\s+(.+)$/gm,"<h3>$1</h3>").replace(/^##\s+(.+)$/gm,"<h2>$1</h2>").replace(/^#\s+(.+)$/gm,"<h1>$1</h1>").replace(/^---+$/gm,"<hr>").replace(/^>\s+(.+)$/gm,"<blockquote><p>$1</p></blockquote>").replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/~~(.+?)~~/g,"<del>$1</del>").replace(/^[-*]\s+\[x\]\s+(.+)$/gim,'<li class="task"><input type="checkbox" checked disabled> $1</li>').replace(/^[-*]\s+\[\s?\]\s+(.+)$/gm,'<li class="task"><input type="checkbox" disabled> $1</li>').replace(/^[-*]\s+(.+)$/gm,"<li>$1</li>").replace(/^\d+\.\s+(.+)$/gm,"<li>$1</li>").replace(/^(?!<[huplobid\|t]|<li|<hr|<pre|<block|<table|%%CODE)(.+)$/gm,"<p>$1</p>");return l=l.replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g,"<ul>$1</ul>"),r.forEach((c,o)=>{l=l.replace(`%%CODEBLOCK_${o}%%`,c)}),l}function f(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const e=document.getElementById("editor"),i=document.getElementById("preview");function a(){i.innerHTML=b(e.value),document.getElementById("charCount").textContent=`${e.value.length} 字符`,document.getElementById("lineCount").textContent=`${e.value.split(`
`).length} 行`}e.addEventListener("input",a);a();e.addEventListener("keydown",t=>{if(t.key==="Tab"){t.preventDefault();const r=e.selectionStart;e.value=e.value.slice(0,r)+"  "+e.value.slice(e.selectionEnd),e.selectionStart=e.selectionEnd=r+2,a()}});document.getElementById("btnSample").addEventListener("click",()=>{e.value=`# DevKit 使用指南

## 功能列表

DevKit 是面向开发者的在线工具箱，包含以下工具：

- **JSON 格式化** — 格式化、压缩、校验
- **Base64 编解码** — 支持 URL 安全模式
- **正则表达式测试** — 实时高亮匹配

## 代码示例

\`\`\`javascript
const uuid = crypto.randomUUID();
console.log(uuid);
\`\`\`

> 所有数据仅在浏览器本地处理，不会上传到服务器。

## 对比表

| 工具 | 状态 | 说明 |
| --- | --- | --- |
| JSON | ✅ | 格式化 + 校验 + 对比 |
| Base64 | ✅ | 编码 + 解码 |
| Hash | ✅ | SHA-1/256/384/512 |

---

*Made with ❤️ by DevKit*`,a()});document.getElementById("btnCopyHtml").addEventListener("click",()=>{navigator.clipboard.writeText(i.innerHTML)});document.getElementById("btnExport").addEventListener("click",()=>{const t=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Markdown Export</title><style>body{max-width:800px;margin:40px auto;padding:0 20px;font-family:-apple-system,sans-serif;line-height:1.7}code{background:#f4f4f5;padding:2px 6px;border-radius:3px}pre{background:#f4f4f5;padding:16px;border-radius:8px;overflow-x:auto}blockquote{border-left:3px solid #6366f1;padding:4px 16px;color:#666}</style></head><body>${i.innerHTML}
</body></html>`,r=new Blob([t],{type:"text/html"}),l=document.createElement("a");l.href=URL.createObjectURL(r),l.download="export.html",l.click()});document.getElementById("btnClear").addEventListener("click",()=>{e.value="",i.innerHTML="",a()});
