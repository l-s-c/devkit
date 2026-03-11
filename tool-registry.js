// ============================================================
// Tool Registry — 插件式工具注册系统
// ============================================================

const registry = [];
const loadedModules = {};

// 工具分组定义
const GROUPS = [
  { id: 'json', name: 'JSON 工具', icon: '{}' },
  { id: 'codec', name: '编解码', icon: '↔' },
  { id: 'dev', name: '开发辅助', icon: '⚙' },
];

// 工具定义（懒加载路径）
const TOOL_DEFS = [
  // JSON 工具（已有，不走插件系统）
  { id: 'format', name: '格式化', group: 'json', route: '/formatter', icon: '{ }', builtin: true, shortcut: '1' },
  { id: 'tree', name: '树形视图', group: 'json', route: '/tree', icon: '🌳', builtin: true, shortcut: '2' },
  { id: 'convert', name: '转换', group: 'json', route: '/convert', icon: '⇄', builtin: true, shortcut: '3' },
  { id: 'diff', name: '对比', group: 'json', route: '/diff', icon: '≠', builtin: true, shortcut: '4' },
  // 编解码
  { id: 'base64', name: 'Base64', group: 'codec', route: '/base64', icon: 'B64', module: () => import('./tools/base64.js'),
    title: 'Base64 编解码 — 在线文本/图片 Base64 编码解码', desc: '在线 Base64 编码解码工具，支持文本和文件互转。' },
  { id: 'url-codec', name: 'URL 编解码', group: 'codec', route: '/url-codec', icon: '%', module: () => import('./tools/url-codec.js'),
    title: 'URL 编解码 — 在线 URL Encode/Decode', desc: '在线 URL 编码解码工具，支持组件编码和完整 URL 编码。' },
  { id: 'jwt', name: 'JWT 解码', group: 'codec', route: '/jwt', icon: '🔑', module: () => import('./tools/jwt.js'),
    title: 'JWT 解码器 — 在线解析 JSON Web Token', desc: '在线 JWT 解码工具，解析 Header 和 Payload，查看过期时间。' },
  // 开发辅助
  { id: 'regex', name: '正则测试', group: 'dev', route: '/regex', icon: '.*', module: () => import('./tools/regex.js'),
    title: '正则表达式测试 — 在线 Regex 测试工具', desc: '在线正则表达式测试工具，实时匹配高亮、分组捕获、常用正则模板。' },
  { id: 'timestamp', name: '时间戳', group: 'dev', route: '/timestamp', icon: '🕐', module: () => import('./tools/timestamp.js'),
    title: '时间戳转换 — Unix 时间戳在线转换', desc: '在线 Unix 时间戳与日期时间互转，支持毫秒、秒，多时区。' },
  { id: 'uuid', name: 'UUID', group: 'dev', route: '/uuid', icon: 'ID', module: () => import('./tools/uuid.js'),
    title: 'UUID 生成器 — 在线批量生成 UUID', desc: '在线 UUID v4 生成器，支持批量生成、大小写、带不带连字符。' },
  { id: 'hash', name: 'Hash', group: 'dev', route: '/hash', icon: '#', module: () => import('./tools/hash.js'),
    title: 'Hash 生成器 — MD5/SHA1/SHA256 在线计算', desc: '在线 Hash 计算工具，支持 MD5、SHA-1、SHA-256、SHA-512。' },
];

// Build route map
const ROUTE_MAP_EXT = {};
TOOL_DEFS.forEach(t => { ROUTE_MAP_EXT[t.route] = t.id; });

// Render sidebar with groups
function renderSidebar() {
  const nav = document.querySelector('.sidebar');
  if (!nav) return;

  // Add new tool groups (JSON group already in HTML)
  const newGroups = GROUPS.filter(g => g.id !== 'json');
  
  newGroups.forEach(group => {
    const tools = TOOL_DEFS.filter(t => t.group === group.id);
    if (tools.length === 0) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'nav-group';
    groupDiv.innerHTML = `<span class="nav-group-label">${group.name}</span>`;

    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.dataset.tool = tool.id;
      btn.setAttribute('aria-label', tool.name);
      btn.innerHTML = `<span class="nav-icon">${tool.icon}</span><span class="nav-label">${tool.name}</span>`;
      btn.addEventListener('click', () => activateTool(tool.id));
      groupDiv.appendChild(btn);
    });

    nav.appendChild(groupDiv);
  });
}

// Activate a tool
async function activateTool(toolId) {
  const def = TOOL_DEFS.find(t => t.id === toolId);
  if (!def) return;

  // If builtin JSON tool, use existing switchView
  if (def.builtin && window.switchView) {
    window.switchView(toolId);
    return;
  }

  // Deactivate all
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  // Activate button
  const btn = document.querySelector(`.nav-btn[data-tool="${toolId}"]`);
  if (btn) btn.classList.add('active');

  // Get or create container
  let container = document.getElementById(`view-${toolId}`);
  if (!container) {
    container = document.createElement('div');
    container.id = `view-${toolId}`;
    container.className = 'view';
    document.querySelector('.main-content, main').appendChild(container);
  }
  container.classList.add('active');

  // Lazy load module
  if (!loadedModules[toolId] && def.module) {
    try {
      const mod = await def.module();
      loadedModules[toolId] = mod.default || mod;
      loadedModules[toolId].init(container);
    } catch (err) {
      container.innerHTML = `<div style="padding:40px;color:var(--error)">加载失败：${err.message}</div>`;
    }
  }

  // Update URL + SEO
  history.pushState({ tool: toolId }, '', def.route);
  document.title = def.title || `${def.name} — DevKit`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && def.desc) metaDesc.content = def.desc;
}

// Handle route on page load
function initToolRouter() {
  const path = location.pathname;
  const toolId = ROUTE_MAP_EXT[path];
  if (toolId && !TOOL_DEFS.find(t => t.id === toolId)?.builtin) {
    activateTool(toolId);
  }
}

// Handle popstate
window.addEventListener('popstate', (e) => {
  const toolId = e.state?.tool;
  if (toolId) {
    const def = TOOL_DEFS.find(t => t.id === toolId);
    if (def && !def.builtin) {
      activateTool(toolId);
    }
  }
});

// Init
if (document.readyState === 'complete') {
  renderSidebar();
  initToolRouter();
} else {
  window.addEventListener('load', () => {
    renderSidebar();
    initToolRouter();
  });
}

export { TOOL_DEFS, GROUPS, activateTool };
