# 📌 Smart Memo

macOS 向けのスマートブックマーク＆メモアプリ — URL を貼り付けるだけでタイトル・説明・サムネイルを自動取得し、カテゴリも自動分類します。

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**[한국어](README.md) · [English](README.en.md) · [中文](README.zh.md) · 日本語**

---

## 主な機能

| 機能 | 説明 |
|------|------|
| 🔗 **URL メタデータ自動取得** | URL を貼り付けるだけでタイトル・説明・サムネイルを自動取得 |
| 🎬 **YouTube 専用対応** | oEmbed API で動画タイトル・チャンネル名・サムネイルを正確に取得 |
| 🏷️ **自動カテゴリ分類** | ドメインを元に動画・コード・記事・SNS などへ自動分類 |
| ✏️ **クイックメモ** | 自由形式のテキストメモ（⌘+Enter で素早く保存） |
| ☁️ **iCloud Drive 同期** | 同じ Apple ID でログインした全 Mac で自動同期 |
| 👥 **アカウント間共有** | iCloud Drive の共有フォルダで別の Apple アカウントとデータ共有 |
| 🔍 **全文検索** | タイトル・URL・内容・ドメインを横断検索 |
| 📤 **エクスポート／インポート** | JSON 形式でバックアップ＆復元 |

---

## インストール方法

### 方法 1 — Homebrew（推奨）

```bash
# 1. tap を追加
brew tap anglecompany/smartmemo

# 2. インストール
brew install --cask smart-memo
```

> **macOS のセキュリティ警告が表示された場合**
> 本アプリは現在コード署名なしで配布されています。初回起動時は以下のいずれかで対応してください。
>
> **方法 A** — Finder で `Smart Memo.app` を右クリック → **開く** → **開く** をクリック
>
> **方法 B** — ターミナルで実行：
> ```bash
> xattr -cr /Applications/Smart\ Memo.app
> ```

---

### 方法 2 — DMG から直接インストール

1. [Releases ページ](https://github.com/angleCompany/smart-memo/releases/latest) から DMG をダウンロード
   - Apple Silicon（M1/M2/M3/M4）：`Smart-Memo-1.0.0-arm64.dmg`
   - Intel Mac：`Smart-Memo-1.0.0-x64.dmg`
2. DMG を開き、`Smart Memo.app` を `/Applications` フォルダへドラッグ
3. セキュリティ警告が出た場合は上記の方法 A または B を実施

---

### 方法 3 — ソースから実行

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

**動作環境：** Node.js 18+、macOS 12+

---

## アップデート

```bash
brew upgrade --cask smart-memo
```

---

## アンインストール

```bash
brew uninstall --cask smart-memo
```

保存済みデータも含めて完全削除する場合：

```bash
brew uninstall --cask smart-memo --zap
```

---

## iCloud 同期の設定

1. アプリを起動し、サイドバー下部の **⚙️** をクリック
2. **「iCloud Drive に保存」** トグルを有効化
3. データが `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json` へ移行
4. 同じ Apple ID でログインしている全 Mac で自動同期

### 別の Apple アカウントとの共有

1. iCloud 同期を有効にした後、**「Finder で SmartMemo フォルダを開く」** をクリック
2. フォルダを右クリック → **共有** → **コラボレーションに招待**
3. 相手の Apple アカウントのメールアドレスを入力 → 承認後にリアルタイム共有開始

---

## 技術スタック

- **[Electron](https://www.electronjs.org/)** v28 — macOS デスクトップアプリフレームワーク
- **Vanilla JS** — ビルドツール不要の純粋な JavaScript
- **JSON ファイルストレージ** — 外部 DB 不要のローカル保存
- **Node.js 組み込みモジュール** — `https`、`zlib`、`fs`（外部ランタイム依存なし）

---

## ライセンス

MIT © 2026 angleCompany
