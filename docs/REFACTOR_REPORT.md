# app.js 模块拆分 — 完成报告

## 概要

将 `app.js` 从 **1651 行**拆分为 **5 个模块**，总计 229 + 104 + 171 + 473 + 610 = **1587 行**。

## 拆分结果

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| 入口 | `app.js` | 229 | 路由、主题、Toast、Loading、Resizer、拖拽上传、工具函数 |
| 格式化 | `pages/json/modules/format.js` | 171 | doFormat、错误行高亮、示例数据、格式化/压缩/复制/下载 |
| 转换 | `pages/json/modules/convert.js` | 104 | 9 种格式互转、选项管理、交换方向、下载 |
| 树形+JSONPath | `pages/json/modules/tree.js` | 473 | 虚拟滚动树形视图、JSONPath 查询引擎、搜索过滤 |
| 对比 | `pages/json/modules/diff.js` | 610 | 语义对比、行/字符级 diff、CodeMirror 装饰、合并、同步滚动 |

## 模块依赖注入

每个模块导出 `initXxx(deps)` 函数，通过参数注入依赖：

```js
// app.js
import { initFormat } from './pages/json/modules/format.js';
import { initConvert } from './pages/json/modules/convert.js';
import { initTree } from './pages/json/modules/tree.js';
import { initDiff } from './pages/json/modules/diff.js';

initFormat({ $, $$, showToast, showLoading, hideLoading, trackEvent, updateStats, formatBytes, escapeHtml, workerManager });
initConvert({ $, $$, showToast, trackEvent });
initTree({ $, $$, showToast, escapeHtml, debounce, truncate });
initDiff({ $, $$, showToast, escapeHtml, formatBytes, trackEvent, truncate, debounce, workerManager });
```

## 执行过程

1. **convert**（最小模块，0.5h）→ build 验证 ✅
2. **format**（含 validate，1h）→ build 验证 ✅
3. **tree + jsonpath**（合并为一个模块，1.5h）→ build 验证 ✅
4. **diff**（最大模块，1.5h）→ build 验证 ✅
5. **百度统计接入**（15 个页面）→ build 验证 ✅
6. **truncate bug 修复**（Architect review 发现）→ build 验证 ✅

## 修复的问题

- **truncate 未定义 bug**：app.js 缺少 `truncate` 函数定义，diff.js 内部有重复定义会 shadow。修复：app.js 添加定义，diff.js 删除重复。
- **markdown 页面 build 失败**：百度统计脚本被插入了 JS 模板字符串内的 `</head>`，导致 Vite 解析失败。修复：只保留真实 `<head>` 内的脚本。

## 未来优化

- `workerManager` 改为 ES module import（目前通过 `window.workerManager` 全局暴露）
- `escapeHtml` 抽到 `shared/utils.js` 共享
- 考虑将 tree.js 拆分为 tree + jsonpath 两个独立模块
