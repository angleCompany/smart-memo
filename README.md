# Smart Memo

macOS용 링크 수집 앱 — URL을 던지면 끝. 정리 없이도 나중에 찾을 수 있습니다.

![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.4.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-390%20passing-brightgreen)

**한국어 · [English](README.en.md) · [中文](README.zh.md) · [日本語](README.ja.md)**

---

## 핵심 가치

> **Capture-to-saved < 1초.** 앱을 열지 않아도, 탭을 전환하지 않아도 URL을 저장합니다.

---

## 주요 기능 한눈에 보기

| 기능 | 설명 |
|------|------|
| ⌘⇧M 글로벌 단축키 | 어느 앱에서든 즉시 URL 입력 창 호출 |
| URL Scheme | `smartmemo://capture?url=...` 앱 실행 없이 저장 |
| CLI | `sm <url>` 터미널에서 저장 |
| Capture-Receipt 토스트 | 저장 후 앱 전환 없이 우하단에 1.8초 알림 |
| URL 메타데이터 자동 수집 | 제목·설명·썸네일·카테고리 자동 파싱 |
| YouTube 특별 지원 | oEmbed로 영상 제목·채널·썸네일 정확 수집 |
| 태그 시스템 | 자유 태그 추가, 사이드바 태그 필터 |
| 자동 카테고리 분류 | Video · Code · Article · Social 등 도메인 기반 분류 |
| 메모 | 마크다운 인라인 에디터로 URL 없이 메모 작성 |
| 할 일 | 빠르게 적고 체크박스로 완료 체크, 완료 항목 하단 보관 |
| 전체 검색 | 제목·URL·도메인·메모·할 일 통합 검색 |
| 휴지통 | 소프트 삭제(30일 보관), 복원 · 완전 삭제 |
| iCloud 동기화 | 같은 Apple 계정 모든 Mac 자동 동기화 |
| 내보내기/가져오기 | JSON 백업 및 마이그레이션 |
| 자동 업데이트 | 실행 시 새 버전 확인, 알림 + 원클릭 다운로드 |

---

## 📥 설치 및 다운로드

### 1. 배포판 다운로드 (권장)

GitHub 저장소의 최신 Releases 페이지에서 본인의 Mac 사양에 맞는 설치 파일(`.dmg`)을 다운로드합니다.
* 🔗 **[최신 버전 다운로드 받기](https://github.com/angleCompany/smart-memo/releases/latest)**
  * **Apple Silicon (M1·M2·M3·M4 등)**: `Smart-Memo-X.Y.Z-arm64.dmg`
  * **Intel Mac**: `Smart-Memo-X.Y.Z-x64.dmg`

### 2. 설치 과정

1. 다운로드한 `.dmg` 파일을 더블 클릭하여 마운트합니다.
2. 열린 창에서 **Smart Memo** 앱 아이콘을 **Applications (응용 프로그램)** 폴더로 드래그 앤 드롭합니다.
3. 이제 Launchpad 또는 응용 프로그램 폴더에서 앱을 찾아 실행할 수 있습니다.

> [!IMPORTANT]
> **⚠️ "확인되지 않은 개발자" 또는 "앱이 손상되어 열 수 없습니다" 경고가 뜨는 경우**
>
> 본 앱은 오픈소스라 Apple 유료 서명·공증(notarization)이 없어, 다른 Mac에서 다운로드해 처음 실행하면 macOS Gatekeeper가 경고를 띄웁니다. **파일이 실제로 손상된 것이 아닙니다.** "손상되어 열 수 없습니다"라고 뜨는 경우(특히 Apple Silicon)에는 아래 **방법 B(터미널)**가 가장 확실합니다 — 이때는 방법 A(우클릭 열기)가 나타나지 않을 수 있습니다.
>
> * **방법 A (권장): Finder에서 실행 허용**
>   1. Finder의 **응용 프로그램** 폴더에서 `Smart Memo` 앱을 찾습니다.
>   2. `Control` 키를 누른 상태에서 앱 아이콘을 클릭(우클릭)하고 **[열기]**를 선택합니다.
>   3. 경고창에서 다시 한번 **[열기]**를 누르면 이후에는 정상적으로 더블 클릭하여 실행할 수 있습니다.
>
> * **방법 B (터미널 사용): 격리 해제**
>   터미널을 열고 아래 명령어를 입력하여 macOS의 격리 속성(quarantine)을 제거합니다.
>   ```bash
>   xattr -cr "/Applications/Smart Memo.app"
>   ```

### 소스에서 직접 실행

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

요구사항: Node.js 18+, macOS 12+

---

## 💡 사용 방법

### 🚀 1. 초고속 URL 저장 (글로벌 단축키 `⌘ + ⇧ + M`)

Smart Memo의 핵심 기능입니다. 다른 앱을 사용 중이더라도 단축키 하나로 1초 만에 URL을 수집합니다.

1. **단축키 실행**: 키보드에서 **`Command(⌘) + Shift(⇧) + M`**을 누릅니다.
2. **입력 폼 활성화**: 화면 상단에 심플한 URL 입력창이 나타납니다.
   * *Tip*: 클립보드에 이미 복사해 둔 URL이 있다면 **자동으로 입력창에 채워집니다.**
3. **저장 완료**: **`Enter`** 키를 누르면 저장이 완료되고 창이 닫힙니다.
   * 저장에 성공하면 화면 우하단에 메타데이터가 파싱된 토스트 알림(Capture-Receipt)이 나타납니다.
   * 이미 저장된 중복 URL인 경우 경고 알림을 보내줍니다.
   * 취소하고 닫으려면 **`Esc`** 키를 누릅니다.

---

### 2. URL Scheme (`smartmemo://`)

앱을 열거나 전환하지 않고 외부에서 Smart Memo에 URL을 저장합니다.
다른 앱·스크립트·자동화 도구에서 호출할 수 있습니다.

**지원 명령**

| URL | 동작 |
|-----|------|
| `smartmemo://capture?url=<인코딩된 URL>` | URL 저장 후 Capture-Receipt 토스트 표시 |
| `smartmemo://open` | Smart Memo 메인 창 열기 |

**터미널에서 직접 사용**

```bash
open "smartmemo://capture?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo"
open "smartmemo://open"
```

**macOS 단축어(Shortcuts.app) 연동**

Safari, 뉴스 앱 등 어디서든 공유 시트로 1탭 저장:

1. 단축어 앱 → 새 단축어 만들기
2. "URL 가져오기" 액션 추가
3. "URL 열기" 액션 추가 → URL 칸에 `smartmemo://capture?url=` 입력 후 URL 변수 이어붙임
4. 단축어를 공유 시트에 추가 → Safari 공유 버튼에서 바로 저장 가능

---

### 3. CLI (`sm`)

터미널 · 스크립트 · Alfred · 파이프라인에서 URL을 저장합니다.

**설치 (1회)**

```bash
# 프로젝트 루트 또는 설치 경로에서 실행
ln -sf "$(pwd)/bin/sm" /usr/local/bin/sm
```

**사용법**

```bash
sm <url>    # URL 저장
sm open     # Smart Memo 열기
```

**활용 예**

```bash
# 클립보드 URL 즉시 저장
pbpaste | xargs sm

# 파일에서 여러 URL 일괄 저장
while read url; do sm "$url"; done < urls.txt

# curl로 최종 리다이렉트 URL 저장
sm "$(curl -Ls -o /dev/null -w '%{url_effective}' https://bit.ly/xyz)"
```

---

### 4. 메모 & 할 일

**메모** — URL이 아닌 자유 메모를 저장합니다.

- 툴바 **✏️ 새 메모** 클릭 → 마크다운 인라인 에디터 (`#` 제목 · `-` 목록 · `>` 인용, Enter로 변환)
- **⌘ + Enter**로 저장, 태그도 함께 지정 가능

**할 일** — 그때그때 할 일을 적고 완료를 체크합니다.

1. 툴바 **✅ 새 할 일** 클릭 → 모달에서 **여러 줄** 입력 후 **⌘+Enter**(또는 저장)로 추가
2. 목록의 **체크박스** 클릭 → 완료 토글 (완료 항목은 취소선과 함께 하단으로 이동, 사라지지 않음)
3. 카드 클릭 → 상세에서 전체 내용 확인, **편집** 버튼으로 내용·태그 수정
4. 사이드바 **할 일** 배지는 **미완료 개수**를 표시
5. 할 일도 검색·태그·휴지통·iCloud 동기화·내보내기에 그대로 포함됩니다

---

### 5. 태그

- 우측 상세 패널에서 태그 입력 후 **Enter** → 추가
- 사이드바 하단 태그 목록 클릭 → 해당 태그 필터링
- 태그 옆 `×` 클릭 → 제거

---

### 6. 검색

상단 검색창에 입력하면 제목·URL·도메인·메모·할 일 내용을 실시간으로 통합 검색합니다.

---

### 7. 휴지통

- 항목 삭제 → 30일간 휴지통 보관
- 사이드바 "휴지통" → 목록 확인, 개별 복원 또는 완전 삭제
- "휴지통 비우기" → 전체 영구 삭제

---

### 8. iCloud Drive 동기화

1. 앱 사이드바 하단 **⚙️** 클릭
2. **"iCloud Drive에 저장"** 토글 활성화
3. 데이터 위치: `~/Library/Mobile Documents/com~apple~CloudDocs/SmartMemo/data.json`
4. 같은 Apple 계정으로 로그인된 모든 Mac에서 자동 동기화

**다른 Apple 계정과 공유**

1. iCloud 동기화 활성화 후 "Finder에서 SmartMemo 폴더 열기" 클릭
2. 폴더 우클릭 → 공유 → 협업 초대
3. 상대방 Apple ID 입력 → 수락 시 실시간 공유

---

### 9. 내보내기 / 가져오기

- **내보내기**: 설정 → 데이터 내보내기 → JSON 파일 저장 (백업·이전)
- **가져오기**: 설정 → 데이터 가져오기 → 파일 선택
  - **병합 모드**: 기존 데이터 유지, 새 항목만 추가 (중복 건너뜀)
  - **교체 모드**: 기존 데이터를 가져온 파일로 완전 교체

---

### 10. 자동 업데이트

- 앱 실행 시 GitHub 최신 릴리즈를 자동 확인 → 새 버전이 있으면 하단에 알림 배너 표시
- 설정 → **🔄 업데이트**에서 현재 버전 확인 및 **"업데이트 확인"** 수동 실행
- **다운로드** 클릭 → 내 Mac(arm64/x64)에 맞는 `.dmg`를 받음
- 미서명 오픈소스 앱이므로 받은 `.dmg`를 열어 앱을 옮긴 뒤 최초 실행은 **우클릭 → 열기**로 진행

---

## 🛠️ 개발 및 배포

### 로컬 개발 및 테스트

```bash
npm install          # 의존성 설치
npm start            # 앱 로컬 실행 (개발 버전)
npm test             # 전체 테스트 실행 (390개 유닛/통합 테스트)
npm run test:watch   # Vitest watch 모드 실행
```

### 패키징 및 빌드

```bash
npm run build:arm64  # Apple Silicon(M시리즈) macOS DMG 빌드
npm run build:x64    # Intel macOS DMG 빌드
npm run build        # 두 아키텍처용 DMG 빌드
```

### 🤖 자동 배포 (CI/CD)

이 저장소는 GitHub Actions를 통해 자동 배포가 활성화되어 있습니다.
1. `package.json`의 `"version"` 값을 수정하고 코드를 푸시합니다.
2. 터미널에서 아래와 같이 새 버전 태그를 붙여 원격 저장소에 푸시합니다.
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions가 자동으로 macOS 인스턴스에서 앱을 빌드하고 최신 릴리즈 페이지에 빌드 파일(`.dmg`)을 업로드합니다.

### 프로젝트 구조

```
smart-memo/
├── main.js              # Electron 메인 프로세스 (composition root)
├── renderer.js          # UI 진입점 (ES Module)
├── preload.js           # 메인 창 IPC 브릿지
├── capturePreload.js    # 캡처 창 IPC 브릿지
├── index.html           # 메인 창
├── capture.html         # 캡처 창 (⌘⇧M)
├── receipt.html         # Capture-Receipt 토스트 창
├── src/
│   ├── domain/          # 순수 비즈니스 로직 (외부 의존 없음)
│   │   ├── url.js           # URL 정규화·검증·SSRF 방어
│   │   ├── tags.js          # 태그 CRUD
│   │   ├── itemFilter.js    # 필터링·정렬
│   │   ├── itemSanitizer.js # 임포트 데이터 검증·XSS 방어
│   │   ├── htmlMeta.js      # og:*/meta 파싱
│   │   ├── idGenerator.js   # 고유 ID 생성
│   │   ├── trashPolicy.js   # 휴지통 정책
│   │   └── version.js       # 버전 비교·DMG 자산 선택
│   ├── application/     # 유스케이스
│   │   ├── captureService.js      # URL 저장 + 백그라운드 메타데이터 수집
│   │   ├── itemService.js         # CRUD + 할 일 + 휴지통 + 검색
│   │   ├── importExportService.js # 내보내기/가져오기
│   │   ├── syncService.js         # iCloud 동기화
│   │   └── updateService.js       # 업데이트 확인 (버전 비교)
│   ├── infrastructure/  # 외부 의존 (파일·네트워크·iCloud)
│   │   ├── fileStorage.js     # 원자적 파일 쓰기 (tmp → rename)
│   │   ├── configStore.js     # 설정 파일 저장
│   │   ├── fileWatcher.js     # 파일 변경 감지 (디바운스)
│   │   ├── httpFetcher.js     # HTTP 요청 (redirect·gzip 자동 처리)
│   │   ├── metadataFetcher.js # 메타데이터 수집 (YouTube oEmbed 포함)
│   │   ├── icloudDetector.js  # iCloud Drive 경로 탐지
│   │   └── updateChecker.js    # GitHub 릴리즈 조회
│   └── ui/              # 브라우저 렌더러 (ES Module)
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
│   └── sm               # CLI 스크립트
└── tests/               # 테스트 (21파일, 390개)
    ├── unit/
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    └── fakes/
        └── inMemoryStorage.js
```

### 아키텍처

Clean Architecture (Hexagonal) — Domain → Application → Infrastructure 단방향 의존.

- **Domain**: 순수 JS, fs/Electron 의존 없음 → 단독 단위 테스트
- **Application**: InMemoryStorage fake로 빠른 테스트, 실제 파일 I/O 없음
- **Infrastructure**: 실제 tmpdir · 로컬 HTTP 서버로 통합 테스트
- **CJS/ESM 분리**: main.js + src/는 CommonJS, renderer.js + src/ui/는 ESM (`sandbox: true` 환경)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 데스크탑 프레임워크 | Electron 28 |
| 메인 프로세스 | Node.js (CommonJS) |
| 렌더러 | Vanilla JS (ES Module) |
| 스토리지 | JSON 파일 (원자적 쓰기) |
| 테스트 | Vitest |

---

## 라이선스

MIT © 2026 angleCompany

