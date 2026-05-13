# 📌 Smart Memo

macOS용 스마트 북마크 & 메모 앱 — URL을 저장하면 제목·설명·썸네일을 자동으로 가져오고, 카테고리를 자동 분류합니다.

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 스크린샷

> URL을 붙여넣으면 메타데이터를 자동 수집하고, 사이드바에서 카테고리별로 필터링할 수 있습니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🔗 **URL 자동 메타데이터** | URL 붙여넣기 시 제목·설명·썸네일 자동 수집 |
| 🎬 **YouTube 특별 지원** | oEmbed API로 영상 제목·채널·썸네일 정확하게 가져오기 |
| 🏷️ **자동 카테고리 분류** | 도메인 기반으로 비디오·코드·아티클·소셜·국내 등 자동 분류 |
| ✏️ **메모 작성** | 자유 형식 텍스트 메모 (⌘+Enter로 빠른 저장) |
| ☁️ **iCloud Drive 동기화** | 같은 Apple 계정의 모든 Mac에서 자동 동기화 |
| 👥 **계정 간 공유** | iCloud Drive 공유 폴더로 다른 Apple 계정과 데이터 공유 |
| 🔍 **전체 검색** | 제목·URL·내용·도메인 통합 검색 |
| 📤 **내보내기/가져오기** | JSON 백업 및 복원 |

---

## 설치 방법

### 방법 1 — Homebrew (권장)

```bash
# 1. tap 추가
brew tap anglecompany/smartmemo

# 2. 설치
brew install --cask smart-memo
```

> **macOS 보안 경고가 뜨는 경우**
> 앱이 현재 코드 서명 인증서 없이 배포됩니다. 첫 실행 시 아래 중 하나로 해결하세요.
>
> **방법 A** — Finder에서 `Smart Memo.app`을 우클릭 → **열기** → **열기** 클릭
>
> **방법 B** — 터미널에서 실행:
> ```bash
> xattr -cr /Applications/Smart\ Memo.app
> ```

---

### 방법 2 — DMG 직접 설치

1. [Releases 페이지](https://github.com/angleCompany/smart-memo/releases/latest)에서 DMG 다운로드
   - Apple Silicon (M1/M2/M3): `Smart-Memo-1.0.0-arm64.dmg`
   - Intel Mac: `Smart-Memo-1.0.0-x64.dmg`
2. DMG를 열고 `Smart Memo.app`을 `/Applications` 폴더로 드래그
3. 보안 경고 시 위의 방법 A 또는 B 적용

---

### 방법 3 — 소스에서 직접 실행

```bash
# 의존성 설치
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install

# 실행
npm start
```

**요구사항:** Node.js 18+, macOS 12+

---

## 업데이트

```bash
brew upgrade --cask smart-memo
```

---

## 제거

```bash
brew uninstall --cask smart-memo
```

데이터(저장된 메모·북마크)까지 완전 삭제:

```bash
brew uninstall --cask smart-memo --zap
```

---

## iCloud 동기화 설정

1. 앱 실행 후 사이드바 하단 **⚙️** 클릭
2. **"iCloud Drive에 저장"** 토글 활성화
3. 데이터가 `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json` 으로 이동
4. 같은 Apple 계정으로 로그인된 모든 Mac에서 자동 동기화

### 다른 Apple 계정과 공유

1. iCloud 동기화 활성화 후 **"Finder에서 SmartMemo 폴더 열기"** 클릭
2. 폴더 우클릭 → **공유** → **협업 초대**
3. 상대방 Apple 계정 이메일 입력 → 초대 수락 시 실시간 공유

---

## 기술 스택

- **[Electron](https://www.electronjs.org/)** v28 — macOS 데스크탑 앱 프레임워크
- **Vanilla JS** — 빌드 도구 없는 순수 JavaScript
- **JSON 파일 스토리지** — 외부 DB 없이 로컬 저장
- **Node.js 내장 모듈** — `https`, `zlib`, `fs` (외부 런타임 의존성 없음)

---

## 라이선스

MIT © 2026 angleCompany
