# app.js 模块拆分方案

## 当前结构（1651 行，单文件）

```
app.js
├── L1-7     共用工具：$, $$
├── L8-24    Theme 初始化
├── L25-55   Analytics + Toast + Loading
├── L56-229  路由、视图切换、Resizer、拖拽上传、文件按钮、格式化工具函数
├── L230-456   MODULE: Format（doFormat, highlightErrorLines, clearErrorHighlights）
├── L457-675   MODULE: TreeView（flattenTree, buildVisibleList, renderTreeRow, renderVirtualTree）
├── L676-927   MODULE: JSONPath（evaluateJSONPath, tokenizeJSONPath, collectRecursive, matchFilter）
├── L928-1039  MODULE: Convert（updateConvertLabels, doConvert）
├── L1040-1641 MODULE: Diff（initDiff, computeLineDiff, computeCharDiff, renderDiff, applyDiffDecorations, mergeSide）
├── L1642-1651 Helpers（getDiffContent, setDiffContent）
```

## 目标结构

```
pages/json/
├── app.js           ← 入口：import 各模块，路由初始化，共用 UI（theme/toast/resizer/dragdrop）
├── modules/
│   ├── format.js    ← doFormat, highlightErrorLines, clearErrorHighlights
│   ├── tree.js      ← flattenTree, buildVisibleList, renderTreeRow, renderVirtualTree
│   ├── jsonpath.js  ← evaluateJSONPath, tokenizeJSONPath, collectRecursive, matchFilter
│   ├── convert.js   ← updateConvertLabels, doConvert（import Converters）
│   └── diff.js      ← initDiff, computeLineDiff, computeCharDiff, renderDiff, applyDiffDecorations, mergeSide
```

## 模块接口设计

### app.js（入口，~230 行）
```js
import { initFormat } from './modules/format.js';
import { initTree } from './modules/tree.js';
import { initJSONPath } from './modules/jsonpath.js';
import { initConvert } from './modules/convert.js';
import { initDiff } from './modules/diff.js';
import workerManager from '../../worker-manager.js';

// 共用：$, $$, theme, analytics, toast, loading, route, switchView, resizer, dragdrop, fileUpload, formatBytes, countLines, updateStats
// 在 switchView 中调用各模块 init
```

### modules/format.js（~226 行）
```js
export function initFormat(deps) { ... }
// deps: { $, workerManager, showToast, showLoading, hideLoading, trackEvent, updateStats, formatBytes }
export function doFormat(mode) { ... }
export function highlightErrorLines(errors) { ... }
export function clearErrorHighlights() { ... }
```

### modules/tree.js（~218 行）
```js
export function initTree(deps) { ... }
// deps: { $, $$, showToast, copyText }
export function renderVirtualTree() { ... }
```

### modules/jsonpath.js（~251 行）
```js
export function initJSONPath(deps) { ... }
// deps: { $, showToast, copyText }
export function evaluateJSONPath(data, expr) { ... }
```

### modules/convert.js（~111 行）
```js
import Converters from '../../converters.js';
export function initConvert(deps) { ... }
// deps: { $, showToast, copyText, trackEvent }
```

### modules/diff.js（~601 行，最大模块）
```js
export function initDiff(deps) { ... }
// deps: { $, showToast, formatBytes, trackEvent }
// 内部使用 window._cmDiffViews / window._cmDiffTools（后续改 import）
```

## 迁移步骤

1. 创建 `modules/` 目录
2. 逐个模块提取：先 convert（最小），再 format/tree/jsonpath，最后 diff（最大）
3. 每提取一个模块，build + 手动验证该功能
4. 最后清理 window 全局变量，改用 ES module import

## 风险控制

- **部署后再动**（Architect 建议）
- 每个模块提取后单独 build 验证
- 保留 window fallback 到全部迁移完成
- QA 做一轮回归确认

## 预估工作量

- convert: 0.5h
- format: 1h
- tree: 1h
- jsonpath: 1h
- diff: 2h
- 联调 + 清理: 1h
- **总计: ~6.5h**
