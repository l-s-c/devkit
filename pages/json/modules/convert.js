// ============================================================
// CONVERT MODULE
// ============================================================
import Converters from '../../../converters.js';

const formatNames = { json:'JSON', yaml:'YAML', xml:'XML', csv:'CSV', typescript:'TypeScript', go:'Go Struct', java:'Java Class', python:'Python Dataclass', jsonschema:'JSON Schema' };
const formatExts = { json:'.json', yaml:'.yaml', xml:'.xml', csv:'.csv', typescript:'.ts', go:'.go', java:'.java', python:'.py', jsonschema:'.schema.json' };

export function initConvert({ $, $$, showToast, trackEvent }) {
  function updateConvertLabels() {
    const from = $('#convertFrom').value;
    const to = $('#convertTo').value;
    $('#convertInputLabel').textContent = (formatNames[from] || from.toUpperCase()) + ' 输入';
    $('#convertOutputLabel').textContent = (formatNames[to] || to.toUpperCase()) + ' 输出';
  }
  function updateConvertOptions() {
    const to = $('#convertTo').value;
    $$('.convert-option').forEach(el => el.style.display = 'none');
    if (to === 'java') {
      $('#optGetterSetter').style.display = '';
      $('#optLombok').style.display = '';
    } else if (to === 'typescript') {
      $('#optInterface').style.display = '';
    } else if (to === 'python') {
      $('#optPydantic').style.display = '';
    }
  }
  $('#convertFrom').addEventListener('change', () => { updateConvertLabels(); updateConvertOptions(); });
  $('#convertTo').addEventListener('change', () => { updateConvertLabels(); updateConvertOptions(); });
  updateConvertLabels();
  updateConvertOptions();

  $('#convertSwap').addEventListener('click', () => {
    const from = $('#convertFrom');
    const to = $('#convertTo');
    const fromVal = from.value;
    const toVal = to.value;
    const fromOpts = [...from.options].map(o => o.value);
    const toOpts = [...to.options].map(o => o.value);
    if (fromOpts.includes(toVal) && toOpts.includes(fromVal)) {
      from.value = toVal;
      to.value = fromVal;
      updateConvertLabels();
    } else {
      showToast('无法交换：目标格式不支持作为源格式', 'error');
    }
  });

  $('#convertBtn').addEventListener('click', () => {
    const input = $('#convertInput').value.trim();
    if (!input) { showToast('请输入要转换的内容', 'error'); return; }
    const from = $('#convertFrom').value;
    const to = $('#convertTo').value;
    if (from === to) { showToast('源格式和目标格式相同', 'error'); return; }
    const start = performance.now();
    try {
      const options = {
        getterSetter: $('#convertGetterSetter')?.checked || false,
        lombok: $('#convertLombok')?.checked || false,
        useInterface: $('#convertInterface')?.checked !== false,
        pydantic: $('#convertPydantic')?.checked || false,
      };
      const result = Converters.convert(input, from, to, options);
      const elapsed = Math.round(performance.now() - start);
      $('#convertOutput').value = result;
      $('#convertStatus').textContent = `${formatNames[from]} → ${formatNames[to]}`;
      $('#convertTime').textContent = `转换用时 ${elapsed}ms`;
      showToast(`转换成功（${elapsed}ms）`, 'success');
      trackEvent('convert', `${from}-to-${to}`, `${elapsed}ms`);
    } catch (err) {
      $('#convertOutput').value = '';
      $('#convertStatus').textContent = '';
      $('#convertTime').textContent = '';
      showToast('转换失败：' + err.message, 'error');
    }
  });

  $('#convertClear').addEventListener('click', () => {
    $('#convertInput').value = '';
    $('#convertOutput').value = '';
    $('#convertStatus').textContent = '';
    $('#convertTime').textContent = '';
  });

  $('#convertCopy').addEventListener('click', () => {
    const output = $('#convertOutput').value;
    if (!output) { showToast('没有可复制的内容', 'error'); return; }
    navigator.clipboard.writeText(output).then(() => showToast('已复制到剪贴板', 'success'));
  });

  $('#convertDownload').addEventListener('click', () => {
    const output = $('#convertOutput').value;
    if (!output) { showToast('没有可下载的内容', 'error'); return; }
    const to = $('#convertTo').value;
    const ext = formatExts[to] || '.txt';
    const mimeTypes = { json:'application/json', yaml:'text/yaml', xml:'application/xml', csv:'text/csv' };
    const blob = new Blob([output], { type: mimeTypes[to] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'converted' + ext; a.click();
    URL.revokeObjectURL(url);
    showToast(`已下载 converted${ext}`, 'success');
  });
}
