# DevKit — 在线开发者工具箱

免费、无广告、纯前端的在线开发者工具集合。数据不离开浏览器，安全可靠。

## ✨ 功能

### JSON 工具（SPA）
- **JSON 格式化** — 格式化、压缩、校验，支持宽松模式和错误行定位
- **JSON 树形视图** — 可视化浏览，支持 JSONPath 查询和虚拟滚动
- **JSON 转换** — JSON ↔ YAML / XML / CSV / TypeScript / Go / Java / Python / JSON Schema
- **JSON 对比** — 语义化差异对比，支持合并、字符级高亮

### 编解码工具
- **Base64 编解码** — 文本和文件互转
- **URL 编解码** — URL Encode / Decode
- **JWT 解码** — 解析 Header、Payload，查看过期时间

### 开发辅助工具
- **正则表达式测试** — 实时匹配高亮、分组捕获、常用模板
- **时间戳转换** — Unix 时间戳与日期时间互转，实时时钟
- **UUID 生成器** — 批量生成 v1/v4/v7，支持大小写和连字符选项
- **Hash 计算** — MD5 / SHA-1 / SHA-256 / SHA-512
- **颜色转换** — HEX / RGB / HSL 互转，调色板、渐变、对比度检查
- **Markdown 预览** — 实时渲染，支持代码高亮
- **Cron 表达式解析** — 可视化下次执行时间
- **文本对比** — 逐行差异对比
- **代码格式化** — HTML / CSS / JS 格式化
- **SQL 格式化** — SQL 语句美化

## 🛠 技术栈

- **纯前端**：HTML + CSS + JavaScript，无框架
- **构建工具**：Vite（多页面 MPA 架构）
- **代码编辑器**：CodeMirror 6（JSON SPA）
- **重计算**：Web Worker
- **设计风格**：Liquid Glass（液态玻璃），iOS 26 风格

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npx vite dev

# 构建
npx vite build

# 预览构建结果
npx vite preview
```

## 📁 项目结构

```
├── pages/
│   ├── index.html          # 首页
│   ├── json/index.html     # JSON SPA（4 个工具）
│   ├── base64/             # Base64 编解码
│   ├── url-codec/          # URL 编解码
│   ├── jwt/                # JWT 解码
│   ├── regex/              # 正则测试
│   ├── timestamp/          # 时间戳转换
│   ├── uuid/               # UUID 生成
│   ├── hash/               # Hash 计算
│   ├── color/              # 颜色转换
│   ├── markdown/           # Markdown 预览
│   ├── cron/               # Cron 解析
│   ├── text-diff/          # 文本对比
│   ├── code-formatter/     # 代码格式化
│   └── sql-formatter/      # SQL 格式化
├── shared/
│   ├── liquid-glass.css    # 共享样式
│   └── theme.js            # 主题切换
├── app.js                  # JSON SPA 主逻辑
├── converters.js           # JSON 格式转换器
├── json-worker.js          # Web Worker（JSON 处理）
├── worker-manager.js       # Worker 管理器
└── vite.config.js          # Vite 配置
```

## 📄 License

[MIT](LICENSE)
