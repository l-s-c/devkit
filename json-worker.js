// ============================================================
// JSONKit Web Worker — 独立文件，避免模板字符串转义问题
// ============================================================

self.onmessage = function(e) {
  const { id, type, payload } = e.data;
  try {
    let result;
    switch (type) {
      case 'format':
        result = formatJSON(payload.input, payload.indent);
        break;
      case 'minify':
        result = minifyJSON(payload.input);
        break;
      case 'validate':
        result = validateJSON(payload.input, payload.lenient);
        break;
      case 'diff':
        result = diffJSON(payload.left, payload.right, payload.ignoreOrder);
        break;
      case 'parse':
        result = { data: JSON.parse(payload.input) };
        break;
    }
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};

function formatJSON(input, indent) {
  const indentStr = indent === 'tab' ? '\t' : ' '.repeat(Number(indent) || 2);
  const parsed = JSON.parse(input);
  const output = JSON.stringify(parsed, null, indentStr);
  return { output, valid: true };
}

function minifyJSON(input) {
  const parsed = JSON.parse(input);
  return { output: JSON.stringify(parsed), valid: true };
}

function validateJSON(input, lenient) {
  if (lenient) {
    try {
      JSON.parse(input);
      return { valid: true, errors: [] };
    } catch (e) {
      // 尝试清理常见非标准内容
      let cleaned = input;
      // 移除单行注释（不在字符串内的）
      cleaned = removeComments(cleaned);
      // 移除尾随逗号
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      try {
        JSON.parse(cleaned);
        return { valid: true, errors: [], cleaned: cleaned };
      } catch (e2) {
        return { valid: false, errors: collectErrors(input) };
      }
    }
  }
  try {
    JSON.parse(input);
    return { valid: true, errors: [] };
  } catch (e) {
    return { valid: false, errors: collectErrors(input) };
  }
}

function removeComments(str) {
  let result = '';
  let inString = false;
  let stringChar = '';
  let i = 0;
  while (i < str.length) {
    if (inString) {
      if (str[i] === '\\') {
        result += str[i] + (str[i + 1] || '');
        i += 2;
        continue;
      }
      if (str[i] === stringChar) inString = false;
      result += str[i];
      i++;
    } else {
      if (str[i] === '"') {
        inString = true;
        stringChar = '"';
        result += str[i];
        i++;
      } else if (str[i] === '/' && str[i + 1] === '/') {
        // 跳到行尾
        while (i < str.length && str[i] !== '\n') i++;
      } else if (str[i] === '/' && str[i + 1] === '*') {
        i += 2;
        while (i < str.length && !(str[i] === '*' && str[i + 1] === '/')) i++;
        i += 2;
      } else {
        result += str[i];
        i++;
      }
    }
  }
  return result;
}

function collectErrors(input) {
  const errors = [];

  // 第一个错误：来自原生 JSON.parse
  try {
    JSON.parse(input);
  } catch (e) {
    const posResult = extractPosition(e.message, input);
    let line, col;
    if (typeof posResult === 'object' && posResult.line) {
      line = posResult.line;
      col = posResult.col;
    } else {
      const lc = posToLineCol(input, posResult);
      line = lc.line;
      col = lc.col;
    }
    errors.push({
      message: cleanErrorMessage(e.message),
      line, col
    });
  }

  // 简单 tokenizer 扫描，避免误匹配字符串内容
  let inString = false;
  let lineNum = 1;
  let i = 0;
  let lastLineStart = 0;

  while (i < input.length) {
    if (input[i] === '\n') {
      lineNum++;
      lastLineStart = i + 1;
      i++;
      continue;
    }

    if (inString) {
      if (input[i] === '\\') { i += 2; continue; }
      if (input[i] === '"') inString = false;
      i++;
      continue;
    }

    if (input[i] === '"') {
      inString = true;
      i++;
      continue;
    }

    // 跳过空白
    if (/\s/.test(input[i])) { i++; continue; }

    // 检测 undefined
    if (input.substring(i, i + 9) === 'undefined') {
      const col = i - lastLineStart + 1;
      const alreadyReported = errors.some(e => e.line === lineNum && e.col === col);
      if (!alreadyReported) {
        errors.push({ message: 'undefined is not a valid JSON value. Use null instead.', line: lineNum, col });
      }
      i += 9;
      continue;
    }

    // 检测单引号字符串
    if (input[i] === "'") {
      const col = i - lastLineStart + 1;
      const alreadyReported = errors.some(e => e.line === lineNum && e.col === col);
      if (!alreadyReported) {
        errors.push({ message: 'Single quotes are not valid in JSON. Use double quotes.', line: lineNum, col });
      }
      // 跳过单引号字符串内容
      i++;
      while (i < input.length && input[i] !== "'" && input[i] !== '\n') {
        if (input[i] === '\\') i++;
        i++;
      }
      if (input[i] === "'") i++;
      continue;
    }

    // 检测尾随逗号
    if (input[i] === ',') {
      // 往后看是否紧跟 } 或 ]（跳过空白和注释）
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) j++;
      if (j < input.length && (input[j] === '}' || input[j] === ']')) {
        const col = i - lastLineStart + 1;
        const alreadyReported = errors.some(e => e.line === lineNum && Math.abs(e.col - col) < 3);
        if (!alreadyReported) {
          errors.push({
            message: 'Trailing comma. Remove the comma or enable Lenient mode.',
            line: lineNum, col
          });
        }
      }
    }

    i++;
  }

  // 去重（按行列）
  const seen = new Set();
  return errors.filter(e => {
    const key = `${e.line}:${e.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractPosition(message, input) {
  // Chrome new format: "at position 326 (line 23 column 5)"
  let m = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (m) return { line: parseInt(m[1]), col: parseInt(m[2]) };
  // Chrome/Firefox: "at position 42"
  m = message.match(/position\s+(\d+)/i);
  if (m) return parseInt(m[1]);
  // Chrome latest: Unexpected token 'X', "..." is not valid JSON
  // or: Unexpected token 'X', ..."snippet" is not valid JSON
  if (input) {
    // Extract the problematic token
    m = message.match(/Unexpected token '(.)'/);
    if (m) {
      const token = m[1];
      // Try snippet from error: ...snippet" is not valid JSON
      const snippetMatch = message.match(/\.{3}"?(.+?)"?\s+is not valid/s);
      if (snippetMatch) {
        let raw = snippetMatch[1].replace(/^"|"$/g, '');
        // Error message may use literal \n for newlines
        const rawUnescaped = raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        let idx = input.indexOf(rawUnescaped);
        if (idx < 0) idx = input.indexOf(raw);
        if (idx >= 0) {
          const tokenIdx = input.indexOf(token, idx);
          if (tokenIdx >= 0) return tokenIdx;
          return idx;
        }
      }
      // Fallback: scan for where JSON structure breaks
      let inStr = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (inStr) {
          if (ch === '\\') { i++; continue; }
          if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === token) {
          // Check if this token is in a value position (after :)
          let j = i - 1;
          while (j >= 0 && /\s/.test(input[j])) j--;
          if (j >= 0 && input[j] === ':') return i;
        }
      }
    }
  }
  return 0;
}

function cleanErrorMessage(message) {
  return message
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^Unexpected/i, 'Unexpected')
    .replace(/^SyntaxError:\s*/i, '');
}

function posToLineCol(str, pos) {
  if (pos < 0) return { line: 1, col: 1 };
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < str.length; i++) {
    if (str[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

function diffJSON(left, right, ignoreOrder) {
  const leftObj = JSON.parse(left);
  const rightObj = JSON.parse(right);
  const changes = [];
  deepDiff(leftObj, rightObj, '', changes, ignoreOrder);
  return { changes };
}

function deepDiff(a, b, path, changes, ignoreOrder) {
  if (a === b) return;
  if (a === null || b === null || typeof a !== typeof b) {
    changes.push({ type: 'modified', path: path || '(root)', from: a, to: b });
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const p = path ? path + '[' + i + ']' : '[' + i + ']';
      if (i >= a.length) changes.push({ type: 'added', path: p, value: b[i] });
      else if (i >= b.length) changes.push({ type: 'removed', path: p, value: a[i] });
      else deepDiff(a[i], b[i], p, changes, ignoreOrder);
    }
    return;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (ignoreOrder) {
      // 语义对比：只看 key 存在和值，不看顺序
      const allKeys = new Set([...aKeys, ...bKeys]);
      for (const key of allKeys) {
        const p = path ? path + '.' + key : key;
        if (!(key in a)) changes.push({ type: 'added', path: p, value: b[key] });
        else if (!(key in b)) changes.push({ type: 'removed', path: p, value: a[key] });
        else deepDiff(a[key], b[key], p, changes, ignoreOrder);
      }
    } else {
      // 严格对比：key 顺序不同也算差异
      // 先检查顺序差异
      const commonKeys = aKeys.filter(k => k in b);
      const bCommonKeys = bKeys.filter(k => k in a);
      if (commonKeys.length === bCommonKeys.length && commonKeys.some((k, i) => k !== bCommonKeys[i])) {
        changes.push({
          type: 'modified',
          path: (path || '(root)') + ' [key order]',
          from: aKeys.join(', '),
          to: bKeys.join(', ')
        });
      }
      // 然后检查值差异
      const allKeys = new Set([...aKeys, ...bKeys]);
      for (const key of allKeys) {
        const p = path ? path + '.' + key : key;
        if (!(key in a)) changes.push({ type: 'added', path: p, value: b[key] });
        else if (!(key in b)) changes.push({ type: 'removed', path: p, value: a[key] });
        else deepDiff(a[key], b[key], p, changes, ignoreOrder);
      }
    }
    return;
  }
  if (a !== b) {
    changes.push({ type: 'modified', path: path || '(root)', from: a, to: b });
  }
}
