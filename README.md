# Smart Memo

macOS용 링크 수집 앱 — URL을 던지면 끝. 정리 없이도 나중에 찾을 수 있습니다.

![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-lightgrey?logo=apple)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-311%20passing-brightgreen)

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
| Raycast 확장 | 클립보드 URL 즉시 저장 · URL 입력 폼 |
| Capture-Receipt 토스트 | 저장 후 앱 전환 없이 우하단에 1.8초 알림 |
| URL 메타데이터 자동 수집 | 제목·설명·썸네일·카테고리 자동 파싱 |
| YouTube 특별 지원 | oEmbed로 영상 제목·채널·썸네일 정확 수집 |
| 태그 시스템 | 자유 태그 추가, 사이드바 태그 필터 |
| 자동 카테고리 분류 | Video · Code · Article · Social 등 도메인 기반 분류 |
| 전체 검색 | 제목·URL·도메인·메모 통합 검색 |
| 휴지통 | 소프트 삭제(30일 보관), 복원 · 완전 삭제 |
| iCloud 동기화 | 같은 Apple 계정 모든 Mac 자동 동기화 |
| 내보내기/가져오기 | JSON 백업 및 마이그레이션 |

---

## 설치

### DMG 직접 설치 (권장)

1. [Releases](https://github.com/angleCompany/smart-memo/releases/latest)에서 DMG 다운로드
   - Apple Silicon (M1·M2·M3·M4): `Smart-Memo-1.0.0-arm64.dmg`
   - Intel Mac: `Smart-Memo-1.0.0-x64.dmg`
2. DMG 열기 → `Smart Memo.app`을 `/Applications`로 드래그

> **"확인되지 않은 개발자" 경고가 뜨는 경우**
>
> **방법 A** — Finder에서 앱 우클릭 → 열기 → 열기
>
> **방법 B** — 터미널:
> ```bash
> xattr -cr "/Applications/Smart Memo.app"
> ```

### 소스에서 직접 실행

```bash
git clone https://github.com/angleCompany/smart-memo.git
cd smart-memo
npm install
npm start
```

요구사항: Node.js 18+, macOS 12+

---

## 사용 방법

### 1. 글로벌 단축키 (⌘⇧M)

어느 앱에서든 **⌘⇧M** 을 누르면 캡처 창이 화면 상단에 나타납니다.

```
URL 붙여넣기 또는 입력 → Enter로 저장
```

- 클립보드에 `http://` 또는 `https://`로 시작하는 텍스트가 있으면 자동 입력
- 저장 성공: 창이 즉시 닫히고 우하단에 Capture-Receipt 토스트 표시
- 중복 URL: "이미 저장된 링크" 토스트 후 닫힘
- `Esc` — 취소

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

### 4. Raycast 확장

**설치**

1. Raycast → 설정(⌘,) → Extensions 탭
2. `+` 버튼 → **Add Script Directory**
3. 이 저장소의 `raycast/` 폴더 선택

**명령어**

| 명령어 | 동작 | 추천 단축키 |
|--------|------|------------|
| **클립보드 URL 저장** | 클립보드의 URL을 즉시 저장, HUD 알림 표시 | ⌥⌘S |
| **URL 저장** | URL 입력 폼 표시 (클립보드 URL 자동 채움) | — |
| **Smart Memo 열기** | 메인 창 열기 | — |

"클립보드 URL 저장"에 단축키를 지정하면 Raycast를 열지 않고도 바로 저장됩니다.

---

### 5. 태그

- 우측 상세 패널에서 태그 입력 후 **Enter** → 추가
- 사이드바 하단 태그 목록 클릭 → 해당 태그 필터링
- 태그 옆 `×` 클릭 → 제거

---

### 6. 검색

상단 검색창에 입력하면 제목·URL·도메인·메모 내용을 실시간으로 통합 검색합니다.

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

## 개발

```bash
npm install          # 의존성 설치
npm start            # 앱 실행
npm test             # 테스트 전체 실행 (311개)
npm run test:watch   # watch 모드
npm run build:arm64  # Apple Silicon DMG 빌드
npm run build:x64    # Intel DMG 빌드
npm run build        # 두 아키텍처 동시 빌드
```

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
│   │   └── trashPolicy.js   # 휴지통 정책
│   ├── application/     # 유스케이스
│   │   ├── captureService.js      # URL 저장 + 백그라운드 메타데이터 수집
│   │   ├── itemService.js         # CRUD + 휴지통 + 검색
│   │   ├── importExportService.js # 내보내기/가져오기
│   │   └── syncService.js         # iCloud 동기화
│   ├── infrastructure/  # 외부 의존 (파일·네트워크·iCloud)
│   │   ├── fileStorage.js     # 원자적 파일 쓰기 (tmp → rename)
│   │   ├── configStore.js     # 설정 파일 저장
│   │   ├── fileWatcher.js     # 파일 변경 감지 (디바운스)
│   │   ├── httpFetcher.js     # HTTP 요청 (redirect·gzip 자동 처리)
│   │   ├── metadataFetcher.js # 메타데이터 수집 (YouTube oEmbed 포함)
│   │   └── icloudDetector.js  # iCloud Drive 경로 탐지
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
├── raycast/             # Raycast 확장
│   └── src/
│       ├── capture-clipboard.tsx  # 클립보드 URL 즉시 저장
│       ├── capture-url.tsx        # URL 입력 폼
│       ├── open.tsx               # 앱 열기
│       └── utils.ts               # 공통 유틸
├── bin/
│   └── sm               # CLI 스크립트
└── tests/               # 테스트 (17파일, 311개)
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
| Raycast 확장 | TypeScript + @raycast/api |

---

## 라이선스

MIT © 2026 angleCompany
