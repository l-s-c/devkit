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
    '.dk-act svg{width:16px;height:16px}',
    '.dk-act:hover{border-color:var(--brand-500,#6366F1);color:var(--brand-500,#6366F1);transform:translateY(-1px)}',
    '.dk-act:active{transform:scale(0.95)}',

    // 分享弹窗
    '.dk-share-popup{position:fixed;width:200px;background:var(--bg-glass,rgba(255,255,255,0.85));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.5px solid var(--border-glass,rgba(0,0,0,0.08));border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.12);padding:14px;z-index:9999;display:none}',
    '.dk-share-popup.show{display:block}',
    '.dk-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.15);z-index:9998;display:none}',
    '.dk-overlay.show{display:block}',
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
    +'<button class="dk-act" id="dkShare" title="分享给朋友"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>'
    +'<button class="dk-act" id="dkFav" title="收藏本站"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>'
    +'<button class="dk-act" id="dkCopy" title="复制链接"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'
    +'<button class="dk-act" id="dkFeedback" title="反馈"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
    +'</div>'
    +'</div>'
    // 品牌广告占位
    +'<div class="dk-sb-section" style="padding:0;overflow:hidden">'
    +'<div class="dk-ad-promo">'
    +'<div class="dk-ad-promo-badge">推广</div>'
    +'<div class="dk-ad-promo-logo"><svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(256,256) rotate(-45) translate(-256,-256)"><path d="M352 108c-35.3 0-67.3 14.3-90.5 37.5L175 232c-5.6-1.3-11.5-2-17.5-2C111 230 72 269 72 315.5S111 401 157.5 401 243 362 243 315.5c0-6-0.7-11.9-2-17.5l86.5-86.5C350.7 235 383 249 418 249c8 0 15.8-0.7 23.3-2l-0.1 0.1C465 223.3 480 190.8 480 155c0-8.5-0.8-16.8-2.2-24.8L410 198l-56-14-14-56 68-67.8C400 59 391 58 382 58c-10 0-20 0.7-30 2zm-194.5 248a40 40 0 1 1 0-80 40 40 0 0 1 0 80z" fill="#fff" fill-opacity="0.95"/></g></svg></div>'
    +'<div class="dk-ad-promo-title">DevKit 工具箱</div>'
    +'<div class="dk-ad-promo-desc">141 个免费在线工具<br>你的在线万能工具箱 🧰</div>'
    +'<button class="dk-ad-promo-btn" id="dkAdFav">⭐ 收藏本站</button>'
    +'</div>'
    +'</div>'
    // 热门工具
    +'<div class="dk-sb-section"><div class="dk-hot-title">⭐ 热门工具</div>'
    +'<a class="dk-hot-item" href="'+base+'base64/"><div class="dk-hot-icon" style="color:#6366F1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div><div class="dk-hot-name">Base64</div><div class="dk-hot-desc">编解码</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'timestamp/"><div class="dk-hot-icon" style="color:#6366F1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><div class="dk-hot-name">时间戳</div><div class="dk-hot-desc">Unix ↔ 日期</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'color/"><div class="dk-hot-icon" style="color:#6366F1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="5" cy="14.5" r="2.5"/><circle cx="11" cy="18" r="2.5"/></svg></div><div><div class="dk-hot-name">颜色转换</div><div class="dk-hot-desc">HEX/RGB/HSL</div></div></a>'
    +'<a class="dk-hot-item" href="'+base+'hash/"><div class="dk-hot-icon" style="color:#6366F1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg></div><div><div class="dk-hot-name">Hash</div><div class="dk-hot-desc">MD5/SHA</div></div></a>'
    +'</div>';

  // 遮罩层
  var overlay = document.createElement('div');
  overlay.className = 'dk-overlay';
  overlay.addEventListener('click', function(){ closeAll(); });
  document.body.appendChild(overlay);

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
    +'<div style="text-align:center;font-size:9px;color:#07C160;font-weight:700;margin-bottom:10px"><svg viewBox="0 0 24 24" fill="#07C160" width="12" height="12" style="vertical-align:-2px;margin-right:3px"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/></svg>微信扫一扫 分享给好友</div>'
    +'<div class="dk-share-grid">'
    +'<button class="dk-share-item" id="dkShareWb"><div class="dk-share-icon" style="background:#E6162D"><svg viewBox="0 0 24 24" fill="#fff" width="20" height="20"><path d="M17.525 9.063c1.462-.252 2.899.089 4.094.727l.013.007c.036.02.072.041.106.064l-.004-.002c.862.499.81 1.553-.12 1.907-.662.252-1.21-.03-1.672-.362-.979-.698-2.112-.918-3.306-.608-1.034.268-1.71.978-1.813 2.035-.131 1.358.622 2.335 1.981 2.486 1.013.112 1.997-.024 2.943-.405.504-.203.972-.475 1.397-.768.552-.38 1.06-.322 1.49.085.448.425.51.943.089 1.44a5.17 5.17 0 01-2.873 1.8c-2.074.565-4.063.42-5.849-.72-1.588-1.014-2.4-2.513-2.485-4.372-.102-2.211.848-3.878 2.758-5.005a6.07 6.07 0 013.251-.309zM8.137 10.342c.337-.148.711-.246 1.101-.274l.019-.001c.542-.042 1.034.16 1.228.7.206.573-.03 1.073-.582 1.318-.35.155-.732.278-1.08.459-1.584.822-2.467 2.128-2.727 3.876-.372 2.512.69 4.538 2.89 5.848 2.476 1.475 5.135 1.53 7.745.508.253-.099.491-.216.716-.352l.019-.012c.487-.301.915-.173 1.215.283.3.457.22.982-.2 1.35a4.19 4.19 0 01-.76.528l-.026.014c-2.735 1.454-5.617 1.772-8.578.87-2.747-.837-4.584-2.702-5.32-5.522-.863-3.307.391-6.334 3.34-7.793z"/></svg></div><div class="dk-share-label">微博</div></button>'
    +'<button class="dk-share-item" id="dkShareQQ"><div class="dk-share-icon" style="background:#12B7F5"><svg viewBox="0 0 24 24" fill="#fff" width="20" height="20"><path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"/></svg></div><div class="dk-share-label">QQ</div></button>'
    +'<button class="dk-share-item" id="dkShareCopy"><div class="dk-share-icon" style="background:#6366F1"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div><div class="dk-share-label">复制链接</div></button>'
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
    overlay.classList.remove('show');
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
    overlay.classList.add('show');
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
