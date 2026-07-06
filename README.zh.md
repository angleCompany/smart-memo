# Smart Memo

macOS 链接收集应用 —— 把 URL 丢进来就完事。无需整理即可保存，日后用搜索找回。

![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-356%20passing-brightgreen)

**[한국어](README.md) · [English](README.en.md) · 中文 · [日本語](README.ja.md)**

---

## 核心价值

> **Capture-to-saved < 1 秒。** 无需打开应用、无需切换标签页即可保存 URL。

---

## 主要功能一览

| 功能 | 说明 |
|------|------|
| ⌘⇧M 全局快捷键 | 在任何应用中即时呼出 URL 输入框 |
| URL Scheme | `smartmemo://capture?url=...` 无需启动应用即可保存 |
| CLI | `sm <url>` 在终端中保存 |
| Capture-Receipt 提示 | 保存后无需切换应用，右下角显示 1.8 秒通知 |
| URL 元数据自动获取 | 自动解析标题、描述、缩略图和分类 |
| YouTube 专项支持 | 通过 oEmbed 精准获取视频标题、频道和缩略图 |
| 标签系统 | 自由添加标签，侧边栏按标签筛选 |
| 自动分类 | 基于域名分类：Video · Code · Article · Social 等 |
| 备忘录 | 使用内联 Markdown 编辑器，无需 URL 也能记录备忘 |
| 待办 | 快速记录并用复选框标记完成，已完成项移至底部 |
| 全文搜索 | 跨标题、URL、域名、备忘录、待办统一检索 |
| 回收站 | 软删除（保留 30 天），恢复 · 彻底删除 |
| iCloud 同步 | 同一 Apple 账号下的所有 Mac 自动同步 |
| 导出 / 导入 | JSON 备份与迁移 |

---

## 📥 安装与下载

### 1. 下载发行版（推荐）

从 GitHub 仓库的最新 Releases 页面下载符合你 Mac 配置的安装文件（`.dmg`）。
* 🔗 **[下载最新版本](https://github.com/angleCompany/smart-memo/releases/latest)**
  * **Apple Silicon（M1/M2/M3/M4 等）**：`Smart-Memo-X.Y.Z-arm64.dmg`
  * **Intel Mac**：`Smart-Memo-X.Y.Z-x64.dmg`

### 2. 安装步骤

1. 双击下载的 `.dmg` 文件进行挂载。
2. 在打开的窗口中，将 **Smart Memo** 应用图标拖放到 **应用程序（Applications）** 文件夹。
3. 现在即可在 Launchpad 或应用程序文件夹中找到并启动应用。

> [!IMPORTANT]
> **⚠️ 出现"未验证的开发者"警告时的解决方法**
>
> 本应用为开源应用，未使用 Apple 开发者付费签名，因此首次运行时可能出现警告。请通过以下任一方法允许运行。
>
> * **方法 A（推荐）：在 Finder 中允许运行**
>   1. 在 Finder 的 **应用程序** 文件夹中找到 `Smart Memo` 应用。
>   2. 按住 `Control` 键点击应用图标（右键点击），选择 **[打开]**。
>   3. 在警告对话框中再次点击 **[打开]**，之后即可正常双击启动。
>
> * **方法 B（使用终端）：解除隔离**
>   打开终端，输入以下命令以移除 macOS 的隔离属性（quarantine）。
>   ```bash
>   xattr -cr "/Applications/Smart Memo.app"
>   ```

### 从源码直接运行

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

环境要求：Node.js 18+、macOS 12+

---

## 💡 使用方法

### 🚀 1. 极速 URL 保存（全局快捷键 `⌘ + ⇧ + M`）

这是 Smart Memo 的核心功能。即使正在使用其他应用，也能用一个快捷键在 1 秒内收集 URL。

1. **触发快捷键**：在键盘上按 **`Command(⌘) + Shift(⇧) + M`**。
2. **激活输入框**：屏幕顶部出现一个简洁的 URL 输入框。
   * *提示*：如果剪贴板中已复制了 URL，将**自动填入输入框。**
3. **保存完成**：按 **`Enter`** 键即可完成保存并关闭窗口。
   * 保存成功后，屏幕右下角会出现已解析元数据的提示通知（Capture-Receipt）。
   * 若为已保存的重复 URL，则显示警告通知。
   * 要取消并关闭，请按 **`Esc`** 键。

---

### 2. URL Scheme（`smartmemo://`）

无需打开或切换应用，即可从外部将 URL 保存到 Smart Memo。
可从其他应用、脚本或自动化工具调用。

**支持的命令**

| URL | 动作 |
|-----|------|
| `smartmemo://capture?url=<编码后的 URL>` | 保存 URL 后显示 Capture-Receipt 提示 |
| `smartmemo://open` | 打开 Smart Memo 主窗口 |

**在终端中直接使用**

```bash
open "smartmemo://capture?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo"
open "smartmemo://open"
```

**macOS 快捷指令（Shortcuts.app）联动**

在 Safari、新闻等任何位置通过共享菜单一键保存：

1. 快捷指令应用 → 新建快捷指令
2. 添加"获取 URL"操作
3. 添加"打开 URL"操作 → 在 URL 栏输入 `smartmemo://capture?url=`，再拼接 URL 变量
4. 将快捷指令添加到共享菜单 → 即可从 Safari 的共享按钮直接保存

---

### 3. CLI（`sm`）

在终端 · 脚本 · Alfred · 管道中保存 URL。

**安装（一次性）**

```bash
# 在项目根目录或安装路径下执行
ln -sf "$(pwd)/bin/sm" /usr/local/bin/sm
```

**用法**

```bash
sm <url>    # 保存 URL
sm open     # 打开 Smart Memo
```

**应用示例**

```bash
# 立即保存剪贴板中的 URL
pbpaste | xargs sm

# 从文件批量保存多个 URL
while read url; do sm "$url"; done < urls.txt

# 用 curl 保存最终重定向后的 URL
sm "$(curl -Ls -o /dev/null -w '%{url_effective}' https://bit.ly/xyz)"
```

---

### 4. 备忘录 & 待办

**备忘录** —— 保存非 URL 的自由备忘。

- 点击工具栏 **✏️ 新建备忘** → 内联 Markdown 编辑器（`#` 标题 · `-` 列表 · `>` 引用，按 Enter 转换）
- 用 **⌘ + Enter** 保存，也可同时指定标签

**待办** —— 随手记录待办并勾选完成。

1. 点击工具栏 **✅ 新建待办** → 在弹窗中输入**多行**内容并用 **⌘+Enter**（或保存）添加
2. 点击列表中的 **复选框** → 切换完成（已完成项带删除线移至底部，不会消失）
3. 点击卡片 → 在详情中查看完整内容，用 **编辑** 按钮修改内容和标签
4. 侧边栏的 **待办** 徽标显示 **未完成数量**
5. 待办同样纳入搜索、标签、回收站、iCloud 同步与导出

---

### 5. 标签

- 在右侧详情面板输入标签后按 **Enter** → 添加
- 点击侧边栏底部的标签列表 → 按该标签筛选
- 点击标签旁的 `×` → 移除

---

### 6. 搜索

在顶部搜索框中输入，即可实时跨标题、URL、域名、备忘录和待办内容进行统一搜索。

---

### 7. 回收站

- 删除项目 → 在回收站保留 30 天
- 侧边栏"回收站" → 查看列表，逐个恢复或彻底删除
- "清空回收站" → 全部永久删除

---

### 8. iCloud Drive 同步

1. 点击应用侧边栏底部的 **⚙️**
2. 开启 **"保存至 iCloud Drive"** 开关
3. 数据位置：`~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. 登录同一 Apple 账号的所有 Mac 自动同步

**与其他 Apple 账号共享**

1. 开启 iCloud 同步后，点击"在 Finder 中打开 SmartMemo 文件夹"
2. 右键文件夹 → 共享 → 协作邀请
3. 输入对方的 Apple ID → 对方接受后实时共享

---

### 9. 导出 / 导入

- **导出**：设置 → 导出数据 → 保存 JSON 文件（备份·迁移）
- **导入**：设置 → 导入数据 → 选择文件
  - **合并模式**：保留现有数据，仅添加新项目（跳过重复项）
  - **替换模式**：用导入的文件完全替换现有数据

---

## 🛠️ 开发与部署

### 本地开发与测试

```bash
npm install          # 安装依赖
npm start            # 本地运行应用（开发版）
npm test             # 运行全部测试（356 个单元/集成测试）
npm run test:watch   # 以 Vitest watch 模式运行
```

### 打包与构建

```bash
npm run build:arm64  # 构建 Apple Silicon（M 系列）macOS DMG
npm run build:x64    # 构建 Intel macOS DMG
npm run build        # 构建两种架构的 DMG
```

### 🤖 自动部署（CI/CD）

本仓库已通过 GitHub Actions 启用自动部署。
1. 修改 `package.json` 中的 `"version"` 值并推送代码。
2. 在终端中如下所示打上新的版本标签并推送到远程仓库。
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions 会自动在 macOS 实例上构建应用，并将构建产物（`.dmg`）上传到最新的发布页面。

### 项目结构

```
smart-memo/
├── main.js              # Electron 主进程（composition root）
├── renderer.js          # UI 入口（ES Module）
├── preload.js           # 主窗口 IPC 桥接
├── capturePreload.js    # 捕获窗口 IPC 桥接
├── index.html           # 主窗口
├── capture.html         # 捕获窗口（⌘⇧M）
├── receipt.html         # Capture-Receipt 提示窗口
├── src/
│   ├── domain/          # 纯业务逻辑（无外部依赖）
│   │   ├── url.js           # URL 规范化 · 校验 · SSRF 防御
│   │   ├── tags.js          # 标签 CRUD
│   │   ├── itemFilter.js    # 筛选 · 排序
│   │   ├── itemSanitizer.js # 导入数据校验 · XSS 防御
│   │   ├── htmlMeta.js      # og:*/meta 解析
│   │   ├── idGenerator.js   # 唯一 ID 生成
│   │   └── trashPolicy.js   # 回收站策略
│   ├── application/     # 用例
│   │   ├── captureService.js      # URL 保存 + 后台元数据获取
│   │   ├── itemService.js         # CRUD + 待办 + 回收站 + 搜索
│   │   ├── importExportService.js # 导出/导入
│   │   └── syncService.js         # iCloud 同步
│   ├── infrastructure/  # 外部依赖（文件 · 网络 · iCloud）
│   │   ├── fileStorage.js     # 原子文件写入（tmp → rename）
│   │   ├── configStore.js     # 配置文件存储
│   │   ├── fileWatcher.js     # 文件变更检测（防抖）
│   │   ├── httpFetcher.js     # HTTP 请求（自动处理 redirect · gzip）
│   │   ├── metadataFetcher.js # 元数据获取（含 YouTube oEmbed）
│   │   └── icloudDetector.js  # iCloud Drive 路径探测
│   └── ui/              # 浏览器渲染器（ES Module）
│       ├── state.js
│       ├── categories.js
│       ├── utils.js
│       └── views/
│           ├── sidebar.js
│           ├── itemList.js
│           ├── detail.js
│           ├── modals.js
│           └── sync.js
├── bin/
│   └── sm               # CLI 脚本
└── tests/               # 测试（18 个文件，356 个）
    ├── unit/
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    └── fakes/
        └── inMemoryStorage.js
```

### 架构

Clean Architecture（Hexagonal） —— Domain → Application → Infrastructure 单向依赖。

- **Domain**：纯 JS，无 fs/Electron 依赖 → 独立单元测试
- **Application**：使用 InMemoryStorage fake 进行快速测试，无实际文件 I/O
- **Infrastructure**：使用真实 tmpdir · 本地 HTTP 服务器进行集成测试
- **CJS/ESM 分离**：main.js + src/ 为 CommonJS，renderer.js + src/ui/ 为 ESM（`sandbox: true` 环境）

---

## 技术栈

| 领域 | 技术 |
|------|------|
| 桌面框架 | Electron 28 |
| 主进程 | Node.js（CommonJS） |
| 渲染器 | Vanilla JS（ES Module） |
| 存储 | JSON 文件（原子写入） |
| 测试 | Vitest |

---

## 开源协议

MIT © 2026 angleCompany
