#!/bin/bash
# GitHub 로그인 후 이 스크립트를 실행하면 공개 배포 완료
# 실행: bash deploy-to-github.sh

set -e

echo "🔍 GitHub 로그인 확인..."
gh auth status || { echo "❌ 먼저 'gh auth login'을 실행해주세요"; exit 1; }

GITHUB_USER=$(gh api user --jq .login)
echo "✅ GitHub 사용자: $GITHUB_USER"

# ── 1. smart-memo 레포 생성 & 코드 푸시 ──────────────────────────
echo ""
echo "📦 smart-memo 레포 생성 중..."
cd /Users/sjuyi/Documents/Workspace/goaltest

git init -b main 2>/dev/null || true
git add -A
git commit -m "feat: Smart Memo v1.0.0 - macOS bookmark & memo app" 2>/dev/null || true

gh repo create smart-memo --public --source=. --remote=origin --push \
  --description "Smart bookmark and memo app for macOS" 2>/dev/null || \
  (git remote set-url origin "https://github.com/$GITHUB_USER/smart-memo.git" && git push -u origin main)

echo "✅ 레포 생성 완료: https://github.com/$GITHUB_USER/smart-memo"

# ── 2. GitHub Release + DMG 업로드 ──────────────────────────────
echo ""
echo "🚀 GitHub Release 생성 및 DMG 업로드 중..."
gh release create v1.0.0 \
  dist/Smart-Memo-1.0.0-arm64.dmg \
  dist/Smart-Memo-1.0.0-x64.dmg \
  --title "Smart Memo v1.0.0" \
  --notes "## Smart Memo v1.0.0

### 설치 방법
\`\`\`bash
brew tap $GITHUB_USER/smartmemo
brew install --cask smart-memo
\`\`\`

### 기능
- URL 붙여넣기 → 제목/설명/썸네일 자동 수집
- YouTube oEmbed 지원
- 자동 카테고리 분류 (비디오/코드/아티클/소셜 등)
- 메모 작성
- iCloud Drive 동기화 지원
- 검색/필터" 2>/dev/null || echo "⚠️ Release 이미 존재함"

echo "✅ Release 완료: https://github.com/$GITHUB_USER/smart-memo/releases/tag/v1.0.0"

# ── 3. Homebrew tap 레포 생성 ────────────────────────────────────
echo ""
echo "🍺 homebrew-smartmemo tap 레포 생성 중..."
mkdir -p /tmp/tap-setup/Casks
cat > /tmp/tap-setup/Casks/smart-memo.rb << FORMULA
cask "smart-memo" do
  version "1.0.0"

  on_arm do
    sha256 "0d16691d851b2c6d91979a0aba4d3ce85fbb97f5beb796ecb159b20911efb191"
    url "https://github.com/$GITHUB_USER/smart-memo/releases/download/v\#{version}/Smart-Memo-\#{version}-arm64.dmg"
  end

  on_intel do
    sha256 "2298522895c894b2dad4d65ffcd91529c3619fbeaa6351aa546fe965d892f25e"
    url "https://github.com/$GITHUB_USER/smart-memo/releases/download/v\#{version}/Smart-Memo-\#{version}-x64.dmg"
  end

  name "Smart Memo"
  desc "Smart bookmark and memo app — save URLs with auto metadata, categorize, and write notes"
  homepage "https://github.com/$GITHUB_USER/smart-memo"

  app "Smart Memo.app"

  postflight do
    system_command "/usr/bin/xattr",
                   args: ["-cr", "\#{appdir}/Smart Memo.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/Smart Memo",
    "~/Library/Application Support/smart-memo",
    "~/Library/Preferences/com.sjuyi.smartmemo.plist",
  ]
end
FORMULA

cd /tmp/tap-setup
git init -b main
git add .
git commit -m "Add smart-memo 1.0.0 cask"

gh repo create homebrew-smartmemo --public --source=. --remote=origin --push \
  --description "Homebrew tap for Smart Memo" 2>/dev/null || \
  (git remote set-url origin "https://github.com/$GITHUB_USER/homebrew-smartmemo.git" && git push -u origin main)

echo "✅ Tap 레포 완료: https://github.com/$GITHUB_USER/homebrew-smartmemo"

# ── 4. 로컬 tap을 GitHub으로 전환 ───────────────────────────────
echo ""
echo "🔄 로컬 tap을 GitHub tap으로 전환 중..."
brew untap $GITHUB_USER/smartmemo 2>/dev/null || true
brew tap $GITHUB_USER/smartmemo
brew info --cask $GITHUB_USER/smartmemo/smart-memo

echo ""
echo "════════════════════════════════════════"
echo "🎉 배포 완료!"
echo ""
echo "누구든 아래 명령으로 설치 가능:"
echo ""
echo "  brew tap $GITHUB_USER/smartmemo"
echo "  brew install --cask smart-memo"
echo ""
echo "업그레이드:"
echo "  brew upgrade --cask smart-memo"
echo "════════════════════════════════════════"
