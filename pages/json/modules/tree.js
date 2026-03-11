// ============================================================
// TREE VIEW + JSONPATH MODULE
// ============================================================

export function initTree({ $, $$, showToast, escapeHtml, debounce, truncate }) {

  const TREE_ROW_HEIGHT = 28;
  const TREE_INDENT_PX = 20;
  const TREE_OVERSCAN = 10;

  let treeData = null;
  let treeFlat = [];       // all nodes flattened
  let treeVisible = [];    // currently visible (respecting collapsed)
  let treeCollapsed = new Set();  // collapsed node ids
  let treeSelectedId = null;
  let treeSearchQuery = '';

  // Flatten JSON into a flat node array
  function flattenTree(data, key, path, depth, parentId) {
    const id = path || '$';
    const node = { id, key, path, depth, parentId, data };

    if (data === null) { node.type = 'null'; node.valueStr = 'null'; return [node]; }
    if (typeof data === 'boolean') { node.type = 'boolean'; node.valueStr = String(data); return [node]; }
    if (typeof data === 'number') { node.type = 'number'; node.valueStr = String(data); return [node]; }
    if (typeof data === 'string') { node.type = 'string'; node.valueStr = `"${data}"`; return [node]; }

    const isArray = Array.isArray(data);
    node.type = isArray ? 'array' : 'object';
    node.isContainer = true;
    const entries = isArray ? data.map((v, i) => [`[${i}]`, v]) : Object.entries(data);
    node.childCount = entries.length;
    node.childIds = [];

    const result = [node];
    entries.forEach(([k, v]) => {
      const childPath = path ? `${path}.${k}` : k;
      const children = flattenTree(v, k, childPath, depth + 1, id);
      node.childIds.push(children[0].id);
      result.push(...children);
    });
    return result;
  }

  // Build visible list from flat nodes respecting collapsed state
  function buildVisibleList(query) {
    const visible = [];
    const hiddenParents = new Set();

    for (const node of treeFlat) {
      // Skip if any ancestor is collapsed
      if (node.parentId && hiddenParents.has(node.parentId)) {
        if (node.isContainer) hiddenParents.add(node.id);
        continue;
      }
      // Search filter
      if (query) {
        const text = `${node.key || ''} ${node.valueStr || ''} ${node.type}`.toLowerCase();
        if (!text.includes(query) && !node.isContainer) continue;
      }
      visible.push(node);
      // If this container is collapsed, mark it so children are hidden
      if (node.isContainer && treeCollapsed.has(node.id)) {
        hiddenParents.add(node.id);
      }
    }
    return visible;
  }

  // Render a single row element
  function renderTreeRow(node) {
    const row = document.createElement('div');
    row.className = 'tree-node' + (node.id === treeSelectedId ? ' selected' : '');
    row.style.height = TREE_ROW_HEIGHT + 'px';
    row.style.paddingLeft = (node.depth * TREE_INDENT_PX + 8) + 'px';
    row.dataset.nodeId = node.id;

    let html = '';
    if (node.isContainer) {
      const collapsed = treeCollapsed.has(node.id);
      html += `<span class="tree-arrow">${collapsed ? '▶' : '▼'}</span>`;
      if (node.key) html += `<span class="tree-key">${escapeHtml(node.key)}</span><span class="tree-colon">:</span>`;
      html += `<span class="type-badge ${node.type}">${node.type}</span>`;
      html += `<span class="tree-count">${node.childCount} ${node.type === 'array' ? '项' : '个键'}</span>`;
    } else {
      html += `<span style="width:16px;display:inline-block"></span>`;
      if (node.key) html += `<span class="tree-key">${escapeHtml(node.key)}</span><span class="tree-colon">:</span>`;
      html += `<span class="tree-value ${node.type}">${escapeHtml(node.valueStr)}</span>`;
      html += `<span class="type-badge ${node.type}" style="margin-left:auto">${node.type}</span>`;
    }
    html += `<button class="tree-copy-btn" title="复制路径"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>`;

    row.innerHTML = html;
    return row;
  }

  // Virtual scroll renderer
  function renderVirtualTree() {
    const container = $('#treeOutput');
    if (treeVisible.length === 0) {
      container.innerHTML = '<div class="empty-state-sm">粘贴 JSON 以查看树形结构</div>';
      return;
    }

    // Setup virtual scroll container
    container.innerHTML = '';
    const totalHeight = treeVisible.length * TREE_ROW_HEIGHT;

    const spacerTop = document.createElement('div');
    spacerTop.className = 'tree-spacer-top';
    const viewport = document.createElement('div');
    viewport.className = 'tree-viewport';
    const spacerBottom = document.createElement('div');
    spacerBottom.className = 'tree-spacer-bottom';

    container.appendChild(spacerTop);
    container.appendChild(viewport);
    container.appendChild(spacerBottom);

    let lastStart = -1, lastEnd = -1;

    function updateVisibleRows() {
      const scrollTop = container.scrollTop;
      const viewHeight = container.clientHeight;
      let start = Math.floor(scrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN;
      let end = Math.ceil((scrollTop + viewHeight) / TREE_ROW_HEIGHT) + TREE_OVERSCAN;
      start = Math.max(0, start);
      end = Math.min(treeVisible.length, end);

      if (start === lastStart && end === lastEnd) return;
      lastStart = start;
      lastEnd = end;

      spacerTop.style.height = (start * TREE_ROW_HEIGHT) + 'px';
      spacerBottom.style.height = ((treeVisible.length - end) * TREE_ROW_HEIGHT) + 'px';

      viewport.innerHTML = '';
      for (let i = start; i < end; i++) {
        viewport.appendChild(renderTreeRow(treeVisible[i]));
      }
    }

    container.addEventListener('scroll', () => requestAnimationFrame(updateVisibleRows));
    updateVisibleRows();

    // Event delegation for clicks
    container.addEventListener('click', (e) => {
      const row = e.target.closest('.tree-node');
      if (!row) return;
      const nodeId = row.dataset.nodeId;

      if (e.target.closest('.tree-copy-btn')) {
        navigator.clipboard.writeText(nodeId).then(() => showToast('路径已复制', 'success'));
        return;
      }

      if (e.target.closest('.tree-arrow')) {
        if (treeCollapsed.has(nodeId)) {
          treeCollapsed.delete(nodeId);
        } else {
          treeCollapsed.add(nodeId);
        }
        treeVisible = buildVisibleList(treeSearchQuery);
        renderVirtualTree();
        // Restore scroll position near the toggled node
        const idx = treeVisible.findIndex(n => n.id === nodeId);
        if (idx >= 0) container.scrollTop = idx * TREE_ROW_HEIGHT;
        return;
      }

      treeSelectedId = nodeId;
      viewport.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
      row.classList.add('selected');
      $('#treePath').textContent = `路径：${nodeId}`;
    });
  }

  // Main tree input handler
  $('#treeInput').addEventListener('input', debounce(() => {
    const input = $('#treeInput').value.trim();
    if (!input) {
      treeFlat = []; treeVisible = []; treeCollapsed.clear();
      $('#treeOutput').innerHTML = '<div class="empty-state-sm">粘贴 JSON 以查看树形结构</div>';
      $('#treeStats').textContent = '';
      return;
    }
    try {
      treeData = JSON.parse(input);
      treeCollapsed.clear();
      treeSearchQuery = '';
      treeFlat = flattenTree(treeData, '', '', 0, null);
      treeVisible = buildVisibleList('');

      const maxDepth = treeFlat.reduce((m, n) => Math.max(m, n.depth), 0);
      const rootInfo = typeof treeData === 'object' && treeData !== null
        ? (Array.isArray(treeData) ? treeData.length + ' 项' : Object.keys(treeData).length + ' 个键')
        : '';
      $('#treeStats').textContent = `${rootInfo} · 共 ${treeFlat.length} 个节点 · 最大深度：${maxDepth}`;

      renderVirtualTree();
    } catch (e) {
      $('#treeOutput').innerHTML = `<div class="empty-state-sm" style="color: var(--error)">JSON 无效：${escapeHtml(e.message)}</div>`;
    }
  }, 300));

  $('#treeExpandAll').addEventListener('click', () => {
    treeCollapsed.clear();
    treeVisible = buildVisibleList(treeSearchQuery);
    renderVirtualTree();
  });
  $('#treeCollapseAll').addEventListener('click', () => {
    treeFlat.forEach(n => { if (n.isContainer) treeCollapsed.add(n.id); });
    treeVisible = buildVisibleList(treeSearchQuery);
    renderVirtualTree();
  });

  $('#treeSearch').addEventListener('input', debounce(() => {
    treeSearchQuery = $('#treeSearch').value.trim().toLowerCase();
    treeVisible = buildVisibleList(treeSearchQuery);
    renderVirtualTree();
  }, 200));


  // Simple JSONPath evaluator supporting: $, ., [], *, .., ?() filter
  function evaluateJSONPath(data, expr) {
    if (!expr || expr === '$') return [{ path: '$', value: data }];

    const tokens = tokenizeJSONPath(expr);
    let results = [{ path: '$', value: data }];

    for (const token of tokens) {
      const next = [];
      for (const { path, value } of results) {
        if (token.type === 'recursive') {
          // .. recursive descent
          collectRecursive(value, path, token.key, next);
        } else if (token.type === 'wildcard') {
          if (typeof value === 'object' && value !== null) {
            const entries = Array.isArray(value)
              ? value.map((v, i) => [`[${i}]`, v])
              : Object.entries(value);
            entries.forEach(([k, v]) => {
              const p = Array.isArray(value) ? `${path}[${k.replace(/[\[\]]/g, '')}]` : `${path}.${k}`;
              next.push({ path: p, value: v });
            });
          }
        } else if (token.type === 'index') {
          if (Array.isArray(value) && value[token.index] !== undefined) {
            next.push({ path: `${path}[${token.index}]`, value: value[token.index] });
          }
        } else if (token.type === 'filter') {
          if (Array.isArray(value)) {
            value.forEach((item, i) => {
              if (typeof item === 'object' && item !== null && matchFilter(item, token.expr)) {
                next.push({ path: `${path}[${i}]`, value: item });
              }
            });
          }
        } else if (token.type === 'key') {
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && token.key in value) {
            next.push({ path: `${path}.${token.key}`, value: value[token.key] });
          }
        }
      }
      results = next;
    }
    return results;
  }

  function tokenizeJSONPath(expr) {
    const tokens = [];
    let i = 0;
    // Skip leading $
    if (expr[0] === '$') i = 1;

    while (i < expr.length) {
      if (expr[i] === '.') {
        if (expr[i+1] === '.') {
          // Recursive descent
          i += 2;
          let key = '';
          while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; }
          tokens.push({ type: 'recursive', key: key || '*' });
        } else {
          i++;
          let key = '';
          while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; }
          if (key === '*') tokens.push({ type: 'wildcard' });
          else if (key) tokens.push({ type: 'key', key });
        }
      } else if (expr[i] === '[') {
        i++;
        if (expr[i] === '*') {
          tokens.push({ type: 'wildcard' });
          i += 2; // skip *]
        } else if (expr[i] === '?') {
          // Filter expression
          i += 2; // skip ?(
          let filterExpr = '';
          let depth = 1;
          while (i < expr.length && depth > 0) {
            if (expr[i] === '(') depth++;
            if (expr[i] === ')') depth--;
            if (depth > 0) filterExpr += expr[i];
            i++;
          }
          i++; // skip ]
          tokens.push({ type: 'filter', expr: filterExpr });
        } else {
          let idx = '';
          while (i < expr.length && expr[i] !== ']') { idx += expr[i]; i++; }
          i++; // skip ]
          if (/^\d+$/.test(idx)) tokens.push({ type: 'index', index: parseInt(idx) });
          else if (idx.startsWith("'") || idx.startsWith('"')) {
            tokens.push({ type: 'key', key: idx.slice(1, -1) });
          }
        }
      } else {
        i++;
      }
    }
    return tokens;
  }

  function collectRecursive(value, path, key, results) {
    if (typeof value !== 'object' || value === null) return;
    const visited = new Set();

    function recurse(val, p) {
      if (typeof val !== 'object' || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((v, i) => {
          const cp = `${p}[${i}]`;
          if (key === '*') { results.push({ path: cp, value: v }); }
          recurse(v, cp);
        });
      } else {
        if (key !== '*' && key in val) {
          const matchPath = `${p}.${key}`;
          if (!visited.has(matchPath)) {
            visited.add(matchPath);
            results.push({ path: matchPath, value: val[key] });
          }
        }
        if (key === '*') {
          Object.entries(val).forEach(([k, v]) => {
            results.push({ path: `${p}.${k}`, value: v });
          });
        }
        Object.entries(val).forEach(([k, v]) => {
          recurse(v, `${p}.${k}`);
        });
      }
    }
    recurse(value, path);
  }

  function matchFilter(item, expr) {
    // Simple filter: @.key op value
    const m = expr.match(/@\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
    if (!m) return false;
    const [, key, op, rawVal] = m;
    if (!(key in item)) return false;
    let val = rawVal.trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
    else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val === 'null') val = null;
    else if (!isNaN(Number(val))) val = Number(val);

    const itemVal = item[key];
    switch (op) {
      case '==': return itemVal == val;
      case '!=': return itemVal != val;
      case '>': return itemVal > val;
      case '<': return itemVal < val;
      case '>=': return itemVal >= val;
      case '<=': return itemVal <= val;
    }
    return false;
  }

  // JSONPath UI
  $('#jsonpathInput').addEventListener('input', debounce(() => {
    const expr = '$' + $('#jsonpathInput').value.trim();
    const clearBtn = $('#jsonpathClear');
    const resultsPanel = $('#jsonpathResults');

    if (expr === '$' || !treeData) {
      clearBtn.style.display = 'none';
      resultsPanel.style.display = 'none';
      // Remove highlights
      document.querySelectorAll('.tree-node.jsonpath-match, .tree-node.jsonpath-dimmed').forEach(n => {
        n.classList.remove('jsonpath-match', 'jsonpath-dimmed');
      });
      return;
    }
    clearBtn.style.display = '';

    try {
      const results = evaluateJSONPath(treeData, expr);
      const matchPaths = new Set(results.map(r => r.path));

      // Highlight matched nodes in virtual tree
      document.querySelectorAll('.tree-node').forEach(node => {
        const nodeId = node.dataset.nodeId;
        if (!nodeId) return;
        const fullPath = '$' + (nodeId ? '.' + nodeId : '');
        if (matchPaths.has(fullPath) || matchPaths.has(nodeId)) {
          node.classList.add('jsonpath-match');
          node.classList.remove('jsonpath-dimmed');
        } else {
          node.classList.remove('jsonpath-match');
          node.classList.add('jsonpath-dimmed');
        }
      });

      // Show results panel
      resultsPanel.style.display = 'block';
      $('#jsonpathCount').textContent = `${results.length} 个匹配`;
      $('#jsonpathHint').textContent = '';

      if (results.length === 0) {
        $('#jsonpathList').innerHTML = '<div class="jsonpath-result-item" style="color:var(--text-500);justify-content:center">无匹配结果 · 支持 $ . [] * .. ?() 语法</div>';
      } else {
        $('#jsonpathList').innerHTML = results.slice(0, 100).map(r => {
          const valStr = truncate(JSON.stringify(r.value), 60);
          return `<div class="jsonpath-result-item" data-path="${escapeHtml(r.path)}">
            <span class="jsonpath-result-path">${escapeHtml(r.path)}</span>
            <span class="jsonpath-result-value">${escapeHtml(valStr)}</span>
          </div>`;
        }).join('') + (results.length > 100 ? `<div class="jsonpath-result-item" style="color:var(--text-500)">… 还有 ${results.length - 100} 个结果</div>` : '');
      }
    } catch (e) {
      resultsPanel.style.display = 'block';
      $('#jsonpathCount').textContent = '表达式错误';
      $('#jsonpathHint').textContent = e.message;
      $('#jsonpathList').innerHTML = '';
    }
  }, 300));

  // Click result to scroll to node in tree
  $('#jsonpathList').addEventListener('click', (e) => {
    const item = e.target.closest('.jsonpath-result-item');
    if (!item) return;
    const path = item.dataset.path;
    if (!path) return;

    // Find node in visible tree and scroll to it
    const nodeId = path.startsWith('$.') ? path.substring(2) : path === '$' ? '' : path;
    const idx = treeVisible.findIndex(n => n.id === nodeId || n.path === nodeId);
    if (idx >= 0) {
      const container = $('#treeOutput');
      container.scrollTop = idx * TREE_ROW_HEIGHT;
      treeSelectedId = treeVisible[idx].id;
      // Re-render to show selection
      const viewport = container.querySelector('.tree-viewport');
      if (viewport) {
        viewport.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
        const row = viewport.querySelector(`[data-node-id="${treeVisible[idx].id}"]`);
        if (row) row.classList.add('selected');
      }
      $('#treePath').textContent = `路径：${path}`;
    }
  });

  $('#jsonpathClear').addEventListener('click', () => {
    $('#jsonpathInput').value = '';
    $('#jsonpathInput').dispatchEvent(new Event('input'));
  });


}
