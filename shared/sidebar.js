// sidebar.js — V4 右侧广告栏 + 底部浮动条
// flex 布局 + sticky 定位，≥1380px 显示右栏，窄屏底部浮动操作条
(function(){
  // 首页和全屏工具跳过
  const path = location.pathname;
  if (path.endsWith('/pages/') || path.endsWith('/pages/index.html')) return;
  const SKIP = ['/json/','/json-schema/','/code-formatter/','/sql-formatter/'];
  if (SKIP.some(s => path.includes(s))) return;

  const base = '../';

  // CSS
  const style = document.createElement('style');
  style.textContent = `
/* V4 sidebar layout */
@media(min-width:1380px){
  .dk-page-wrap{display:flex;justify-content:center;gap:24px;padding:0 24px}
  .dk-page-wrap>.main{max-width:960px;width:100%;min-width:0;margin:0}
}
.dk-sidebar{width:280px;flex-shrink:0;display:none;position:sticky;top:80px;align-self:flex-start}
@media(min-width:1380px){.dk-sidebar{display:block}}
.dk-sb-section{background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:16px;margin-bottom:12px}
/* Action row */
.dk-act-row{display:flex;justify-content:center;gap:4px}
.dk-act{width:40px;height:40px;border-radius:10px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:var(--bg-card,#fff);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-caption,#9CA3AF);transition:all 150ms;position:relative}
.dk-act svg{width:18px;height:18px;fill:currentColor}
.dk-act:hover{border-color:var(--brand-500,#6366F1);color:var(--brand-500,#6366F1);transform:translateY(-1px)}
.dk-act:active{transform:scale(0.95)}
.dk-act.fav{color:#EF4444;border-color:#EF4444}
/* Ad slot */
.dk-ad-slot{border-radius:10px;overflow:hidden;aspect-ratio:300/250;display:flex;align-items:center;justify-content:center;border:1px dashed var(--border-glass,rgba(0,0,0,0.08))}
.dk-ad-slot.s1{background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.08))}
.dk-ad-slot.s2{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.08))}
.dk-ad-label{font-size:10px;color:var(--text-caption,#9CA3AF);font-weight:600;letter-spacing:1px}
/* Hot tools */
.dk-hot-title{font-size:11px;font-weight:800;color:var(--text-caption,#9CA3AF);margin-bottom:10px;display:flex;align-items:center;gap:4px}
.dk-hot-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:all 150ms;text-decoration:none;color:var(--text-primary,#1D1D1F)}
.dk-hot-item:hover{background:rgba(99,102,241,0.06)}
.dk-hot-item:active{transform:scale(0.98)}
.dk-hot-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.dk-hot-name{font-size:12px;font-weight:700}
.dk-hot-desc{font-size:10px;color:var(--text-caption,#9CA3AF)}
/* Bottom bar (mobile) */
.dk-bottom{display:flex;position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:22px;box-shadow:0 4px 24px rgba(0,0,0,0.12);padding:6px 12px;gap:4px;z-index:90}
@media(min-width:1380px){.dk-bottom{display:none}}
.dk-bottom .dk-act{border:none;background:transparent}
`;
  document.head.appendChild(style);

  // Wrap .main in flex container for sidebar layout
  const main = document.querySelector('.main');
  if (main) {
    const wrap = document.createElement('div');
    wrap.className = 'dk-page-wrap';
    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(main);

    // Sidebar
    const aside = document.createElement('aside');
    aside.className = 'dk-sidebar';
    aside.innerHTML = `
      <div class="dk-sb-section">
        <div class="dk-act-row">
          <button class="dk-act" title="分享" onclick="if(navigator.share)navigator.share({title:document.title,url:location.href});else{navigator.clipboard.writeText(location.href);this.title='已复制!'}"><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>
          <button class="dk-act" title="收藏" onclick="this.classList.toggle('fav')"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
          <button class="dk-act" title="复制链接" onclick="navigator.clipboard.writeText(location.href);this.title='已复制!'"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>
          <button class="dk-act" title="反馈" onclick="window.open('https://github.com/l-s-c/devkit/issues','_blank')"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>
        </div>
      </div>
      <div class="dk-sb-section" style="padding:0;overflow:hidden">
        <div class="dk-ad-slot s1"><span class="dk-ad-label">📢 广告 · 300×250</span></div>
      </div>
      <div class="dk-sb-section">
        <div class="dk-hot-title">⭐ 热门工具</div>
        <a class="dk-hot-item" href="${base}base64/"><div class="dk-hot-icon" style="background:rgba(245,158,11,0.1)">🔐</div><div><div class="dk-hot-name">Base64 编解码</div><div class="dk-hot-desc">文本与 Base64 互转</div></div></a>
        <a class="dk-hot-item" href="${base}timestamp/"><div class="dk-hot-icon" style="background:rgba(59,130,246,0.1)">⏰</div><div><div class="dk-hot-name">时间戳转换</div><div class="dk-hot-desc">Unix 时间戳 ↔ 日期</div></div></a>
        <a class="dk-hot-item" href="${base}color/"><div class="dk-hot-icon" style="background:rgba(236,72,153,0.1)">🎨</div><div><div class="dk-hot-name">颜色转换器</div><div class="dk-hot-desc">HEX / RGB / HSL</div></div></a>
        <a class="dk-hot-item" href="${base}hash/"><div class="dk-hot-icon" style="background:rgba(16,185,129,0.1)">#</div><div><div class="dk-hot-name">Hash 计算</div><div class="dk-hot-desc">MD5 / SHA1 / SHA256</div></div></a>
      </div>
      <div class="dk-sb-section" style="padding:0;overflow:hidden">
        <div class="dk-ad-slot s2"><span class="dk-ad-label">📢 广告 · 300×250</span></div>
      </div>
    `;
    wrap.appendChild(aside);
  }

  // Bottom bar (mobile)
  const bottom = document.createElement('div');
  bottom.className = 'dk-bottom';
  bottom.innerHTML = `
    <button class="dk-act" title="分享" onclick="if(navigator.share)navigator.share({title:document.title,url:location.href});else navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>
    <button class="dk-act" title="收藏" onclick="this.classList.toggle('fav')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
    <button class="dk-act" title="复制链接" onclick="navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>
    <button class="dk-act" title="反馈" onclick="window.open('https://github.com/l-s-c/devkit/issues','_blank')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>
    <button class="dk-act" title="回到顶部" onclick="scrollTo({top:0,behavior:'smooth'})"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg></button>
  `;
  document.body.appendChild(bottom);
})();
