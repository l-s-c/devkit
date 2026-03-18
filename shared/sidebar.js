// sidebar.js — 侧边栏V5：按钮交互 + 品牌广告占位
(function(){
  var path = location.pathname;
  var clean = path.replace(/\/devkit\/?/, '/');
  if (clean === '/' || clean === '/index.html' || clean === '/pages/' || clean === '/pages/index.html') return;
  var SKIP = ['/json/','/json-schema/','/code-formatter/','/sql-formatter/','/base64/','/url-codec/','/yaml/','/periodic-table/','/color/','/text-diff/','/regex/','/hash/','/jwt/','/uuid/','/markdown/'];
  if (SKIP.some(function(s){return path.includes(s)})) return;

  var SIDEBAR_W = 280;
  var GAP = 24;
  var RIGHT = 24;
  var TOTAL_RIGHT = SIDEBAR_W + GAP + RIGHT;
  var BREAKPOINT = 1380;
  var base = '../';
  var isMac = navigator.platform.indexOf('Mac') > -1;

  var style = document.createElement('style');
  style.textContent = [
    '.dk-sidebar{width:'+SIDEBAR_W+'px;display:none;position:fixed;right:'+RIGHT+'px;max-height:calc(100vh - 96px);overflow-y:auto;scrollbar-width:none;z-index:40}',
    '.dk-sidebar::-webkit-scrollbar{display:none}',
    '@media(min-width:'+BREAKPOINT+'px){',
    '  .dk-sidebar{display:block}',
    '  .main{margin-left:calc((100vw - '+TOTAL_RIGHT+'px) / 2 - 480px) !important;margin-right:'+TOTAL_RIGHT+'px !important}',
    '}',
    '.dk-sb-section{background:var(--bg-glass,rgba(255,255,255,0.72));backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:12px;margin-bottom:10px}',
    '.dk-act-row{display:flex;justify-content:center;gap:3px}',
    '.dk-act{width:36px;height:36px;border-radius:9px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:var(--bg-card,#fff);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-caption,#9CA3AF);transition:all 150ms;position:relative}',
    '.dk-act svg{width:16px;height:16px;fill:currentColor}',
    '.dk-act:hover{border-color:var(--brand-500,#6366F1);color:var(--brand-500,#6366F1);transform:translateY(-1px)}',
    '.dk-act:active{transform:scale(0.95)}',

    // 分享弹窗
    '.dk-share-popup{position:fixed;width:200px;background:var(--bg-glass,rgba(255,255,255,0.85));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.12);padding:14px;z-index:9999;display:none}',
    '.dk-share-popup.show{display:block}',
    '.dk-share-title{font-size:11px;font-weight:800;color:var(--text-primary,#1D1D1F);margin-bottom:10px;text-align:center}',
    '.dk-share-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}',
    '.dk-share-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:8px;cursor:pointer;transition:all 150ms;border:none;background:transparent}',
    '.dk-share-item:hover{background:rgba(99,102,241,0.06)}',
    '.dk-share-item:active{transform:scale(0.96)}',
    '.dk-share-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}',
    '.dk-share-label{font-size:9px;font-weight:700;color:var(--text-caption,#9CA3AF)}',
    '.dk-share-qr{width:100%;aspect-ratio:1;border-radius:8px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:#f9f9f9;display:flex;align-items:center;justify-content:center;margin-bottom:6px}',
    '.dk-share-qr canvas{border-radius:6px}',
    '.dk-share-hint{font-size:9px;color:var(--text-caption,#9CA3AF);text-align:center}',
    // 收藏提示
    '.dk-fav-toast{position:fixed;width:200px;background:var(--bg-glass,rgba(255,255,255,0.85));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.12);padding:14px;text-align:center;z-index:9999;display:none}',
    '.dk-fav-toast.show{display:block}',
    '.dk-fav-icon{font-size:24px;margin-bottom:4px}',
    '.dk-fav-text{font-size:11px;font-weight:700;color:var(--text-primary,#1D1D1F);margin-bottom:2px}',
    '.dk-fav-hint{font-size:9px;color:var(--text-caption,#9CA3AF)}',
    '.dk-kbd{display:inline-block;padding:1px 6px;border-radius:4px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:#f5f5f5;font-size:9px;font-weight:700;font-family:monospace}',
    // 复制 Toast
    '.dk-copy-toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:10px 20px;border-radius:10px;background:rgba(16,185,129,0.95);color:#fff;font-size:13px;font-weight:700;z-index:9999;display:none;box-shadow:0 4px 16px rgba(16,185,129,0.3)}',
    '.dk-copy-toast.show{display:block}',
    // 品牌广告
    '.dk-ad-promo{border-radius:12px;overflow:hidden;aspect-ratio:300/250;background:linear-gradient(135deg,#6366F1,#818CF8);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;position:relative}',
    '.dk-ad-promo-badge{position:absolute;top:8px;right:8px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.2);font-size:8px;color:rgba(255,255,255,0.6)}',
    '.dk-ad-promo-logo{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:10px;backdrop-filter:blur(10px)}',
    '.dk-ad-promo-title{font-size:16px;font-weight:800;color:#fff;margin-bottom:4px}',
    '.dk-ad-promo-desc{font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:12px}',
    '.dk-ad-promo-btn{padding:7px 18px;border-radius:16px;border:none;background:rgba(255,255,255,0.95);color:#6366F1;font-size:11px;font-weight:800;cursor:pointer;transition:all 150ms}',
    '.dk-ad-promo-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)}',
    '.dk-ad-promo-btn:active{transform:scale(0.97)}',
    // 热门工具
    '.dk-hot-title{font-size:10px;font-weight:800;color:var(--text-caption,#9CA3AF);margin-bottom:8px}',
    '.dk-hot-item{display:flex;align-items:center;gap:8px;padding:6px;border-radius:7px;cursor:pointer;transition:all 150ms;text-decoration:none;color:var(--text-primary,#1D1D1F)}',
    '.dk-hot-item:hover{background:rgba(99,102,241,0.06)}',
    '.dk-hot-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:rgba(99,102,241,0.08)}',
    '.dk-hot-name{font-size:11px;font-weight:700}',
    '.dk-hot-desc{font-size:9px;color:var(--text-caption,#9CA3AF)}'
  ].join('\n');
  document.head.appendChild(style);

  // 收藏：仅引导浏览器书签，不记录状态

  var aside = document.createElement('aside');
  aside.className = 'dk-sidebar';
  aside.innerHTML = ''
    // 操作按钮
    +'<div class="dk-sb-section" style="position:relative;overflow:visible">'
    +'<div class="dk-act-row">'
    +'<button class="dk-act" id="dkShare" title="分享给朋友"><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></button>'
    +'<button class="dk-act" id="dkFav" title="收藏本站"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>'
    +'<button class="dk-act" id="dkCopy" title="复制链接"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>'
    +'<button class="dk-act" id="dkFeedback" title="反馈"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></button>'
    +'</div>'
    +'</div>'
    // 品牌广告占位
    +'<div class="dk-sb-section" style="padding:0;overflow:hidden">'
    +'<div class="dk-ad-promo">'
    +'<div class="dk-ad-promo-badge">推广</div>'
    +'<div class="dk-ad-promo-logo">D</div>'
    +'<div class="dk-ad-promo-title">DevKit 工具箱</div>'
    +'<div class="dk-ad-promo-desc">141 个免费在线工具<br>开发者的瑞士军刀 🔧</div>'
    +'<button class="dk-ad-promo-btn" id="dkAdFav">⭐ 收藏本站</button>'
    +'</div>'
    +'</div>'
    // 热门工具
    +'<div class="dk-sb-section"><div class="dk-hot-title">⭐ 热门工具</div>'
    +'<a class="dk-hot-item" href="'+base+'base64/"><div class="dk-hot-icon">🔐</div><div><div class="dk-hot-name">Base64</div><div class="dk-hot-desc">编解码</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'timestamp/"><div class="dk-hot-icon">⏰</div><div><div class="dk-hot-name">时间戳</div><div class="dk-hot-desc">Unix ↔ 日期</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'color/"><div class="dk-hot-icon">🎨</div><div><div class="dk-hot-name">颜色转换</div><div class="dk-hot-desc">HEX/RGB/HSL</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'hash/"><div class="dk-hot-icon">#</div><div><div class="dk-hot-name">Hash</div><div class="dk-hot-desc">MD5/SHA</div></div></a>'
    +'</div>';

  // 复制 Toast
  var copyToast = document.createElement('div');
  copyToast.className = 'dk-copy-toast';
  copyToast.textContent = '✅ 链接已复制';
  document.body.appendChild(copyToast);

  // 分享弹窗 — 挂在 body 上，fixed 定位才生效
  var sharePopupEl = document.createElement('div');
  sharePopupEl.className = 'dk-share-popup';
  sharePopupEl.id = 'dkSharePopup';
  sharePopupEl.innerHTML = '<div class="dk-share-title">分享给朋友</div>'
    +'<div class="dk-share-qr" id="dkShareQR" style="display:flex;align-items:center;justify-content:center;padding:8px;min-height:140px;border-radius:8px;border:1px solid var(--border-glass,rgba(0,0,0,0.08));background:#fff;margin-bottom:8px"></div>'
    +'<div style="text-align:center;font-size:9px;color:#07C160;font-weight:700;margin-bottom:10px">📱 微信扫一扫 分享给好友</div>'
    +'<div class="dk-share-grid">'
    +'<button class="dk-share-item" id="dkShareWb"><div class="dk-share-icon" style="background:#E6162D;color:#fff">📱</div><div class="dk-share-label">微博</div></button>'
    +'<button class="dk-share-item" id="dkShareQQ"><div class="dk-share-icon" style="background:#12B7F5;color:#fff">🐧</div><div class="dk-share-label">QQ</div></button>'
    +'<button class="dk-share-item" id="dkShareCopy"><div class="dk-share-icon" style="background:#6366F1;color:#fff">🔗</div><div class="dk-share-label">复制链接</div></button>'
    +'</div>';
  sharePopupEl.addEventListener('click', function(e){ e.stopPropagation(); });
  document.body.appendChild(sharePopupEl);

  // 收藏引导 — 挂在 body 上
  var favToastEl = document.createElement('div');
  favToastEl.className = 'dk-fav-toast';
  favToastEl.id = 'dkFavToast';
  favToastEl.innerHTML = '<div class="dk-fav-icon">⭐</div>'
    +'<div class="dk-fav-text">收藏本站</div>'
    +'<div class="dk-fav-hint">按 <span class="dk-kbd">'+(isMac?'⌘':'Ctrl')+'</span> + <span class="dk-kbd">D</span> 添加书签</div>';
  favToastEl.addEventListener('click', function(e){ e.stopPropagation(); });
  document.body.appendChild(favToastEl);

  // 动态对齐顶部
  var mainEl = document.querySelector('.main');
  if (mainEl) aside.style.top = mainEl.offsetTop + 'px';
  document.body.appendChild(aside);

  // === 事件绑定 ===
  var sharePopup = sharePopupEl;
  var favToast = favToastEl;
  var activePopup = null;

  function closeAll() {
    sharePopup.classList.remove('show');
    favToast.classList.remove('show');
    activePopup = null;
  }

  function positionPopup(el, btn) {
    var r = btn.getBoundingClientRect();
    el.style.top = r.top + 'px';
    el.style.right = (window.innerWidth - r.left + 8) + 'px';
  }

  function toggle(el, btn) {
    if (activePopup === el) { closeAll(); return; }
    closeAll();
    if (btn) positionPopup(el, btn);
    el.classList.add('show');
    activePopup = el;
  }

  // QR码库懒加载
  var qrLoaded = false;
  function loadQRLib(cb) {
    if (qrLoaded || window.QRCode) { qrLoaded = true; cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
    s.integrity = 'sha384-HGmnkDZJy7mRkoARekrrj0VjEFSh9a0Z8qxGri/kTTAJkgR8hqD1lHsYSh3JdzRi';
    s.crossOrigin = 'anonymous';
    s.onload = function(){ qrLoaded = true; cb(); };
    s.onerror = function(){ cb(); };
    document.head.appendChild(s);
  }

  function renderQR() {
    var box = document.getElementById('dkShareQR');
    box.innerHTML = '';
    if (!window.QRCode) {
      box.innerHTML = '<span style="font-size:9px;color:#9CA3AF">二维码加载中...</span>';
      return;
    }
    var canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, location.href, { width: 120, margin: 1 }, function(){});
    box.appendChild(canvas);
  }

  // 分享按钮
  var shareBtn = document.getElementById('dkShare');
  var isMobile = /Mobi|Android/i.test(navigator.userAgent);
  shareBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isMobile && navigator.share) {
      navigator.share({ title: document.title, url: location.href });
      return;
    }
    toggle(sharePopup, shareBtn);
    loadQRLib(renderQR);
  });

  // 复制链接按钮
  document.getElementById('dkShareCopy').addEventListener('click', function(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(location.href);
    showCopyToast();
    closeAll();
  });

  // 微博
  document.getElementById('dkShareWb').addEventListener('click', function() {
    window.open('https://service.weibo.com/share/share.php?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title), '_blank');
    closeAll();
  });

  // QQ
  document.getElementById('dkShareQQ').addEventListener('click', function() {
    window.open('https://connect.qq.com/widget/shareqq/index.html?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title), '_blank');
    closeAll();
  });

  // 收藏按钮 — 仅弹引导，3秒后自动消失
  var favBtn = document.getElementById('dkFav');
  favBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggle(favToast, favBtn);
    setTimeout(function(){ favToast.classList.remove('show'); activePopup = null; }, 3000);
  });

  // 复制链接
  document.getElementById('dkCopy').addEventListener('click', function() {
    navigator.clipboard.writeText(location.href);
    showCopyToast();
    closeAll();
  });

  function showCopyToast() {
    copyToast.classList.add('show');
    setTimeout(function(){ copyToast.classList.remove('show'); }, 2000);
  }

  // 反馈
  document.getElementById('dkFeedback').addEventListener('click', function() {
    window.open('https://jsj.top/f/dZvLFl', '_blank');
  });

  // 广告区收藏按钮
  document.getElementById('dkAdFav').addEventListener('click', function() {
    toggle(favToast);
  });

  // 点击外部关闭弹窗
  document.addEventListener('click', function() { closeAll(); });
  aside.addEventListener('click', function(e) { e.stopPropagation(); });
})();
