// sidebar.js — V3 右侧边栏动态注入组件
// ≥1380px 显示右栏（广告+热门推荐），窄屏显示底部浮动操作栏
(function(){
  const isIndex = location.pathname.endsWith('/pages/') || location.pathname.endsWith('/pages/index.html');
  if (isIndex) return; // 首页不显示侧边栏

  // 注入CSS
  const style = document.createElement('style');
  style.textContent = `
.dk-sidebar{position:fixed;right:24px;top:80px;width:300px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 104px);overflow-y:auto;scrollbar-width:none;z-index:50}
.dk-sidebar::-webkit-scrollbar{display:none}
@media(max-width:1379px){.dk-sidebar{display:none!important}}
/* Action bar */
.dk-actions{display:flex;align-items:center;justify-content:center;gap:0;background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:4px}
.dk-abtn{width:40px;height:40px;border-radius:10px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-caption,#9CA3AF);transition:all 200ms;position:relative}
.dk-abtn svg{width:18px;height:18px;fill:currentColor}
.dk-abtn:hover{background:rgba(99,102,241,0.08);color:var(--brand-500,#6366F1)}
.dk-abtn:active{transform:scale(0.94)}
.dk-abtn.fav{color:#EF4444}
.dk-asep{width:1px;height:20px;background:var(--border-glass,rgba(0,0,0,0.08));margin:0 2px;flex-shrink:0}
.dk-tip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);padding:3px 8px;border-radius:6px;background:var(--text-primary,#1D1D1F);color:var(--bg-page,#F2F2F7);font-size:10px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 150ms}
.dk-abtn:hover .dk-tip{opacity:1}
/* Ad card */
.dk-ad{background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.04);overflow:hidden}
.dk-ad-head{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:0.5px solid var(--border-glass,rgba(0,0,0,0.08))}
.dk-ad-tag{font-size:9px;font-weight:700;color:var(--text-caption,#9CA3AF);letter-spacing:0.8px}
.dk-ad-x{width:20px;height:20px;border-radius:6px;background:transparent;border:none;cursor:pointer;color:var(--text-caption,#9CA3AF);font-size:14px;opacity:0;transition:opacity 200ms}
.dk-ad:hover .dk-ad-x{opacity:1}
.dk-ad-body{width:300px;height:250px;display:flex;align-items:center;justify-content:center}
.dk-ad-demo{width:100%;height:100%;display:flex;flex-direction:column;cursor:pointer}
.dk-ad-hero{flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.dk-ad-hero.purple{background:linear-gradient(135deg,#667eea,#764ba2)}
.dk-ad-hero.teal{background:linear-gradient(135deg,#0EA5E9,#2DD4BF)}
.dk-ad-hero span{font-size:40px;z-index:1}
.dk-ad-info{padding:14px 16px}
.dk-ad-title{font-size:14px;font-weight:700;color:var(--text-primary,#1D1D1F);margin-bottom:4px}
.dk-ad-desc{font-size:11px;color:var(--text-caption,#9CA3AF);margin-bottom:10px}
.dk-ad-cta{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#fff;background:linear-gradient(135deg,#6366F1,#A855F7);padding:6px 14px;border-radius:8px}
.dk-ad-foot{padding:6px 12px;border-top:0.5px solid var(--border-glass,rgba(0,0,0,0.08));text-align:center;font-size:8px;color:var(--text-caption,#9CA3AF)}
/* Rec card */
.dk-rec{background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.04);padding:16px}
.dk-rec-title{font-size:12px;font-weight:700;color:var(--text-secondary,#6E6E73);margin-bottom:12px}
.dk-rec-list{display:flex;flex-direction:column;gap:8px}
.dk-rec-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:all 200ms;text-decoration:none;color:var(--text-primary,#1D1D1F)}
.dk-rec-item:hover{background:rgba(99,102,241,0.08)}
.dk-rec-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:rgba(99,102,241,0.08)}
.dk-rec-name{font-size:13px;font-weight:600}
.dk-rec-desc{font-size:10px;color:var(--text-caption,#9CA3AF);margin-top:1px}
/* Mobile action bar */
@media(max-width:1379px){
  .dk-mobile-bar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:0;background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:4px}
}
@media(min-width:1380px){.dk-mobile-bar{display:none!important}}
`;
  document.head.appendChild(style);

  // Determine base path for tool links
  const base = '../';

  // Sidebar HTML
  const sidebar = document.createElement('aside');
  sidebar.className = 'dk-sidebar';
  sidebar.innerHTML = `
    <div class="dk-actions">
      <button class="dk-abtn" onclick="if(navigator.share)navigator.share({title:document.title,url:location.href});else{navigator.clipboard.writeText(location.href);this.querySelector('.dk-tip').textContent='已复制!'}"><span class="dk-tip">分享</span><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>
      <button class="dk-abtn" onclick="this.classList.toggle('fav')"><span class="dk-tip">收藏</span><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
      <div class="dk-asep"></div>
      <button class="dk-abtn" onclick="navigator.clipboard.writeText(location.href);this.querySelector('.dk-tip').textContent='已复制!'"><span class="dk-tip">复制链接</span><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>
      <button class="dk-abtn" onclick="window.open('https://github.com/l-s-c/devkit/issues','_blank')"><span class="dk-tip">反馈</span><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>
    </div>
    <div class="dk-ad">
      <div class="dk-ad-head"><span class="dk-ad-tag">广告</span><button class="dk-ad-x" onclick="this.closest('.dk-ad').style.display='none'">×</button></div>
      <div class="dk-ad-body"><div class="dk-ad-demo"><div class="dk-ad-hero purple"><span>☁️</span></div><div class="dk-ad-info"><div class="dk-ad-title">腾讯云轻量服务器 2核4G 仅38元/月</div><div class="dk-ad-desc">新用户专享，高性能云服务器限时秒杀</div><span class="dk-ad-cta">立即抢购 →</span></div></div></div>
      <div class="dk-ad-foot">百度联盟推广</div>
    </div>
    <div class="dk-rec">
      <div class="dk-rec-title">⭐ 热门工具</div>
      <div class="dk-rec-list">
        <a class="dk-rec-item" href="${base}base64/"><div class="dk-rec-icon">🔐</div><div><div class="dk-rec-name">Base64 编解码</div><div class="dk-rec-desc">文本与 Base64 互转</div></div></a>
        <a class="dk-rec-item" href="${base}timestamp/"><div class="dk-rec-icon">⏱️</div><div><div class="dk-rec-name">时间戳转换</div><div class="dk-rec-desc">Unix 时间戳 ↔ 日期</div></div></a>
        <a class="dk-rec-item" href="${base}color/"><div class="dk-rec-icon">🎨</div><div><div class="dk-rec-name">颜色转换器</div><div class="dk-rec-desc">HEX / RGB / HSL 互转</div></div></a>
        <a class="dk-rec-item" href="${base}hash/"><div class="dk-rec-icon">#️⃣</div><div><div class="dk-rec-name">Hash 计算</div><div class="dk-rec-desc">MD5 / SHA1 / SHA256</div></div></a>
      </div>
    </div>
    <div class="dk-ad">
      <div class="dk-ad-head"><span class="dk-ad-tag">广告</span><button class="dk-ad-x" onclick="this.closest('.dk-ad').style.display='none'">×</button></div>
      <div class="dk-ad-body"><div class="dk-ad-demo"><div class="dk-ad-hero teal"><span>🚀</span></div><div class="dk-ad-info"><div class="dk-ad-title">Vercel 部署前端项目 秒级上线</div><div class="dk-ad-desc">零配置、自动 HTTPS、全球 CDN 加速</div><span class="dk-ad-cta">免费试用 →</span></div></div></div>
      <div class="dk-ad-foot">百度联盟推广</div>
    </div>
  `;
  document.body.appendChild(sidebar);

  // Mobile action bar (≤1379px)
  const mobile = document.createElement('div');
  mobile.className = 'dk-mobile-bar';
  mobile.innerHTML = `
    <button class="dk-abtn" onclick="if(navigator.share)navigator.share({title:document.title,url:location.href});else navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>
    <button class="dk-abtn" onclick="this.classList.toggle('fav')"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
    <div class="dk-asep"></div>
    <button class="dk-abtn" onclick="navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>
    <button class="dk-abtn" onclick="window.open('https://github.com/l-s-c/devkit/issues','_blank')"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>
  `;
  document.body.appendChild(mobile);
})();
