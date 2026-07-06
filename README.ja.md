# Smart Memo

macOS 向けのリンク収集アプリ — URL を放り込むだけ。整理せずに保存して、あとで検索して見つけます。

![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-356%20passing-brightgreen)

**[한국어](README.md) · [English](README.en.md) · [中文](README.zh.md) · 日本語**

---

## コアバリュー

> **Capture-to-saved < 1秒。** アプリを開かなくても、タブを切り替えなくても URL を保存します。

---

## 主な機能一覧

| 機能 | 説明 |
|------|------|
| ⌘⇧M グローバルショートカット | どのアプリからでも即座に URL 入力欄を呼び出し |
| URL スキーム | `smartmemo://capture?url=...` アプリを起動せずに保存 |
| CLI | `sm <url>` ターミナルから保存 |
| Capture-Receipt トースト | 保存後、アプリを切り替えずに右下へ 1.8 秒の通知 |
| URL メタデータ自動取得 | タイトル・説明・サムネイル・カテゴリを自動解析 |
| YouTube 専用対応 | oEmbed で動画タイトル・チャンネル・サムネイルを正確に取得 |
| タグシステム | 自由なタグ追加、サイドバーでタグフィルター |
| 自動カテゴリ分類 | Video · Code · Article · Social などドメインベースの分類 |
| メモ | インライン Markdown エディタで URL なしのメモを作成 |
| タスク | すばやく書いてチェックボックスで完了、完了項目は下部に保管 |
| 全文検索 | タイトル・URL・ドメイン・メモ・タスクを横断検索 |
| ゴミ箱 | ソフト削除（30日間保管）、復元 · 完全削除 |
| iCloud 同期 | 同じ Apple アカウントの全 Mac で自動同期 |
| エクスポート／インポート | JSON バックアップと移行 |

---

## 📥 インストールとダウンロード

### 1. 配布版のダウンロード（推奨）

GitHub リポジトリの最新 Releases ページから、お使いの Mac の仕様に合ったインストーラー（`.dmg`）をダウンロードします。
* 🔗 **[最新バージョンをダウンロード](https://github.com/angleCompany/smart-memo/releases/latest)**
  * **Apple Silicon（M1/M2/M3/M4 など）**: `Smart-Memo-X.Y.Z-arm64.dmg`
  * **Intel Mac**: `Smart-Memo-X.Y.Z-x64.dmg`

### 2. インストール手順

1. ダウンロードした `.dmg` ファイルをダブルクリックしてマウントします。
2. 開いたウィンドウで **Smart Memo** アプリのアイコンを **アプリケーション** フォルダへドラッグ＆ドロップします。
3. これで Launchpad またはアプリケーションフォルダからアプリを探して起動できます。

> [!IMPORTANT]
> **⚠️「開発元が未確認」の警告が表示される場合の解決方法**
>
> 本アプリはオープンソースアプリで、Apple 開発者の有料署名が適用されていないため、初回起動時に警告が表示されることがあります。以下のいずれかの方法で実行を許可してください。
>
> * **方法 A（推奨）: Finder で実行を許可**
>   1. Finder の **アプリケーション** フォルダで `Smart Memo` アプリを探します。
>   2. `Control` キーを押しながらアプリのアイコンをクリック（右クリック）し、**[開く]** を選択します。
>   3. 警告ダイアログでもう一度 **[開く]** を押すと、以降は通常どおりダブルクリックで起動できます。
>
> * **方法 B（ターミナル使用）: 隔離を解除**
>   ターミナルを開き、以下のコマンドを入力して macOS の隔離属性（quarantine）を削除します。
>   ```bash
>   xattr -cr "/Applications/Smart Memo.app"
>   ```

### ソースから直接実行

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

動作環境: Node.js 18+、macOS 12+

---

## 💡 使い方

### 🚀 1. 超高速 URL 保存（グローバルショートカット `⌘ + ⇧ + M`）

Smart Memo のコア機能です。他のアプリを使用中でも、ショートカット一つで 1 秒で URL を収集します。

1. **ショートカット実行**: キーボードで **`Command(⌘) + Shift(⇧) + M`** を押します。
2. **入力フォーム起動**: 画面上部にシンプルな URL 入力欄が表示されます。
   * *ヒント*: クリップボードにすでに URL をコピーしていれば、**自動的に入力欄へ入力されます。**
3. **保存完了**: **`Enter`** キーを押すと保存が完了し、ウィンドウが閉じます。
   * 保存に成功すると、画面右下にメタデータが解析されたトースト通知（Capture-Receipt）が表示されます。
   * すでに保存済みの重複 URL の場合は警告通知を表示します。
   * キャンセルして閉じるには **`Esc`** キーを押します。

---

### 2. URL スキーム（`smartmemo://`）

アプリを開いたり切り替えたりせずに、外部から Smart Memo へ URL を保存します。
他のアプリ・スクリプト・自動化ツールから呼び出せます。

**サポートするコマンド**

| URL | 動作 |
|-----|------|
| `smartmemo://capture?url=<エンコードされた URL>` | URL を保存後、Capture-Receipt トーストを表示 |
| `smartmemo://open` | Smart Memo のメインウィンドウを開く |

**ターミナルで直接使用**

```bash
open "smartmemo://capture?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo"
open "smartmemo://open"
```

**macOS ショートカット（Shortcuts.app）連携**

Safari、ニュースアプリなど、どこからでも共有シートで 1 タップ保存:

1. ショートカットアプリ → 新規ショートカットを作成
2. 「URL を取得」アクションを追加
3. 「URL を開く」アクションを追加 → URL 欄に `smartmemo://capture?url=` を入力し、URL 変数を続けて連結
4. ショートカットを共有シートに追加 → Safari の共有ボタンからそのまま保存可能

---

### 3. CLI（`sm`）

ターミナル · スクリプト · Alfred · パイプラインから URL を保存します。

**セットアップ（1 回）**

```bash
# プロジェクトルートまたはインストールパスで実行
ln -sf "$(pwd)/bin/sm" /usr/local/bin/sm
```

**使い方**

```bash
sm <url>    # URL を保存
sm open     # Smart Memo を開く
```

**活用例**

```bash
# クリップボードの URL を即座に保存
pbpaste | xargs sm

# ファイルから複数の URL を一括保存
while read url; do sm "$url"; done < urls.txt

# curl で最終リダイレクト URL を保存
sm "$(curl -Ls -o /dev/null -w '%{url_effective}' https://bit.ly/xyz)"
```

---

### 4. メモ & タスク

**メモ** — URL ではない自由なメモを保存します。

- ツールバーの **✏️ 新規メモ** をクリック → インライン Markdown エディタ（`#` 見出し · `-` リスト · `>` 引用、Enter で変換）
- **⌘ + Enter** で保存、タグも指定可能

**タスク** — その場でタスクを書いて完了をチェックします。

1. ツールバーの **✅ 新規タスク** をクリック → モーダルで**複数行**入力し **⌘+Enter**（または保存）で追加
2. リストの **チェックボックス** をクリック → 完了を切り替え（完了項目は取り消し線付きで下部へ移動し、消えません）
3. カードをクリック → 詳細で全文を確認、**編集** ボタンで内容・タグを修正
4. サイドバーの **タスク** バッジは **未完了の件数** を表示
5. タスクも検索・タグ・ゴミ箱・iCloud 同期・エクスポートにそのまま含まれます

---

### 5. タグ

- 右側の詳細パネルでタグを入力後 **Enter** → 追加
- サイドバー下部のタグ一覧をクリック → そのタグでフィルタリング
- タグ横の `×` をクリック → 削除

---

### 6. 検索

上部の検索欄に入力すると、タイトル・URL・ドメイン・メモ・タスク内容をリアルタイムで横断検索します。

---

### 7. ゴミ箱

- 項目を削除 → 30 日間ゴミ箱に保管
- サイドバー「ゴミ箱」 → 一覧を確認、個別に復元または完全削除
- 「ゴミ箱を空にする」 → 全体を永久削除

---

### 8. iCloud Drive 同期

1. アプリのサイドバー下部の **⚙️** をクリック
2. **「iCloud Drive に保存」** トグルを有効化
3. データの場所: `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. 同じ Apple アカウントでログインした全 Mac で自動同期

**別の Apple アカウントとの共有**

1. iCloud 同期を有効にした後、「Finder で SmartMemo フォルダを開く」をクリック
2. フォルダを右クリック → 共有 → コラボレーションに招待
3. 相手の Apple ID を入力 → 承認するとリアルタイム共有

---

### 9. エクスポート／インポート

- **エクスポート**: 設定 → データをエクスポート → JSON ファイルを保存（バックアップ・移行）
- **インポート**: 設定 → データをインポート → ファイルを選択
  - **マージモード**: 既存データを維持し、新規項目のみ追加（重複はスキップ）
  - **置換モード**: 既存データをインポートしたファイルで完全に置き換え

---

## 🛠️ 開発とデプロイ

### ローカル開発とテスト

```bash
npm install          # 依存関係のインストール
npm start            # アプリをローカル実行（開発版）
npm test             # 全テスト実行（356 個のユニット/統合テスト）
npm run test:watch   # Vitest watch モードで実行
```

### パッケージングとビルド

```bash
npm run build:arm64  # Apple Silicon（M シリーズ）macOS DMG ビルド
npm run build:x64    # Intel macOS DMG ビルド
npm run build        # 両アーキテクチャ用 DMG ビルド
```

### 🤖 自動デプロイ（CI/CD）

このリポジトリは GitHub Actions による自動デプロイが有効になっています。
1. `package.json` の `"version"` 値を修正してコードをプッシュします。
2. ターミナルで以下のように新しいバージョンタグを付けてリモートリポジトリへプッシュします。
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions が自動的に macOS インスタンスでアプリをビルドし、最新のリリースページにビルドファイル（`.dmg`）をアップロードします。

### プロジェクト構造

```
smart-memo/
├── main.js              # Electron メインプロセス（composition root）
├── renderer.js          # UI エントリポイント（ES Module）
├── preload.js           # メインウィンドウの IPC ブリッジ
├── capturePreload.js    # キャプチャウィンドウの IPC ブリッジ
├── index.html           # メインウィンドウ
├── capture.html         # キャプチャウィンドウ（⌘⇧M）
├── receipt.html         # Capture-Receipt トーストウィンドウ
├── src/
│   ├── domain/          # 純粋なビジネスロジック（外部依存なし）
│   │   ├── url.js           # URL 正規化 · 検証 · SSRF 防御
│   │   ├── tags.js          # タグ CRUD
│   │   ├── itemFilter.js    # フィルタリング · ソート
│   │   ├── itemSanitizer.js # インポートデータ検証 · XSS 防御
│   │   ├── htmlMeta.js      # og:*/meta 解析
│   │   ├── idGenerator.js   # 一意 ID 生成
│   │   └── trashPolicy.js   # ゴミ箱ポリシー
│   ├── application/     # ユースケース
│   │   ├── captureService.js      # URL 保存 + バックグラウンドメタデータ取得
│   │   ├── itemService.js         # CRUD + タスク + ゴミ箱 + 検索
│   │   ├── importExportService.js # エクスポート／インポート
│   │   └── syncService.js         # iCloud 同期
│   ├── infrastructure/  # 外部依存（ファイル · ネットワーク · iCloud）
│   │   ├── fileStorage.js     # 原子的ファイル書き込み（tmp → rename）
│   │   ├── configStore.js     # 設定ファイル保存
│   │   ├── fileWatcher.js     # ファイル変更検知（デバウンス）
│   │   ├── httpFetcher.js     # HTTP リクエスト（redirect · gzip 自動処理）
│   │   ├── metadataFetcher.js # メタデータ取得（YouTube oEmbed 含む）
│   │   └── icloudDetector.js  # iCloud Drive パス検出
│   └── ui/              # ブラウザレンダラー（ES Module）
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
│   └── sm               # CLI スクリプト
└── tests/               # テスト（18 ファイル、356 個）
    ├── unit/
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    └── fakes/
        └── inMemoryStorage.js
```

### アーキテクチャ

Clean Architecture（Hexagonal） — Domain → Application → Infrastructure の単方向依存。

- **Domain**: 純粋な JS、fs/Electron 依存なし → 単独ユニットテスト
- **Application**: InMemoryStorage fake で高速テスト、実際のファイル I/O なし
- **Infrastructure**: 実際の tmpdir · ローカル HTTP サーバーで統合テスト
- **CJS/ESM 分離**: main.js + src/ は CommonJS、renderer.js + src/ui/ は ESM（`sandbox: true` 環境）

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| デスクトップフレームワーク | Electron 28 |
| メインプロセス | Node.js（CommonJS） |
| レンダラー | Vanilla JS（ES Module） |
| ストレージ | JSON ファイル（原子的書き込み） |
| テスト | Vitest |

---

## ライセンス

MIT © 2026 angleCompany
