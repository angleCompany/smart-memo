# Smart Memo

A link-collecting app for macOS — just throw a URL at it. Save without organizing, find it later by search.

![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-356%20passing-brightgreen)

**[한국어](README.md) · English · [中文](README.zh.md) · [日本語](README.ja.md)**

---

## Core Value

> **Capture-to-saved < 1 second.** Save a URL without opening the app or switching tabs.

---

## Feature Overview

| Feature | Description |
|---------|-------------|
| ⌘⇧M Global Shortcut | Instantly summon the URL input from any app |
| URL Scheme | `smartmemo://capture?url=...` — save without launching the app |
| CLI | `sm <url>` — save from the terminal |
| Capture-Receipt Toast | A 1.8s notification in the bottom-right after saving, no app switch |
| Automatic URL Metadata | Auto-parses title, description, thumbnail, and category |
| Dedicated YouTube Support | Accurately fetches video title, channel, and thumbnail via oEmbed |
| Tag System | Add free-form tags, filter by tags in the sidebar |
| Automatic Categorization | Domain-based classification: Video · Code · Article · Social, etc. |
| Memo | Write memos without a URL using the inline Markdown editor |
| To-Do | Jot down tasks fast, check them off; completed items move to the bottom |
| Full-Text Search | Unified search across title, URL, domain, memo, and to-do |
| Trash | Soft delete (kept 30 days), restore · permanent delete |
| iCloud Sync | Auto-syncs across all Macs on the same Apple account |
| Export / Import | JSON backup and migration |

---

## 📥 Installation & Download

### 1. Download the Release (Recommended)

Download the installer (`.dmg`) that matches your Mac from the latest Releases page of the GitHub repository.
* 🔗 **[Download the latest version](https://github.com/angleCompany/smart-memo/releases/latest)**
  * **Apple Silicon (M1/M2/M3/M4, etc.)**: `Smart-Memo-X.Y.Z-arm64.dmg`
  * **Intel Mac**: `Smart-Memo-X.Y.Z-x64.dmg`

### 2. Installation Steps

1. Double-click the downloaded `.dmg` file to mount it.
2. In the window that opens, drag and drop the **Smart Memo** app icon into the **Applications** folder.
3. You can now find and launch the app from Launchpad or the Applications folder.

> [!IMPORTANT]
> **⚠️ How to resolve the "Unidentified Developer" warning**
>
> This is an open-source app that is not signed with a paid Apple Developer certificate, so a warning may appear on first launch. Allow it to run with one of the methods below.
>
> * **Option A (Recommended): Allow from Finder**
>   1. In Finder's **Applications** folder, locate the `Smart Memo` app.
>   2. Hold the `Control` key and click the app icon (right-click), then choose **[Open]**.
>   3. Click **[Open]** once more in the warning dialog — afterward you can launch it normally by double-clicking.
>
> * **Option B (Terminal): Remove quarantine**
>   Open Terminal and enter the command below to remove macOS's quarantine attribute.
>   ```bash
>   xattr -cr "/Applications/Smart Memo.app"
>   ```

### Run from Source

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

Requirements: Node.js 18+, macOS 12+

---

## 💡 How to Use

### 🚀 1. Ultra-Fast URL Save (Global Shortcut `⌘ + ⇧ + M`)

This is Smart Memo's core feature. Even while using another app, a single shortcut captures a URL in one second.

1. **Trigger the shortcut**: Press **`Command(⌘) + Shift(⇧) + M`** on your keyboard.
2. **Activate the input form**: A simple URL input box appears at the top of the screen.
   * *Tip*: If you already have a URL copied to the clipboard, it is **filled in automatically.**
3. **Save complete**: Press **`Enter`** to finish saving and close the window.
   * On success, a toast notification with parsed metadata (Capture-Receipt) appears in the bottom-right of the screen.
   * For a URL that is already saved (duplicate), it shows a warning notification.
   * To cancel and close, press **`Esc`**.

---

### 2. URL Scheme (`smartmemo://`)

Save a URL to Smart Memo from the outside without opening or switching to the app.
It can be invoked from other apps, scripts, or automation tools.

**Supported commands**

| URL | Action |
|-----|--------|
| `smartmemo://capture?url=<encoded URL>` | Save the URL, then show the Capture-Receipt toast |
| `smartmemo://open` | Open the Smart Memo main window |

**Direct use in the terminal**

```bash
open "smartmemo://capture?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo"
open "smartmemo://open"
```

**macOS Shortcuts.app integration**

One-tap saving from the share sheet anywhere — Safari, News, etc.:

1. Shortcuts app → Create a new shortcut
2. Add the "Get URLs" action
3. Add the "Open URLs" action → in the URL field, enter `smartmemo://capture?url=` and append the URL variable
4. Add the shortcut to the share sheet → save directly from Safari's Share button

---

### 3. CLI (`sm`)

Save URLs from the terminal, scripts, Alfred, or pipelines.

**Setup (once)**

```bash
# Run from the project root or install path
ln -sf "$(pwd)/bin/sm" /usr/local/bin/sm
```

**Usage**

```bash
sm <url>    # Save a URL
sm open     # Open Smart Memo
```

**Examples**

```bash
# Instantly save the clipboard URL
pbpaste | xargs sm

# Bulk-save multiple URLs from a file
while read url; do sm "$url"; done < urls.txt

# Save the final redirect URL with curl
sm "$(curl -Ls -o /dev/null -w '%{url_effective}' https://bit.ly/xyz)"
```

---

### 4. Memo & To-Do

**Memo** — save free-form notes instead of a URL.

- Click **✏️ New Memo** in the toolbar → inline Markdown editor (`#` heading · `-` list · `>` quote, converted on Enter)
- Save with **⌘ + Enter**; tags can be added too

**To-Do** — jot down tasks on the fly and check them off.

1. Click **✅ New To-Do** in the toolbar → enter **multiple lines** in the modal and save with **⌘+Enter**
2. Click the **checkbox** in the list → toggle done (completed items move to the bottom with a strikethrough — they don't disappear)
3. Click a card → view the full text in detail; use the **Edit** button to change the content and tags
4. The **To-Do** badge in the sidebar shows the **number of open tasks**
5. To-dos are also included in search, tags, trash, iCloud sync, and export

---

### 5. Tags

- Enter a tag in the detail panel on the right, then press **Enter** → add
- Click a tag in the sidebar's tag list → filter by that tag
- Click the `×` next to a tag → remove

---

### 6. Search

Type in the search box at the top to search across title, URL, domain, memo, and to-do content in real time.

---

### 7. Trash

- Delete an item → kept in Trash for 30 days
- Sidebar "Trash" → review the list, restore individually or delete permanently
- "Empty Trash" → permanently delete everything

---

### 8. iCloud Drive Sync

1. Click **⚙️** at the bottom of the app sidebar
2. Enable the **"Save to iCloud Drive"** toggle
3. Data location: `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. Auto-syncs across all Macs signed in with the same Apple account

**Sharing with other Apple accounts**

1. After enabling iCloud sync, click "Open SmartMemo Folder in Finder"
2. Right-click the folder → Share → Collaborate
3. Enter the other person's Apple ID → real-time sharing once accepted

---

### 9. Export / Import

- **Export**: Settings → Export Data → save a JSON file (backup/migration)
- **Import**: Settings → Import Data → select a file
  - **Merge mode**: keep existing data, add only new items (skip duplicates)
  - **Replace mode**: completely replace existing data with the imported file

---

## 🛠️ Development & Deployment

### Local Development & Testing

```bash
npm install          # Install dependencies
npm start            # Run the app locally (dev build)
npm test             # Run the full test suite (356 unit/integration tests)
npm run test:watch   # Run Vitest in watch mode
```

### Packaging & Build

```bash
npm run build:arm64  # Build the Apple Silicon (M-series) macOS DMG
npm run build:x64    # Build the Intel macOS DMG
npm run build        # Build DMGs for both architectures
```

### 🤖 Automated Deployment (CI/CD)

This repository has automated deployment enabled via GitHub Actions.
1. Update the `"version"` value in `package.json` and push the code.
2. Push a new version tag to the remote repository as shown below.
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions automatically builds the app on a macOS instance and uploads the build artifact (`.dmg`) to the latest release page.

### Project Structure

```
smart-memo/
├── main.js              # Electron main process (composition root)
├── renderer.js          # UI entry point (ES Module)
├── preload.js           # Main-window IPC bridge
├── capturePreload.js    # Capture-window IPC bridge
├── index.html           # Main window
├── capture.html         # Capture window (⌘⇧M)
├── receipt.html         # Capture-Receipt toast window
├── src/
│   ├── domain/          # Pure business logic (no external dependencies)
│   │   ├── url.js           # URL normalization · validation · SSRF defense
│   │   ├── tags.js          # Tag CRUD
│   │   ├── itemFilter.js    # Filtering · sorting
│   │   ├── itemSanitizer.js # Import data validation · XSS defense
│   │   ├── htmlMeta.js      # og:*/meta parsing
│   │   ├── idGenerator.js   # Unique ID generation
│   │   └── trashPolicy.js   # Trash policy
│   ├── application/     # Use cases
│   │   ├── captureService.js      # URL save + background metadata fetch
│   │   ├── itemService.js         # CRUD + to-do + trash + search
│   │   ├── importExportService.js # Export/import
│   │   └── syncService.js         # iCloud sync
│   ├── infrastructure/  # External dependencies (file · network · iCloud)
│   │   ├── fileStorage.js     # Atomic file write (tmp → rename)
│   │   ├── configStore.js     # Config file storage
│   │   ├── fileWatcher.js     # File-change detection (debounced)
│   │   ├── httpFetcher.js     # HTTP requests (auto redirect · gzip handling)
│   │   ├── metadataFetcher.js # Metadata fetch (incl. YouTube oEmbed)
│   │   └── icloudDetector.js  # iCloud Drive path detection
│   └── ui/              # Browser renderer (ES Module)
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
│   └── sm               # CLI script
└── tests/               # Tests (18 files, 356 tests)
    ├── unit/
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    └── fakes/
        └── inMemoryStorage.js
```

### Architecture

Clean Architecture (Hexagonal) — Domain → Application → Infrastructure one-way dependency.

- **Domain**: Pure JS, no fs/Electron dependency → standalone unit tests
- **Application**: Fast tests with an InMemoryStorage fake, no real file I/O
- **Infrastructure**: Integration tests with a real tmpdir · local HTTP server
- **CJS/ESM split**: main.js + src/ are CommonJS; renderer.js + src/ui/ are ESM (`sandbox: true` environment)

---

## Tech Stack

| Area | Technology |
|------|------------|
| Desktop framework | Electron 28 |
| Main process | Node.js (CommonJS) |
| Renderer | Vanilla JS (ES Module) |
| Storage | JSON file (atomic write) |
| Testing | Vitest |

---

## License

MIT © 2026 angleCompany
