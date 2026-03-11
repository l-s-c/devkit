// ============================================================
// 正则表达式测试工具
// ============================================================

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default {
  id: 'regex',
  name: '正则测试',

  init(container) {
    container.innerHTML = `
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
    `;

    const pattern = container.querySelector('#regexPattern');
    const flags = container.querySelector('#regexFlags');
    const text = container.querySelector('#regexText');
    const highlight = container.querySelector('#regexHighlight');
    const matches = container.querySelector('#regexMatches');
    const status = container.querySelector('#regexStatus');

    // Sync flags checkboxes ↔ input
    const flagChecks = { g: '#regexG', i: '#regexI', m: '#regexM', s: '#regexS' };
    Object.entries(flagChecks).forEach(([flag, sel]) => {
      container.querySelector(sel).addEventListener('change', (e) => {
        let f = flags.value;
        if (e.target.checked) { if (!f.includes(flag)) f += flag; }
        else { f = f.replace(flag, ''); }
        flags.value = f;
        doMatch();
      });
    });
    flags.addEventListener('input', () => {
      Object.entries(flagChecks).forEach(([flag, sel]) => {
        container.querySelector(sel).checked = flags.value.includes(flag);
      });
      doMatch();
    });

    // Scroll sync
    text.addEventListener('scroll', () => {
      highlight.scrollTop = text.scrollTop;
      highlight.scrollLeft = text.scrollLeft;
    });

    function doMatch() {
      const p = pattern.value;
      const t = text.value;
      const f = flags.value;

      if (!p || !t) {
        highlight.innerHTML = escapeHtml(t || '');
        matches.innerHTML = '<div style="text-align:center;color:var(--text-500)">输入正则和文本开始匹配</div>';
        status.textContent = '就绪';
        return;
      }

      try {
        const regex = new RegExp(p, f);
        const allMatches = [];
        let match;
        let lastIndex = 0;
        let html = '';
        const colors = ['rgba(99,102,241,0.25)', 'rgba(16,185,129,0.25)', 'rgba(245,158,11,0.25)', 'rgba(239,68,68,0.25)'];

        if (f.includes('g')) {
          let i = 0;
          while ((match = regex.exec(t)) !== null) {
            if (match.index === regex.lastIndex) { regex.lastIndex++; continue; }
            const color = colors[i % colors.length];
            html += escapeHtml(t.slice(lastIndex, match.index));
            html += `<mark style="background:${color};border-radius:2px">${escapeHtml(match[0])}</mark>`;
            allMatches.push({ index: match.index, text: match[0], groups: match.slice(1) });
            lastIndex = regex.lastIndex;
            i++;
            if (i > 10000) break; // safety
          }
          html += escapeHtml(t.slice(lastIndex));
        } else {
          match = regex.exec(t);
          if (match) {
            html = escapeHtml(t.slice(0, match.index));
            html += `<mark style="background:${colors[0]};border-radius:2px">${escapeHtml(match[0])}</mark>`;
            html += escapeHtml(t.slice(match.index + match[0].length));
            allMatches.push({ index: match.index, text: match[0], groups: match.slice(1) });
          } else {
            html = escapeHtml(t);
          }
        }

        highlight.innerHTML = html;

        // Match list
        if (allMatches.length === 0) {
          matches.innerHTML = '<div style="color:var(--text-500)">没有匹配</div>';
          status.textContent = '0 个匹配';
        } else {
          matches.innerHTML = allMatches.map((m, i) => `
            <div style="padding:6px 0;border-bottom:1px solid var(--bg-700);font-size:12px">
              <span style="color:var(--brand-500);font-weight:600">匹配 ${i+1}</span>
              <span style="color:var(--text-500);margin-left:8px">位置 ${m.index}</span>
              <div style="font-family:'JetBrains Mono',monospace;color:var(--text-200);margin-top:2px">${escapeHtml(m.text)}</div>
              ${m.groups.length ? `<div style="color:var(--text-500);margin-top:2px">${m.groups.map((g,j) => `分组${j+1}: ${escapeHtml(g||'')}`).join(' · ')}</div>` : ''}
            </div>
          `).join('');
          status.textContent = `${allMatches.length} 个匹配`;
        }
      } catch (e) {
        highlight.innerHTML = escapeHtml(t);
        matches.innerHTML = `<div style="color:var(--error)">${escapeHtml(e.message)}</div>`;
        status.textContent = '正则语法错误';
      }
    }

    pattern.addEventListener('input', doMatch);
    text.addEventListener('input', doMatch);
  }
};
