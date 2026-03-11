// ============================================================
// JSONKit — Converters (JSON ↔ YAML/XML/CSV, JSON → TS/Go/Java/Python/Schema)
// Pure JS, no dependencies
// ============================================================

const Converters = {
  // ── JSON → YAML ──
  jsonToYaml(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return String(obj);
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#') ||
          obj.includes('{') || obj.includes('}') || obj.includes('[') ||
          obj.includes(']') || obj.includes(',') || obj.includes('&') ||
          obj.includes('*') || obj.includes('!') || obj.includes('|') ||
          obj.includes('>') || obj.includes("'") || obj.includes('"') ||
          obj.includes('%') || obj.includes('@') || obj === '' ||
          obj === 'true' || obj === 'false' || obj === 'null' ||
          !isNaN(Number(obj))) {
        return JSON.stringify(obj);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return '\n' + obj.map(item => {
        const val = Converters.jsonToYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const lines = val.trim().split('\n');
          return pad + '- ' + lines[0] + (lines.length > 1 ? '\n' + lines.slice(1).map(l => pad + '  ' + l).join('\n') : '');
        }
        return pad + '- ' + val.trim();
      }).join('\n');
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      const lines = keys.map(key => {
        const val = Converters.jsonToYaml(obj[key], indent + 1);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          return pad + key + ':' + (val.startsWith('\n') ? val : ' ' + val);
        }
        return pad + key + ': ' + val;
      });
      return (indent === 0 ? '' : '\n') + lines.join('\n');
    }
    return String(obj);
  },

  // ── YAML → JSON (simple parser) ──
  yamlToJson(yaml) {
    // Simple YAML parser for common cases
    const lines = yaml.split('\n');
    return JSON.stringify(Converters._parseYamlLines(lines, 0).value, null, 2);
  },

  _parseYamlLines(lines, startIndent) {
    const result = {};
    let isArray = false;
    let arr = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (!trimmed || trimmed.startsWith('#')) { i++; continue; }

      const currentIndent = line.length - trimmed.length;
      if (currentIndent < startIndent) break;
      if (currentIndent > startIndent && !isArray) break;

      if (trimmed.startsWith('- ')) {
        isArray = true;
        const val = trimmed.substring(2).trim();
        if (val === '' || val.endsWith(':')) {
          // nested object in array
          const sub = Converters._parseYamlLines(lines.slice(i + 1), currentIndent + 2);
          if (val.endsWith(':')) {
            const key = val.slice(0, -1);
            const obj = {};
            obj[key] = sub.value;
            arr.push(obj);
          } else {
            arr.push(sub.value);
          }
          i += 1 + sub.consumed;
        } else {
          arr.push(Converters._parseYamlValue(val));
          i++;
        }
        continue;
      }

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.substring(0, colonIdx).trim();
        const val = trimmed.substring(colonIdx + 1).trim();
        if (val === '' || val === '|' || val === '>') {
          const sub = Converters._parseYamlLines(lines.slice(i + 1), currentIndent + 2);
          result[key] = sub.value;
          i += 1 + sub.consumed;
        } else {
          result[key] = Converters._parseYamlValue(val);
          i++;
        }
        continue;
      }
      i++;
    }
    return { value: isArray ? arr : result, consumed: i };
  },

  _parseYamlValue(str) {
    if (str === 'null' || str === '~') return null;
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (/^-?\d+$/.test(str)) return parseInt(str);
    if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str);
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'")))
      return str.slice(1, -1);
    if (str.startsWith('[')) { try { return JSON.parse(str); } catch(e) {} }
    if (str.startsWith('{')) { try { return JSON.parse(str); } catch(e) {} }
    return str;
  },

  // ── JSON → XML ──
  jsonToXml(obj, rootName = 'root') {
    function toXml(data, tag, indent) {
      const pad = '  '.repeat(indent);
      if (data === null) return `${pad}<${tag} xsi:nil="true"/>`;
      if (typeof data !== 'object') {
        const escaped = String(data).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `${pad}<${tag}>${escaped}</${tag}>`;
      }
      if (Array.isArray(data)) {
        return data.map(item => toXml(item, 'item', indent)).join('\n');
      }
      const children = Object.entries(data).map(([k, v]) => {
        if (Array.isArray(v)) {
          return `${pad}  <${k}>\n${v.map(item => toXml(item, 'item', indent + 2)).join('\n')}\n${pad}  </${k}>`;
        }
        return toXml(v, k, indent + 1);
      }).join('\n');
      return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(obj, rootName, 0);
  },

  // ── XML → JSON (simple parser) ──
  xmlToJson(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const errors = doc.querySelector('parsererror');
    if (errors) throw new Error('XML 解析失败：' + errors.textContent.substring(0, 100));

    function nodeToObj(node) {
      if (node.nodeType === 3) return node.textContent.trim();
      if (node.nodeType !== 1) return null;

      const children = Array.from(node.childNodes).filter(n =>
        n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())
      );

      if (children.length === 0) return null;
      if (children.length === 1 && children[0].nodeType === 3) {
        const text = children[0].textContent.trim();
        if (text === 'true') return true;
        if (text === 'false') return false;
        if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
        return text;
      }

      const result = {};
      children.forEach(child => {
        if (child.nodeType !== 1) return;
        const key = child.tagName;
        const val = nodeToObj(child);
        if (key in result) {
          if (!Array.isArray(result[key])) result[key] = [result[key]];
          result[key].push(val);
        } else {
          result[key] = val;
        }
      });
      return result;
    }

    return JSON.stringify(nodeToObj(doc.documentElement), null, 2);
  },

  // ── JSON → CSV ──
  jsonToCsv(data) {
    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) data = [data];
      else throw new Error('CSV 转换需要数组或对象');
    }
    if (data.length === 0) return '';
    const headers = [...new Set(data.flatMap(row => typeof row === 'object' && row ? Object.keys(row) : []))];
    const csvEscape = (val) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const rows = [headers.join(',')];
    data.forEach(row => {
      if (typeof row !== 'object' || row === null) return;
      rows.push(headers.map(h => csvEscape(row[h])).join(','));
    });
    return rows.join('\n');
  },

  // ── CSV → JSON ──
  csvToJson(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV 至少需要标题行和数据行');
    const headers = Converters._parseCsvLine(lines[0]);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = Converters._parseCsvLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => {
        let val = values[idx] || '';
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null') val = null;
        else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
        obj[h] = val;
      });
      result.push(obj);
    }
    return JSON.stringify(result, null, 2);
  },

  _parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (inQuotes) {
        if (line[i] === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (line[i] === '"') inQuotes = false;
        else current += line[i];
      } else {
        if (line[i] === '"') inQuotes = true;
        else if (line[i] === ',') { result.push(current); current = ''; }
        else current += line[i];
      }
    }
    result.push(current);
    return result;
  },

  // ── JSON → TypeScript ──
  jsonToTypeScript(obj, name = 'Root', options = {}) {
    const useInterface = options.useInterface !== false;
    const definitions = [];
    function inferType(val, typeName) {
      if (val === null) return 'null';
      if (typeof val === 'boolean') return 'boolean';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'string') return 'string';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'any[]';
        const itemType = inferType(val[0], typeName + 'Item');
        return itemType + '[]';
      }
      if (typeof val === 'object') {
        const iName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
        const fields = Object.entries(val).map(([k, v]) => {
          const fieldType = inferType(v, k);
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`;
          return `  ${safeKey}: ${fieldType};`;
        });
        if (useInterface) {
          definitions.push(`interface ${iName} {\n${fields.join('\n')}\n}`);
        } else {
          definitions.push(`type ${iName} = {\n${fields.join('\n')}\n};`);
        }
        return iName;
      }
      return 'any';
    }
    inferType(obj, name);
    return definitions.reverse().join('\n\n');
  },

  // ── JSON → Go Struct ──
  jsonToGo(obj, name = 'Root') {
    const structs = [];
    function goType(val, fieldName) {
      if (val === null) return 'interface{}';
      if (typeof val === 'boolean') return 'bool';
      if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float64';
      if (typeof val === 'string') return 'string';
      if (Array.isArray(val)) {
        if (val.length === 0) return '[]interface{}';
        return '[]' + goType(val[0], fieldName);
      }
      if (typeof val === 'object') {
        const sName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        const fields = Object.entries(val).map(([k, v]) => {
          const goName = k.charAt(0).toUpperCase() + k.slice(1).replace(/[_-](.)/g, (_, c) => c.toUpperCase());
          return `\t${goName} ${goType(v, k)} \`json:"${k}"\``;
        });
        structs.push(`type ${sName} struct {\n${fields.join('\n')}\n}`);
        return sName;
      }
      return 'interface{}';
    }
    goType(obj, name);
    return structs.reverse().join('\n\n');
  },

  // ── JSON → Java Class ──
  jsonToJava(obj, name = 'Root', options = {}) {
    const classes = [];
    function javaType(val, fieldName) {
      if (val === null) return 'Object';
      if (typeof val === 'boolean') return 'boolean';
      if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
      if (typeof val === 'string') return 'String';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'List<Object>';
        return 'List<' + javaType(val[0], fieldName).replace(/^(int|double|boolean)$/, m => ({int:'Integer',double:'Double',boolean:'Boolean'})[m]) + '>';
      }
      if (typeof val === 'object') {
        const cName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        const fieldEntries = Object.entries(val);
        const fields = fieldEntries.map(([k, v]) => `    private ${javaType(v, k)} ${k};`);

        let classBody = fields.join('\n');

        // Getter/Setter
        if (options.getterSetter && !options.lombok) {
          const methods = fieldEntries.map(([k, v]) => {
            const type = javaType(v, k);
            const cap = k.charAt(0).toUpperCase() + k.slice(1);
            const getter = type === 'boolean'
              ? `    public ${type} is${cap}() { return ${k}; }`
              : `    public ${type} get${cap}() { return ${k}; }`;
            const setter = `    public void set${cap}(${type} ${k}) { this.${k} = ${k}; }`;
            return getter + '\n' + setter;
          });
          classBody += '\n\n' + methods.join('\n\n');
        }

        const annotations = options.lombok ? '@Data\n' : '';
        classes.push(`${annotations}public class ${cName} {\n${classBody}\n}`);
        return cName;
      }
      return 'Object';
    }
    javaType(obj, name);
    const imports = [];
    if (options.lombok) imports.push('import lombok.Data;');
    const prefix = imports.length ? imports.join('\n') + '\n\n' : '';
    return prefix + classes.reverse().join('\n\n');
  },

  // ── JSON → Python Dataclass/Pydantic ──
  jsonToPython(obj, name = 'Root', options = {}) {
    const usePydantic = options.pydantic || false;
    const classes = [];
    function pyType(val, fieldName) {
      if (val === null) return 'None';
      if (typeof val === 'boolean') return 'bool';
      if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
      if (typeof val === 'string') return 'str';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'list';
        return `list[${pyType(val[0], fieldName)}]`;
      }
      if (typeof val === 'object') {
        const cName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        const fields = Object.entries(val).map(([k, v]) => {
          return `    ${k}: ${pyType(v, k)}`;
        });
        const decorator = usePydantic ? '' : '@dataclass\n';
        const base = usePydantic ? '(BaseModel)' : '';
        classes.push(`${decorator}class ${cName}${base}:\n${fields.join('\n')}`);
        return cName;
      }
      return 'Any';
    }
    pyType(obj, name);
    const importLine = usePydantic
      ? 'from pydantic import BaseModel'
      : 'from dataclasses import dataclass';
    return importLine + '\n\n' + classes.reverse().join('\n\n');
  },

  // ── JSON → JSON Schema ──
  jsonToSchema(obj) {
    function inferSchema(val) {
      if (val === null) return { type: 'null' };
      if (typeof val === 'boolean') return { type: 'boolean' };
      if (typeof val === 'number') return Number.isInteger(val) ? { type: 'integer' } : { type: 'number' };
      if (typeof val === 'string') return { type: 'string' };
      if (Array.isArray(val)) {
        if (val.length === 0) return { type: 'array', items: {} };
        return { type: 'array', items: inferSchema(val[0]) };
      }
      if (typeof val === 'object') {
        const properties = {};
        const required = [];
        Object.entries(val).forEach(([k, v]) => {
          properties[k] = inferSchema(v);
          required.push(k);
        });
        return { type: 'object', properties, required };
      }
      return {};
    }
    return JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', ...inferSchema(obj) }, null, 2);
  },

  // ── Dispatch ──
  convert(input, from, to, options = {}) {
    // Parse input
    let data;
    if (from === 'json') {
      data = JSON.parse(input);
    } else if (from === 'yaml') {
      return Converters.yamlToJson(input);
    } else if (from === 'xml') {
      return Converters.xmlToJson(input);
    } else if (from === 'csv') {
      return Converters.csvToJson(input);
    }

    // Convert to target
    switch (to) {
      case 'yaml': return Converters.jsonToYaml(data);
      case 'xml': return Converters.jsonToXml(data);
      case 'csv': return Converters.jsonToCsv(data);
      case 'typescript': return Converters.jsonToTypeScript(data, 'Root', options);
      case 'go': return Converters.jsonToGo(data);
      case 'java': return Converters.jsonToJava(data, 'Root', options);
      case 'python': return Converters.jsonToPython(data, 'Root', options);
      case 'jsonschema': return Converters.jsonToSchema(data);
      case 'json': return JSON.stringify(data, null, 2);
      default: throw new Error(`不支持的目标格式：${to}`);
    }
  }
};

export default Converters;
window.Converters = Converters;
