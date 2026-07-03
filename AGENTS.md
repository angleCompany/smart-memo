# AGENTS.md — Smart Memo

> ⚠️ **실수 하지마.** 변경 전 관련 코드를 확인하고, 변경 후 `npm test`로 검증한다.

> 이 파일은 **여러 AI 코딩 툴이 공유하는 정본(single source of truth)** 입니다.
> Antigravity는 이 파일을 기본으로 읽고, Claude Code는 `CLAUDE.md`의 `@AGENTS.md` import로 이 내용을 그대로 사용합니다.
> **프로젝트 지침을 바꿀 때는 항상 이 파일을 수정하세요.** (툴별 파일에 중복 작성 금지)

---

## 프로젝트 개요

**Smart Memo** — macOS용 링크 수집 앱. "URL을 던지면 끝" — 정리 없이 저장하고 나중에 검색으로 찾는다.
핵심 가치: **Capture-to-saved < 1초** (앱을 열지 않아도 저장).

- 플랫폼: macOS 12+, Node.js 18+
- 프레임워크: Electron 28
- 저장소: JSON 파일 (원자적 쓰기), iCloud Drive 동기화 지원

## 아키텍처

Clean Architecture (Hexagonal) — **Domain → Application → Infrastructure 단방향 의존**. 안쪽 레이어는 바깥을 몰라야 한다.

- **Domain** (`src/domain/`): 순수 JS. `fs`·Electron·네트워크 의존 **금지**. 단독 단위 테스트 대상.
- **Application** (`src/application/`): 유스케이스. 테스트는 `tests/fakes/inMemoryStorage.js` fake 사용, 실제 I/O 없음.
- **Infrastructure** (`src/infrastructure/`): 실제 파일 I/O·HTTP. 테스트는 실제 tmpdir·로컬 HTTP 서버로 통합 테스트.
- **UI** (`src/ui/`): 렌더러 뷰 로직.

### 모듈 시스템 (중요)

- `main.js` + `src/` (domain·application·infrastructure) → **CommonJS** (`'use strict'`, `require`, `module.exports`)
- `renderer.js` + `src/ui/` → **ES Module** (`sandbox: true` 렌더러 환경)
- `tests/` → Vitest, ESM `import`
- 새 파일은 **주변 파일의 모듈 스타일을 그대로 따를 것.**

## 디렉터리 구조

```
main.js              # Electron 메인 프로세스 (CJS)
preload.js / capturePreload.js
renderer.js          # 렌더러 진입 (ESM)
index.html / capture.html / receipt.html
styles.css
src/
  domain/            # 순수 비즈니스 로직 (외부 의존 없음)
  application/       # 유스케이스 서비스
  infrastructure/    # 파일·HTTP·iCloud 등 외부 연동
  ui/                # 렌더러 뷰 (ESM)
bin/sm               # CLI (`sm <url>`, `sm open`)
tests/               # Vitest 유닛/통합 테스트
```

## 개발 · 테스트 명령

```bash
npm start            # Electron 앱 실행
npm test             # 전체 테스트 (Vitest run)
npm run test:watch   # watch 모드
npm run test:coverage
npm run build        # macOS DMG 빌드 (x64 + arm64)
```

## 코딩 규칙

- **레이어 의존 방향 준수**: domain은 어떤 바깥 레이어도 import하지 않는다.
- **테스트 우선**: 로직 변경 시 해당 레이어 테스트를 추가/갱신하고 `npm test`로 확인. 모든 테스트가 통과해야 한다.
- **한국어**: 주석·테스트 설명(`it('...')`)은 기존처럼 한국어로 작성.
- **URL 안전성**: 사용자 입력 URL은 `src/domain/url.js`의 `assertSafeUrl`로 검증 (사설 IP·비-HTTP 프로토콜 차단).
- **파일 저장은 원자적 쓰기** 패턴 유지 (임시 파일 → rename).
- 기존 코드의 네이밍·포맷·주석 밀도를 그대로 따를 것.

## 멀티 툴 사용 규칙 (Antigravity ↔ Claude Code)

- 이 저장소는 **Antigravity CLI와 Claude Code CLI를 번갈아 사용**한다.
- **프로젝트 공통 지침은 이 `AGENTS.md`에만** 둔다.
- `CLAUDE.md`는 `@AGENTS.md`를 import하는 얇은 포인터일 뿐이다 — 내용을 여기에 복제하지 말 것.
- Antigravity 전용 override가 필요하면 `GEMINI.md`(repo 루트)에 작성한다 — Antigravity에서 `AGENTS.md`보다 우선 적용된다.
- 툴별 설정(권한·MCP 등)은 각 툴 고유 파일에 둔다: Claude Code는 `.claude/settings*.json`. 이런 설정은 공유 대상이 아니다.
