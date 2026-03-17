// sidebar.js — 侧边栏：内容区在剩余空间居中
(function(){
  var path = location.pathname;
  var clean = path.replace(/\/devkit\/?/, '/');
  if (clean === '/' || clean === '/index.html' || clean === '/pages/' || clean === '/pages/index.html') return;
  var SKIP = ['/json/','/json-schema/','/code-formatter/','/sql-formatter/','/base64/','/url-codec/','/yaml/','/periodic-table/','/color/','/text-diff/','/regex/','/hash/','/jwt/','/uuid/','/markdown/'];
  if (SKIP.some(function(s){return path.includes(s)})) return;

  var SIDEBAR_W = 280;
  var GAP = 24;
  var RIGHT = 24;
  var TOTAL_RIGHT = SIDEBAR_W + GAP + RIGHT; // 328px
  var BREAKPOINT = 1380;
  var base = '../';

  var style = document.createElement('style');
  style.textContent = [
    // 侧边栏
    '.dk-sidebar{width:'+SIDEBAR_W+'px;display:none;position:fixed;right:'+RIGHT+'px;max-height:calc(100vh - 96px);overflow-y:auto;scrollbar-width:none;z-index:40}',
    '.dk-sidebar::-webkit-scrollbar{display:none}',
    // 核心：≥断点时，内容区在去除侧边栏后的剩余空间居中
    '@media(min-width:'+BREAKPOINT+'px){',
    '  .dk-sidebar{display:block}',
    '  .main{margin-left:calc((100vw - '+TOTAL_RIGHT+'px) / 2 - 480px) !important;margin-right:'+TOTAL_RIGHT+'px !important}',
    '}',
    // 侧边栏样式
    '.dk-sb-section{background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:12px;margin-bottom:10px}',
    '.dk-act-row{display:flex;justify-content:center;gap:3px}',
    '.dk-act{width:36px;height:36px;border-radius:9px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:var(--bg-card,#fff);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-caption,#9CA3AF);transition:all 150ms}',
    '.dk-act svg{width:16px;height:16px;fill:currentColor}',
    '.dk-act:hover{border-color:var(--brand-500,#6366F1);color:var(--brand-500,#6366F1);transform:translateY(-1px)}',
    '.dk-act:active{transform:scale(0.95)}',
    '.dk-act.fav{color:#EF4444;border-color:#EF4444}',
    '.dk-ad-slot{border-radius:10px;overflow:hidden;aspect-ratio:300/250;display:flex;align-items:center;justify-content:center;border:1px dashed var(--border-glass,rgba(0,0,0,0.08));background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(168,85,247,0.06))}',
    '.dk-ad-label{font-size:9px;color:var(--text-caption,#9CA3AF);font-weight:600;letter-spacing:1px}',
    '.dk-hot-title{font-size:10px;font-weight:800;color:var(--text-caption,#9CA3AF);margin-bottom:8px}',
    '.dk-hot-item{display:flex;align-items:center;gap:8px;padding:6px;border-radius:7px;cursor:pointer;transition:all 150ms;text-decoration:none;color:var(--text-primary,#1D1D1F)}',
    '.dk-hot-item:hover{background:rgba(99,102,241,0.06)}',
    '.dk-hot-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:rgba(99,102,241,0.08)}',
    '.dk-hot-name{font-size:11px;font-weight:700}',
    '.dk-hot-desc{font-size:9px;color:var(--text-caption,#9CA3AF)}'
  ].join('\n');
  document.head.appendChild(style);

  var aside = document.createElement('aside');
  aside.className = 'dk-sidebar';
  aside.innerHTML = '<div class="dk-sb-section"><div class="dk-act-row">'
    +'<button class="dk-act" title="分享" onclick="if(navigator.share)navigator.share({title:document.title,url:location.href});else navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>'
    +'<button class="dk-act" title="收藏" onclick="this.classList.toggle(\'fav\')"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>'
    +'<button class="dk-act" title="复制链接" onclick="navigator.clipboard.writeText(location.href)"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>'
    +'<button class="dk-act" title="反馈" onclick="window.open(\'https://github.com/l-s-c/devkit/issues\',\'_blank\')"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>'
    +'</div></div>'
    +'<div class="dk-sb-section" style="padding:8px;overflow:hidden"><div class="dk-ad-slot"><span class="dk-ad-label">📢 广告 300×250</span></div></div>'
    +'<div class="dk-sb-section"><div class="dk-hot-title">⭐ 热门工具</div>'
    +'<a class="dk-hot-item" href="'+base+'base64/"><div class="dk-hot-icon">🔐</div><div><div class="dk-hot-name">Base64</div><div class="dk-hot-desc">编解码</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'timestamp/"><div class="dk-hot-icon">⏰</div><div><div class="dk-hot-name">时间戳</div><div class="dk-hot-desc">Unix ↔ 日期</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'color/"><div class="dk-hot-icon">🎨</div><div><div class="dk-hot-name">颜色转换</div><div class="dk-hot-desc">HEX/RGB/HSL</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'hash/"><div class="dk-hot-icon">#</div><div><div class="dk-hot-name">Hash</div><div class="dk-hot-desc">MD5/SHA</div></div></a>'
    +'</div>';

  // 动态对齐顶部
  var mainEl = document.querySelector('.main');
  if (mainEl) aside.style.top = mainEl.offsetTop + 'px';

  document.body.appendChild(aside);
})();
