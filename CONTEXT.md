# Route01 — 작업 컨텍스트

> **Claude에게**: 새 세션 시작 시 이 파일을 가장 먼저 읽고, 맥락을 파악한 뒤 작업하세요. 세션이 끝날 때(사용자가 "오늘 마무리" 또는 유사 표현) 이 파일을 업데이트하고 commit·push 하세요. 사용자에게 워크플로를 다시 설명하지 마세요 — 이미 알고 있습니다.

최종 업데이트: 2026-04-21

---

## 1. 프로젝트 개요

- **이름**: Route01 — AI 기반 스타트업 자문 서비스
- **배포**: https://route01.kr (메인 앱 경로: `/nachim_v3.html`)
- **GitHub**: `agripha9/route01` (public)
- **호스팅**: Cloudflare Pages, `main` 브랜치 push 시 1~2분 내 자동 배포
- **사용자**: 서울, 한국어

## 2. 워크플로

1. Claude가 repo clone → 파일 수정 → commit → push to `main`
2. 토큰은 사용자가 채팅에 붙여줌 (저장 금지)
3. Cloudflare Pages 자동 배포 (1~2분)
4. 사용자가 Ctrl+Shift+R로 확인 → 피드백 반복

**세션 끝**: "오늘 마무리" 등 신호 시 CONTEXT.md 업데이트 후 commit·push.

## 3. 하지 말 것
- 로컬 preview HTML → 바로 push
- `ask_user_input_v0` 버튼 → 질문은 텍스트로만
- 워크플로 재설명 (사용자는 알고 있음)
- 토큰 저장

## 4. 파일 구조
```
route01/
├── CONTEXT.md           # 이 파일
├── nachim_v3.html       # 메인 앱 (~870줄)
├── nachim_v3.css        # 스타일 (~2650줄)
├── nachim_v3.js         # 로직 (~4860줄)
├── index.html           # 루트 → nachim_v3로 리다이렉트
├── _redirects           # Cloudflare Pages 리다이렉트
├── logo.png
└── vendor/
```

---

## 5. 배경 5단계 회색 계층 (2026-04-21 확정)

| 레벨 | 토큰 | 값 | 적용 |
|---|---|---|---|
| L1 | `--filter-bg`, `--white` | `#ffffff` | 답변 버블, 리포트 카드, 입력창 내부, 멘토 설명 row, 사이드바 프로필 배지, 온보딩 내부 요소, 표 홀수행 |
| L2 | `--bg2` | `#e8e8ec` | 현재 주력 사용처 거의 없음 (미래 확장용) |
| L3 | `--bg` | `#dfdfe4` | 메인 채팅 body, 모달 캔버스, 온보딩 카드 캔버스, 입력 바 좌우 여백 |
| L4 | `--bg3` | `#d4d4da` | 사이드바 프레임, 사이드바 하단 배지 컨테이너 |
| L5 | `--nav-glass` | `rgba(0,0,0,0.8)` | 최상단 헤더 |

**복원 태그**: `pre-gray-theme-v1` — 회색 테마 이전 상태. 되돌리려면 `git reset --hard pre-gray-theme-v1` + force push.

## 6. 색상 & 타이포

| 역할 | 값 |
|---|---|
| 브랜드 네이비 | `#1a3a6e` |
| 크림슨 강조 | `#8B1A1A` |
| 본문 ink | `#1d1d1f` |
| 회색 border | `#d2d2d7`, `#e5e5ea` |

- `--font-display: SF Pro Display, Pretendard, -apple-system, sans-serif`

## 7. 표 (화면 렌더)
- 헤더: `bg:#8B1A1A`, `color:#fff`, 중앙정렬, `padding:12px 16px`
- 첫 열: `font-weight:600`
- 홀수행: L1 흰색 · 짝수행: `#f4f4f6` · hover: `#f0f0f3`
- border: `1px solid #e5e5ea`, 외곽 `#d2d2d7`, radius 8px
- 화면·PDF·DOCX 3군데 스타일 일치 유지 (이슈 3번 참고)

## 8. 인용구 (blockquote)
- `border-left: 3px solid #d2d2d7` (회색, 네이비 아님)
- `background: #f7f8fb`, `border-radius: 0 6px 6px 0`, italic

---

## 9. 헤더 pill 시스템

- 공통 `.hb-pill` (30px height, 반투명 pill, `appearance:none`)
- Variant: 기본 / `.hb-accent`(크림슨=멘토) / `.hb-danger`(빨강=로그아웃) / `.hb-status-ok` / `.hb-status-warn` / `.hb-icon-only`
- 레이아웃: 회사명·멘토 pill 가운데, 나머지(홈·마이페이지·로그아웃·API) 우측
- **API 연결 pill**은 유료화 시점에 제거 예정 (서버사이드 프록시 전환)

## 10. 로딩 애니메이션
- 일직선 flex HTML, 21 elements (SVG 버전은 폐기)
- 양끝 `0`(네이비)/`1`(크림슨) + 점 15개 + 노드 4개
- 사이클 7.5s, rl-s0..20 개별 keyframe 누적 등장 후 일괄 fade out

---

## 11. 멘토 스타일 시스템

### 5명 + 요금제
- **FREE**: Paul Graham (YC), Peter Thiel (Founders Fund)
- **PRO**: Brian Chesky (Airbnb), Jensen Huang (NVIDIA), Naval Ravikant (AngelList)

### MENTOR_META 구조
각 멘토 3줄: `intro` (누구) / `style` (답변 방식) / `fit` (적합한 팀)
→ `fit` 줄은 bold+italic+dashed border-top

### 선택 상태 (invert)
- FREE 선택: 네이비 반전
- PRO 선택: 크림슨 반전 (`.is-pro` 명시 클래스)
- `.ob-mentor-row--locked` (PRO): L1 배경 유지, opacity 0.88, hover시 1.0

### 스타일 모달
- 폭 690px, 1열
- 선택 즉시 적용 안 함 → `pendingMentor` 상태만 갱신
- 하단 [취소] [적용], `×`·백드롭 = 취소
- `×` 버튼은 `position:sticky`로 스크롤해도 고정

### 프로토타입 모드
- `PROTOTYPE_MODE = true` → 모든 PRO 개방
- 유료화 시 `false` 전환하면 PRO 클릭 → 자동으로 `openPricingModal()` 연결 (이미 구현)

### 시스템 프롬프트
- Route01 정체성에서 YC/VC 고유명사 제거 완료
- 멘토 스타일은 프롬프트 **맨 마지막** `[[[ 가장 중요한 지시 ]]]`에 배치
- 각 멘토별 10+ 구체 어휘·레퍼런스·금지사항 앵커
- "타 악셀러레이터/VC 통계 인용 금지" 명시

## 12. 가드레일 (시스템 프롬프트)
- 스타트업 맥락의 법률/재무/HR/기술 모두 in-scope
- 구체적 소송·개인 세무 신고·의료·심리 상담만 거절

---

## 13. 사이드바

- 폭 240px, 배경 L4
- 상단 "질문 기록" 헤더 (전체 삭제 버튼 제거됨)
- 히스토리: 시간대별 그룹 (오늘/어제/지난 7일/지난 30일/이번 달/월별)
- 각 항목: 질문 전문 multi-line, hover시 우측 kebab(⋯) 노출
- kebab 클릭 → 팝오버 메뉴 (현재 "삭제", 추후 "고정"/"이름 변경" 확장)
- 하단 배지 컨테이너 L4, 개별 배지(사업 요약·핵심 고민) L1 흰색

## 14. 온보딩
- 카드 캔버스 L3, 내부 요소(입력·칩·태그·업로드존·멘토 row) L1
- 폭 690px
- 제목·부제 가운데 정렬
- **sector 다중선택**: `ob.sector[]` 배열, `ob.sectorOther` 별도
  - `onIndustryInput`이 sector 상태 건드리지 않음 (2026-04-21 버그 수정)
  - `applyProfile` 복원 시 ob.industry 단일값과 비교하는 loop 제거됨

## 15. 마크다운 3중 안전망
1. `renderMDFallback` — marked 미로드 시 헤딩·bold·italic·리스트·표 직접 파싱
2. Marked 늦은 로드 재시도 — 로드 완료 시 모든 답변 버블 재렌더
3. `stripResidualMarkdownSymbols` — 렌더 후 텍스트 노드의 잔존 `##`·`**` 제거 (`<code>`/`<pre>` 제외, 단일 `#` 보존)

---

## 16. 로드맵 — 사용자 우선순위 목록

| # | 항목 | 상태 |
|---|---|---|
| 1 | 이메일/PW 로그인 (이메일 인증) + 추후 네이버/카카오 | 대기 |
| 2 | 멘토 스타일 5인 설명·선택화면 점검 + 답변 톤 충실도 | **완료** |
| 3 | 도메인별 AI 추천 질문 | **완료** |
| 4 | 약관·개인정보처리방침 (유료 서비스 기준) | 대기 |
| 5 | 토큰 사용량 감소 + 품질 유지 전략 | 대기 |
| 6 | PDF 업로드 시 토큰 최소화 | 대기 |
| 7 | 입력창 아래 "실수 가능" 안내 문구 | 대기 |
| 8 | 질문 전 프로필 필수 입력 강제 | 대기 |
| 9 | 유료화 정책(프리→유료) + 결제 연동 | 대기 |
| 10 | 마이페이지 (PW변경/탈퇴/요금제) | 대기 |
| 11 | **스타트업 버티컬 차별화 전략** (가장 중요) | 대기 |
| 12 | 답변·내보내기(docx/pdf) 표 렌더링 + Apple UI/UX 리팩터 | **진행 중** |
| 13 | 도메인 자동 선택 (질문 내용 보고 AI가 매칭) | 대기 |

## 17. 알려진 이슈
1. **답변 화면 내 네이비/파란 선이 간간이 보임** — blockquote는 회색으로 설정돼 있지만 네이비처럼 보인다는 피드백. h3/h4/블록 요소 color leakage 조사 필요.
2. **숫자 리스트 들여쓰기 불일치** — `1.` `2.` 순번 정렬.
3. **답변·docx·pdf 표 높이 차이** — 세 렌더 경로의 셀 padding·line-height 일치 필요.

---

## 18. 2026-04-21 세션 작업 로그 (요약)

**A. 로더 & 세션 체계**
- 로딩 애니메이션 전면 교체 (SVG → flex HTML, 직선 22단계)
- CONTEXT.md 체계 도입

**B. 렌더링·마크다운 안정성**
- 정규식 greedy 버그 수정, li 내부 heading hoist
- 마크다운 3중 안전망 (fallback 강화 + 늦은 로드 재시도 + 잔존 기호 청소)

**C. 시스템 프롬프트**
- 법률/재무/HR/기술 in-scope 확장
- YC/VC 고유명사 제거, 멘토 스타일 맨 마지막 배치, 구체 어휘 앵커 확장

**D. 헤더 UI 전면 통일**
- `.hb-pill` 공용 시스템 도입, `<button>` appearance reset
- 회사명 + 멘토 가운데, 나머지 우측

**E. 멘토 선택 UI 전면 리디자인**
- 이모지 제거, 3줄 구조 (intro/style/fit)
- 모달 폭·정렬·배지 위치 수차례 조정 끝 최종: 690px 1열, 배지 내부, FREE 네이비/PRO 크림슨 반전
- 즉시 적용 → 취소/적용 버튼 확정 UX

**F. 사이드바 히스토리 Gemini 스타일 리팩터**
- 시간대별 그룹핑 + kebab(⋯) 팝오버 메뉴
- 구 DEPRECATED .hist-item 제거 (column flex 충돌 해결)
- 사이드바 폭 272→240

**G. 모달 품질**
- `×` sticky (스크롤 시 고정) + halo 제거

**H. 회색 5단계 테마 도입**
- 전체 배경 계층 재설계 (복원 태그 `pre-gray-theme-v1` 준비)
- 수차례 색상 조정 끝 최종: L1 순백 / L2 미사용 / L3 메인·모달 / L4 사이드바 / L5 헤더
- 멘토 row L1, 모달·온보딩 캔버스 L3, 입력창 focus ring 제거

**I. 온보딩 sector 다중선택 버그 수정**
- 업종 타이핑 시 sector 초기화 + 복원 시 덮어쓰던 두 버그 제거

---

## 19. 다음 세션 시작 시 확인할 것
- 알려진 이슈 3가지 (표 높이 일치, blockquote 색 leakage, 숫자 리스트 정렬) 우선 확인
- 로드맵에서 사용자가 선택한 다음 항목 진행
- 멘토 답변 톤 실사용 관찰 (Peter Thiel 선택 시 YC 통계 안 나오는지)
- 회색 테마 추가 조정 요구 대응

---

## 20. Claude Design 활용 계획 (2026-04-21 추가)

**Claude Design** = Anthropic Labs 신제품 (2026-04-17 공개). 채팅으로 인터랙티브 프로토타입·랜딩페이지·슬라이드·내부 툴 목업 생성. Opus 4.7 기반, Claude Code로 핸드오프 가능. 사용자 플랜(Max 5x)에 포함, 아직 미사용(0%).

접속: https://claude.ai/design

### Route01에 적용할 순서
1. **조직 디자인 시스템 초기 셋업** (첫 1~2시간 투자 권장)
   - `agripha9/route01` repo 링크 (monorepo 아니니까 root 그대로 OK)
   - 대표 스크린샷 1~2장 업로드 (답변 화면, 멘토 모달 등)
   - 회색 5단계 토큰·`.hb-pill` 시스템·색상(네이비 `#1a3a6e`, 크림슨 `#8B1A1A`)·폰트·멘토 row 구조가 자동 추출되는지 검증
2. **테스트 프로젝트로 시스템 검증**
   - "마이페이지 — 비밀번호 변경 / 요금제 확인 / 탈퇴" 간단 프롬프트
   - 생성물이 Route01 브랜드 톤과 일치하는지 확인
   - 안 맞으면 디자인 시스템 추가 조정
3. **로드맵 UI 중심 항목을 Claude Design으로 빠르게 프로토타이핑**
   - 로드맵 #4: 약관·개인정보처리방침 템플릿 페이지
   - 로드맵 #9: 유료 플랜 가격표·결제 플로우
   - 로드맵 #10: 마이페이지 (PW변경·탈퇴·요금제)
   - 로드맵 #12: Apple 스타일 UI 리팩터 (전체 일관성 점검)
4. **Claude Code 핸드오프**
   - Design에서 확정된 화면을 핸드오프 번들로 묶음
   - Claude Code로 넘겨 실제 `nachim_v3.html/css/js`에 반영할 코드 생성
   - 사용자가 본 세션처럼 피드백 루프 진행

### 주의
- 토큰 소모 큼 → 디자인 시스템 선 셋업이 장기적으로 토큰 절약
- 큰 monorepo는 서브디렉토리 링크 권장 (Route01은 해당 없음)
- 생성물은 참고용, 최종 코드는 여전히 Claude Code + 사용자 피드백 사이클로 확정
