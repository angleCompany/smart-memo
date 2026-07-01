# 📌 Smart Memo

macOS 智能书签与备忘录应用 — 粘贴 URL 后自动获取标题、描述和缩略图，并自动分类整理。

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**[한국어](README.md) · [English](README.en.md) · 中文 · [日本語](README.ja.md)**

---

## 主要功能

| 功能 | 说明 |
|------|------|
| 🔗 **URL 自动获取元数据** | 粘贴 URL 后自动获取标题、描述和缩略图 |
| 🎬 **YouTube 专项支持** | 通过 oEmbed API 精准获取视频标题、频道名和缩略图 |
| 🏷️ **自动分类** | 根据域名自动归类：视频、代码、文章、社交、韩文等 |
| ✏️ **快速备忘录** | 自由格式文本记录（⌘+Enter 快速保存） |
| ☁️ **iCloud Drive 同步** | 同一 Apple 账号下所有 Mac 自动同步 |
| 👥 **跨账号共享** | 通过 iCloud Drive 共享文件夹与其他 Apple 账号共享数据 |
| 🔍 **全文搜索** | 跨标题、URL、内容、域名统一检索 |
| 📤 **导出 / 导入** | JSON 格式备份与还原 |

---

## 安装方式

### 方式一 — 直接安装 DMG（推荐）

1. 从 [Releases 页面](https://github.com/angleCompany/smart-memo/releases/latest) 下载 DMG
   - Apple Silicon（M1/M2/M3/M4等）：`Smart-Memo-X.Y.Z-arm64.dmg`
   - Intel Mac：`Smart-Memo-X.Y.Z-x64.dmg`
2. 打开 DMG，将 `Smart Memo.app` 拖入 `/Applications` 文件夹

> **如果 macOS 显示安全警告（未验证的开发者）**
> 本应用目前未进行 Apple 开发者证书签名，首次运行时请通过以下任一方式解决：
>
> **方式 A** — 在 Finder 中右键点击 `Smart Memo.app` → **打开** → 点击 **打开**
>
> **方式 B** — 在终端中执行：
> ```bash
> xattr -cr "/Applications/Smart Memo.app"
> ```

---

### 方式二 — 从源码运行

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

**环境要求：** Node.js 18+、macOS 12+

---

## 更新

要更新应用，请从 [Releases 页面](https://github.com/angleCompany/smart-memo/releases/latest) 下载最新的 `.dmg`，并替换 `/Applications` 文件夹中的现有应用。

---

## 卸载

```bash
brew uninstall --cask smart-memo
```

同时删除所有已保存的数据：

```bash
brew uninstall --cask smart-memo --zap
```

---

## iCloud 同步设置

1. 启动应用，点击侧边栏底部的 **⚙️**
2. 开启 **"保存至 iCloud Drive"**
3. 数据将移至 `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. 登录同一 Apple 账号的所有 Mac 自动同步

### 与其他 Apple 账号共享

1. 开启 iCloud 同步后，点击 **"在 Finder 中打开 SmartMemo 文件夹"**
2. 右键文件夹 → **共享** → **协作邀请**
3. 输入对方的 Apple 账号邮箱 — 对方接受邀请后，数据实时共享

---

## 技术栈

- **[Electron](https://www.electronjs.org/)** v28 — macOS 桌面应用框架
- **Vanilla JS** — 纯 JavaScript，无需构建工具
- **JSON 文件存储** — 本地存储，无需外部数据库
- **Node.js 内置模块** — `https`、`zlib`、`fs`（无外部运行时依赖）

---

## 开源协议

MIT © 2026 angleCompany
