# 📌 Smart Memo

A smart bookmark & memo app for macOS — paste a URL and it automatically fetches the title, description, and thumbnail, then categorizes it for you.

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**[한국어](README.md) · English · [中文](README.zh.md) · [日本語](README.ja.md)**

---

## Features

| Feature | Description |
|---------|-------------|
| 🔗 **Auto URL Metadata** | Paste a URL to automatically fetch title, description, and thumbnail |
| 🎬 **YouTube Support** | Uses oEmbed API to accurately fetch video title, channel, and thumbnail |
| 🏷️ **Auto Categorization** | Automatically classifies by domain: Video, Code, Article, Social, Korean, etc. |
| ✏️ **Quick Memos** | Free-form text notes (⌘+Enter to save quickly) |
| ☁️ **iCloud Drive Sync** | Auto-syncs across all Macs signed in with the same Apple ID |
| 👥 **Cross-Account Sharing** | Share data with other Apple accounts via iCloud Drive shared folders |
| 🔍 **Full-Text Search** | Search across title, URL, content, and domain |
| 📤 **Export / Import** | JSON backup and restore |

---

## Installation

### Option 1 — Direct DMG Install (Recommended)

1. Download the DMG from the [Releases page](https://github.com/angleCompany/smart-memo/releases/latest)
   - Apple Silicon (M1/M2/M3/M4 etc.): `Smart-Memo-X.Y.Z-arm64.dmg`
   - Intel Mac: `Smart-Memo-X.Y.Z-x64.dmg`
2. Open the DMG and drag `Smart Memo.app` to `/Applications`

> **If macOS shows a security warning ("Unidentified Developer")**
> The app is distributed without an Apple Developer certificate. Resolve with one of the following:
>
> **Option A** — Right-click `Smart Memo.app` in Finder → **Open** → Click **Open**
>
> **Option B** — Run in Terminal:
> ```bash
> xattr -cr "/Applications/Smart Memo.app"
> ```

---

### Option 2 — Run from Source

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

**Requirements:** Node.js 18+, macOS 12+

---

## Update

To update the app, download the latest `.dmg` from the [Releases page](https://github.com/angleCompany/smart-memo/releases/latest) and replace the existing app in the `/Applications` folder.

---

## Uninstall

```bash
brew uninstall --cask smart-memo
```

To also remove all saved data:

```bash
brew uninstall --cask smart-memo --zap
```

---

## iCloud Sync Setup

1. Launch the app and click **⚙️** at the bottom of the sidebar
2. Enable **"Save to iCloud Drive"**
3. Data moves to `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. Automatically syncs across all Macs signed in with the same Apple ID

### Sharing with Other Apple Accounts

1. Enable iCloud Sync, then click **"Open SmartMemo Folder in Finder"**
2. Right-click the folder → **Share** → **Collaborate**
3. Enter the other person's Apple account email — once they accept, data syncs in real time

---

## Tech Stack

- **[Electron](https://www.electronjs.org/)** v28 — macOS desktop app framework
- **Vanilla JS** — Pure JavaScript, no build tools required
- **JSON file storage** — Local storage with no external database
- **Node.js built-ins** — `https`, `zlib`, `fs` (no external runtime dependencies)

---

## License

MIT © 2026 angleCompany
