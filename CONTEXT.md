# Route01 — 작업 컨텍스트

> **Claude에게**: 새 세션 시작 시 이 파일을 가장 먼저 읽고, 맥락을 파악한 뒤 작업하세요. 세션이 끝날 때(사용자가 "오늘 마무리" 또는 유사 표현) 이 파일을 업데이트하고 commit·push 하세요. 사용자에게 워크플로를 다시 설명하지 마세요 — 이미 알고 있습니다.

최종 업데이트: 2026-04-27

> **참고**: 디자인·UI 관련 결정은 `DESIGN.md`(프로젝트 루트)를 source of truth로 삼으세요. CONTEXT.md는 세션 로그·로드맵·이슈 추적 중심, DESIGN.md는 색·타이포·레이아웃 사양.

---

## 1. 프로젝트 개요

- **이름**: Route01 — AI 기반 스타트업 자문 서비스
- **배포**: https://route01.kr (루트 `/`가 메인 앱 — 2026-04-24부터 `index.html` 사용)
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
├── index.html           # 메인 앱 (~890줄, 2026-04-24 전엔 nachim_v3.html)
├── nachim_v3.css        # 스타일 (~2856줄)
├── nachim_v3.js         # 로직 (~5901줄)
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

- 폭 240px, 배경 L4 (`--bg3` / #d4d4da)
- 상단 "질문 기록" 헤더 + **접기 버튼** (삼중 chevron SVG, 배경 L2, hover L1)
- **접힘 상태**: `aside.collapsed` + `body.sidebar-collapsed` → width 0으로 전환 (0.22s transition), 좌측 상단에 `.aside-open-fab` 부동 열기 버튼 노출
- 상태는 `localStorage.r01_sidebar_closed='1'` 저장 → 재로그인/새로고침에도 유지
- 히스토리: 시간대별 그룹 (오늘/어제/지난 7일/지난 30일/이번 달/월별)
- 각 항목: 질문 전문 multi-line, hover시 우측 **세로 3점 kebab(⋮)** 노출 (padding 4px로 경계선에 가까움)
- kebab 클릭 → 팝오버 메뉴 ("삭제" 등, 향후 확장)
- 하단 배지: L1 흰색 배경 + `--border` 테두리 + `var(--ink)` 글씨 (질문 목록과 같은 톤)

## 14. 온보딩
- **3단계 구조** (2026-04-22 2→3 재편)
  - Step 1 "당신의 스타트업": industry, sector(required), stage, target
  - Step 2 "지금의 상황": concern(required, 500자), team(required), MRR/invest/name(선택)
  - Step 3 "당신의 멘토": style(required, 추천 배지), 자료 업로드(PRO)
- 카드 캔버스 L3, 내부 요소(입력·칩·태그·업로드존·멘토 row) L1
- 폭 690px
- 제목·부제 가운데 정렬
- **입력 폰트 15px** · letter-spacing -0.3 (17px에서 축소)
- **칩 선택 공통 반전**: 업종·멘토·단계·타겟·팀·투자 전부 네이비 꽉 찬 배경 + 흰 글씨
  - `#stage-grid .ob-chip.sel` 등 grid-specific 룰이 `!important`로 보호 중 (레거시 옅은-블루 룰 재등장 방지)
- **버튼**: 이전/다음/시작하기 → 14px 폰트, 120px min-width, `justify-content:center`, `→/←` 화살표 제거
- **자동완성 차단**: 모든 input에 `autocomplete="off"` + CSS `-webkit-autofill` 백색 inset shadow 오버라이드 (브라우저 autofill 연파랑 배경 방지)
- **label hint**: tooltip 방식 폐기 → 전부 label 옆 inline 텍스트로 노출
- **sector 다중선택**: `ob.sector[]` 배열, `ob.sectorOther` 별도
  - `onIndustryInput`이 sector 상태 건드리지 않음 (2026-04-21 버그 수정)
  - `applyProfile` 복원 시 ob.industry 단일값과 비교하는 loop 제거됨
- **멘토 추천 시스템**: `computeRecommendedMentor()`가 stage/concern/sector 점수로 5인 중 1명 추천 → `.ob-mentor-recommend` 배지 + Free 멘토일 때만 자동 선택 (PRO는 수동 선택 유지)

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
| 3 | 도메인별 AI 추천 질문 | **완료** (30개×6도메인 + 페이지네이션) |
| 4 | 약관·개인정보처리방침 (유료 서비스 기준) | 대기 |
| 5 | 토큰 사용량 감소 + 품질 유지 전략 | 대기 |
| 6 | PDF 업로드 시 토큰 최소화 | 대기 |
| 7 | 입력창 아래 "실수 가능" 안내 문구 | **완료** |
| 8 | 질문 전 프로필 필수 입력 강제 | **완료** |
| 9 | 유료화 정책(프리→유료) + 결제 연동 | 대기 |
| 10 | 마이페이지 (PW변경/탈퇴/요금제) | 대기 |
| 11 | **스타트업 버티컬 차별화 전략** (가장 중요) | 대기 |
| 12 | 답변·내보내기(docx/pdf) 표 렌더링 + Apple UI/UX 리팩터 | **진행 중** (DOCX 흰줄은 altChunk 한계로 보류) |
| 13 | 도메인 자동 선택 (질문 내용 보고 AI가 매칭) | 대기 |

## 17. 알려진 이슈
> **참고**: 최신 이슈 목록은 섹션 22 참조.

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
> **참고**: 최신 권장 순서는 섹션 23 참조.

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
   - Claude Code로 넘겨 실제 `index.html` / `nachim_v3.css` / `nachim_v3.js`에 반영할 코드 생성
   - 사용자가 본 세션처럼 피드백 루프 진행

### 주의
- 토큰 소모 큼 → 디자인 시스템 선 셋업이 장기적으로 토큰 절약
- 큰 monorepo는 서브디렉토리 링크 권장 (Route01은 해당 없음)
- 생성물은 참고용, 최종 코드는 여전히 Claude Code + 사용자 피드백 사이클로 확정

---

## 21. 2026-04-22 세션 작업 로그 (38커밋)

긴 세션. 답변 품질·온보딩 전면 재편·로더 튜닝·사이드바 토글·추천질문 시스템·입력창 다듬기·토스트 위치까지 광범위 UI 정리.

### A. 답변 품질 정책
- `730314d` max_tokens per-call 8192로 상향 + 컨텍스트 24메시지로 확장 (품질 우선)

### B. DOCX 표 헤더 흰 줄 5회 시도 → 원복
- `fada213`, `c3c7b8e`, `a3c6220`, `b4ef26e`, `8c185b9`, `1b9d3a3`, `f0b8bd9` 모두 altChunk 파서 한계 부딪혀 `681877b`·`81f1400`으로 롤백
- **결론**: altChunk는 line-height로 배경 칠하지 않음. 근본 해결은 `docx.js` 기반 OOXML 직생성 필요 (로드맵 #12에 기록)
- PDF 헤더 반복(thead) 수정은 유지됨

### C. 로더 애니메이션 튜닝
- `0febe10` 컨테이너 폭 기반 동적 점 개수
- `226a51b` "모두 등장 → 모두 페이드" 제대로 된 사이클
- `dc20940` 다이아몬드 → 뾰족 육각형 노드
- `12a9733` 대칭 점·노드 패턴 (4k+3 정규화)
- `cb3b568`→`86fae77`→`3d77534` 사이클·노드 크기 미세 조정 (최종 11s, 9×10px)

### D. 온보딩 전면 재편 (2→3 스텝 + 멘토 추천)
- `54831a1` 프로필 강제 — 건너뛰기 버튼 제거
- `1986906` 종료 시 스마트 처리 (저장된 프로필이 완전하면 discard, 현재 완전하면 autosave, 불완전하면 첫 미완성 step으로 이동)
- `0ad1c97` 모달 dim+blur 백드롭 통일
- `f787284` 초기 HTML에 `class='hidden'` — 로그인 시 flash 제거
- `4033c91` **2→3 스텝 재편 + 멘토 추천 시스템**: step1(스타트업), step2(상황), step3(멘토+업로드). `computeRecommendedMentor()`로 5명 중 1명 추천 배지
- `ac2f610` Starter/PRO 통일, tooltip 점선 제거, textarea 폰트 명시
- `ac1c301` 칩 선택 통일(네이비 반전), 입력 17→15px, 버튼 축소, `→/←` 제거
- `90eb0d5` 칩 선택 스타일 **실제로 반영되게** 수정 (stage/target/team/invest grid-specific `!important` 룰 중 옅은-블루 하드코딩 제거)
- `4629777` Step2 tooltip → label 옆 inline hint로 노출
- `fc478bd` 브라우저 autofill 연파랑 배경 차단 (`autocomplete="off"` + `-webkit-autofill` 100px inset shadow 트릭)

### E. UI 일괄 정리
- `bf0747e` 헤더 title 6개 제거, 로그아웃 pill `hb-danger` 제거(마이페이지와 동일), 도메인 버튼 검정→네이비, 지원사업 버튼 크림슨 반전+📋 제거, 추천칩 배경 대비, 좌측하단 배지 네이비, 로더 11s 복구
- `21b0597` **사이드바 토글** (collapsible + localStorage 유지)
- `18da2ff` **추천질문 페이지네이션**: 6도메인×30개, dot indicator 3페이지, 이전 중복 `.sug-chip` CSS 해소
- `a7e6b8a` 토글 버튼 배경 L2 + 삼중 chevron, 좌측하단 배지 글씨 ink, 추천칩 hover 파란 테두리 제거
- `284abc5` 좌측하단 배지 배경 L1 흰색으로 원복

### F. 하단 입력창
- `6693838` 상단 경계선 제거, textarea 17→14px, 첨부·전송 아이콘 18×18로 통일
- `10e9c24`→`f619651`→`796e595` 전송 버튼 색 3번 조정 끝 **첨부 버튼과 동일한 L2(#e8e8ec)** 로 고정, 웰컴 화면 전송 버튼은 **배경 완전 제거** (투명)

### G. 멘토 변경 토스트
- `e98ab19` 위치 하단 80px → 헤더 멘토 pill 바로 아래 (pill bounding rect 기준 동적 계산)
- `c1e27fd` 간격 8→14px로 헤더와 겹침 해소 + `cubic-bezier(.34,1.56,.64,1)` 바운스 복원

### H. 세션 마무리 정리
- `.sug-chip` 레거시 중복 CSS 정의 청소 (1617줄 옛날 `bg2` 배경 블록 제거 — 1928줄 최종본만 남김)
- CONTEXT.md 업데이트 (날짜·파일 줄수·사이드바·온보딩 섹션 최신화)

---

## 24. 2026-04-23 세션 작업 로그 (21커밋)

답변 품질·UX 정제 + 답변 속도/품질 인프라 착수. 온보딩 버그 수정부터 시작해 모달·로그인·답변 헤더·멘토 프롬프트 전면 재설계·Apple 스타일 답변 리팩터·로더 튜닝까지 진행한 뒤, Phase 1(모델 업그레이드 + 프롬프트 캐싱)까지 완료.

### A. 온보딩·모달·로그인·업로드 다듬기
- 온보딩 × 확인 모달 + 2개 버그 수정 (자동 멘토 선택 제거, ob 초기값 하드코딩 제거)
- 배지 시스템 통일: 필수/FREE=네이비 채움+흰글씨, PRO=크림슨 채움+흰글씨, 이모지 제거
- Apple compact 스타일: 모달 460px, primary 버튼 네이비→회색 `#86868b`
- 로그인 화면 재디자인: 좌측 패널 L4 `#d4d4da`, 바깥 L2 `#e8e8ec`, 크림슨 이탤릭 타이틀, 셀링포인트 3개 + 멘토 칩
- 셀링포인트 간격 1.5배 (22→33px, 모바일 16→24px) — `e40b4cd`
- 업로드존 "관련 자료를 올릴수록 맞춤 자문이 정확해집니다" 힌트
- "재무제표" 예시 제거 (OCR 품질 이슈)

### B. 답변 헤더 — 멘토 정체성 확립
- `7289714`, `bfd264f`, `e927819`, `4c45ee6` 답변 헤더 "Route01 AI" → **"Paul Graham [YC] · Route01 AI"**
- `renderAiHeadInner(aiLabel, mentorOverride)` 헬퍼 도입
- 버블마다 생성 시점 멘토 고정: `data-mentor` 속성, `addMsg(role,text,files,aiLabel,historyMentor)` 시그니처 확장
- `saveHistory`에 `mentor` 필드 추가 → 히스토리 복원 시 그 시점 멘토로 복원
- **멘토별 이니셜 모노그램 아바타**: PG `#F26522` / PT `#1a1a2e` / BC `#FF5A5F` / JH `#76b940` NVIDIA 그린 / NR `#2a2a2a` 차콜 (30×30 원형, 흰 이니셜)

### C. 시스템 프롬프트 전면 재설계
- `4f4b9c0`, `a910924`, `3fcc734` 근본 원인(공통 `## Executive Summary`가 오프닝 동질화) 제거
- `buildSys()` 재작성, 기존은 `buildSysLegacy()`로 보존
- **MENTOR_STYLES 5개 전면 확장**: `[당신은 누구인가]` / `[핵심 철학]` / `[어휘·프레임]` / `[자주 인용하는 사례]` / `[도메인별 접근 방식]` / `[답변 포맷 — 엄수]` / `[톤]` / `[금지]`
- **멘토별 답변 포맷 차별화** (모두 H2 빨간 막대):
  - Paul Graham: H1 결론 한 줄(이탤릭) + 에세이 본문 + `## 지금 할 일`
  - Peter Thiel: `## 잘못된 전제` / `## 진짜 질문` / `## 독점 설계` / `## 오늘의 한 수`
  - Brian Chesky: `## 지금의 경험` / `## 11성급 버전` / `## 거기로 가는 길` / `## Founder Mode — 이번 주`
  - Jensen Huang: `## 30년 뒤 그림` / `## 플랫폼 레이어` / `## 지금의 고통` / `## 오늘부터 10년`
  - Naval: `# 한 줄 격언` (조건부) + `## 진짜 질문` / `## 레버리지` / `## 판단과 복리` / `## 생각해볼 것`

### D. 답변 품질 버그 수정
- `b194a42`, `5ea4e39` 문장이 H2로 박히는 문제(공통 규칙에 "헤딩 20자 이내 명사구 + 마침표 금지" 추가)
- `## 지금 할 일` 중복 렌더 → 프롬프트 "같은 섹션 제목 두 번 금지" + `preprocessMarkdown`에 빈 헤딩 제거 + 연속 중복 헤딩 병합 정규식
- `44afd46`, `821b299`, `b4c9a96` Paul Graham·Naval 오프닝 통일(H1 이탤릭 22px/800)
- `838670c` H3 하위 섹션 허용 + 표 활용 권장 블록 추가 (멘토 재설계 후 섹션·표 감소 대응)

### E. Apple 스타일 답변 UX 리팩터
- `c140412`, `7a4c622` 화면 + 내보내기(DOCX·PDF) 양쪽 동기화
- 롤백 태그: `pre-apple-style-refresh` (`c05b6d9` 시점)
- 화면: .report-bubble padding 2.25/2.75 → 3/3rem, font-size 14 → 15px, line-height 1.75 → 1.62, H2 20→22px, H3 18→17px, ul 마커 `#86868b`/400 (Apple 점)
- Export: `EXPORT_DOC_STYLES` + `htmlStyle` 배열 + DOCX 인라인 셀 스타일 모두 11pt/1.62로 동기화

### F. 로딩 애니메이션 재조정
- `f67f0af` fade 구간 축소 (`FADE_END_PCT` 85→97): 빈 대기 1.65→0.33초
- `76499a8` 안내 문구 "맞춤형 답변의 품질을 높이기 위해 시간이 다소 걸릴 수 있습니다" 2사이클 후 페이드인
- `4698405` 안내 문구 위치: 카드 안 → `.ai-body` 바깥 직계 자식, 정렬 왼쪽 → 가운데
- `a1d17bd` fade-out 3.63→1s, hold 2.2→1s, 사이클 11→8.4s (APPEAR 72% / HOLD 84% / FADE 96%)
- `LOADER_CYCLE_SEC` 상수로 hint 타이머와 동기화

### G. 헤더 멘토 모달 ↔ 온보딩 동기화
- `989c955` `ob-mentor-row-badge-wrap` 래퍼 통일, 모달 padding `2.5rem 2.75rem`로 맞춤
- `478e7ae` **추천 배지 골드 outline 스타일**: `#B8862C` border + `#9C6A1A` text + 흰 배경. FREE(네이비)·PRO(크림슨)과 완전 다른 시각 언어. 선택 시 흰 outline+흰 글씨
- `paintMentorRecommendation(gridSelector)` 공용 헬퍼 (data-val/data-style 둘 다 처리). `openStyleModal`에서도 호출

### H. Naval 표시명
- `584ffe5` UI 레이어에서만 `mentorDisplayName()` 헬퍼로 **"Naval Ravikant (AngelList)"** 합성 (키는 그대로 `'Naval Ravikant'` 유지 → localStorage 호환). 적용 4곳: pb-style, style-btn-text, 프로필 모달, 변경 토스트. LLM userCtx와 답변 헤더는 건드리지 않음

### I. 답변 속도/품질 Phase 1 (완료)
- **Step 1 — 모델 업그레이드** (`bcd5f4a`): `resolveModelId` pick을 문자열 역순 정렬로 변경(최신 우선), opus 슬롯 캐시 추가, 3개 폴백 모두 최신화
  - 메인·지원사업: `claude-3-5-sonnet-20241022` → `claude-sonnet-4-5-20250929`
  - 추천 질문: `claude-3-5-haiku-20241022` → `claude-haiku-4-5-20251001`
  - 사용자 피드백: "품질 상승 잘은 모르겠는데 조금 나아진 듯, 나머지 잘 나옴"
- **Step 2 — 프롬프트 캐싱** (`617e553`): 메인 답변 `callOnce`와 지원사업 `buildGrantSystem` 둘 다 `system: system` → `system: [{type:'text', text:system, cache_control:{type:'ephemeral'}}]`. 추천 질문은 프롬프트 짧아 제외(<1024 토큰)
  - 관측 로깅: `console.log('[cache]', {write, read, in, out})`
  - **실측 검증**: 첫 요청 `write: 5582 read: 0`, 두 번째 요청 `write: 0 read: 5582` → 캐시 히트 정상 동작. 90% 할인 + 지연 단축 효과 활성화

---

## 25. 알려진 이슈 (2026-04-24 시점)

1. **DOCX 표 헤더 흰 줄** — altChunk 파서 한계, `docx.js` OOXML 직생성 마이그레이션 필요 (장기)
2. **숫자 리스트 들여쓰기** — `1. 2.` 정렬 불일치 케이스 산발적 발생
3. **번호 리스트 마커 색 체감 약함** — 2026-04-24 DESIGN.md 리팩터에서 크림슨 `#8B1A1A` 600 0.92em으로 설정했으나 사용자 스크린샷 확인 결과 "거의 검정"처럼 보임. 사용자 판단 "그대로 나둬도 됨". 나중에 더 밝은 크림슨(`#B52828` 등) 마커 전용 변수 고려 가능
4. **멘토 답변 톤 실사용 관찰 지속 필요** — Peter Thiel/Chesky/Huang/Naval 체감 검증
5. **H2 밑줄 재발 주의** — 2026-04-24 `60eaac5`에서 `.report-bubble h2`의 late !important 중복 정의 제거했으나, 향후 누가 또 중복 규칙을 추가하면 재발 가능. CSS 편집 시 DESIGN.md 참조 필수

---

## 26. 로드맵 — 사용자 우선순위 (2026-04-24 최신)

### ✅ 완료된 것 (이전 로드맵에서 빠짐)
- Phase 1 Step 1·2·3 전부: 모델 업그레이드, 프롬프트 캐싱, **스트리밍(건너뛰기 결정)**
  - 스트리밍은 사용자 검토 후 "리포트 완성도 우선"으로 SKIP 결정 (2026-04-24 세션 초반)
  - 백엔드 도입 시점에 A방식 스트리밍 재검토 예정
- Phase 2-A 복잡도 기반 모델 라우팅 (`a48a275`, 2026-04-24)
- **Phase 2-B PDF 캐싱** (`ccc0611`, 2026-04-24) — 채팅 첨부 PDF `cache_control: ephemeral`. 재질문 시 90% 할인. 본격 RAG 여부는 **클로즈 베타 데이터로 판단**.
- **Apple 컨설팅 리포트 UI/UX 리팩터 완료** (2026-04-24 세션)
  - DESIGN.md 프로젝트 루트에 추가 — 앞으로 UI 변경의 source of truth
  - :root 팔레트 웜톤 전환 (쿨 blue-gray → warm-neutral Claude 톤)
  - 답변 버블 H2 크림슨 막대 제거, typography-only hierarchy
  - H3 색 shift `var(--ink2)` #3d3d3a로 위계 명확화
  - 볼드-only 단락 border-bottom 제거 (두 줄 artifact 해결)
  - 수평선(`---`) 프롬프트+CSS 양쪽에서 차단
  - DOCX/PDF export 동기화

### 🟢 진행 중 / 베타 관찰 대기: Phase 2-B — PDF 캐싱

**2026-04-24 구현 완료** (`ccc0611`). 채팅 첨부 PDF에 `cache_control: ephemeral` 적용으로 재질문 시 90% 절감.

**다음 액션**:
- **클로즈 베타 런칭 후** 사용자 실데이터 수집 (console의 `[pdf]`·`[cache]` 로그 기반)
- 긴 PDF가 자주 올라오면 full RAG(TF-IDF 청크) 추진 판단
- 드물게만 쓰이면 여기서 종료

### 🔴 다음 세션 최우선 — 백엔드 + 로그인·유료화 통합 (2026-04-24 확정)

**사용자가 2026-04-24 세션 마무리 시 방향 A로 결정.** 상세 계획은 §31 참조.

기술 인프라(Phase 1·2-A·2-B)·UX 폴리시 작업은 일단락. 이제 실사용자 확보를 위한 제품 기능 단계.

현재 구조의 근본적 한계: API 키가 클라이언트에 노출되어 유료 서비스 불가능.
**오픈 전 반드시 해결해야 할 과제**이며, 여러 로드맵 항목을 한 번에 해결하는 토대:

- **#1 이메일/PW 로그인 + 이메일 인증** + **#1 네이버/카카오 로그인**
- **#4 약관·개인정보처리방침** (유료 서비스 기준)
- **#11 유료화 정책·결제 연동** (토스페이먼츠/포트원)
  - 기본 무료, 일정 질문 이상 유료
  - FREE=Sonnet only (Paul Graham·Thiel), PRO=Opus 라우팅(Chesky·Huang·Naval)
- **#12 마이페이지** (PW 변경, 탈퇴, 요금제 확인/변경)
- 스트리밍(A방식) 재검토 — 백엔드 경유 시 타임아웃 방지용으로 필요해짐

### 🟡 그 다음: Phase 3 — 스타트업 버티컬 차별화

**#13 사용자 가장 중요하게 여기는 항목.** 기존 LLM·유사 서비스 대비 차별화.

- 한국 스타트업 KB 수집 (K-스타트업·TIPS·예비창업패키지, 한국 VC, IR 사례, PMF 사례, 업종별 벤치마크)
- Anthropic Contextual Retrieval (임베딩 + BM25 + rank fusion, 67% 검색 실패율 감소)
- 답변 citation 표시

### ⏸ 검토 후 보류된 아이디어

**IR덱 만들기 기능** (2026-04-24 논의, 보류 결정):
- 아이디어: 지원사업 도우미처럼 Pro 전용으로, Claude가 HTML/React 슬라이드 생성 → PDF/PPTX 내보내기
- 기술적 구현 가능: Claude API + 브라우저 렌더링(`html2pdf`, `pptxgenjs`)으로 4~5일 개발 규모
- **보류 이유**:
  1. 경쟁 서비스 레드오션 (Gamma.app, Tome, Beautiful.ai, Pitch AI, Canva Magic Design). "또 하나의 AI 슬라이드 생성기"로 포지셔닝 시 차별화 약함
  2. Route01만의 차별점(한국 VC 문법·멘토 관점·정부지원사업 연계)은 **Phase 3 KB 구축 이후에만** 실제로 가능
  3. 현재 우선순위가 더 높은 항목(로그인·결제·약관 등 베타 전제조건) 위에 있음
  4. Claude는 텍스트 생성은 강하지만 "디자인" 측면의 슬라이드 품질은 전문 툴 대비 열세 가능
- **재검토 시점**: Phase 3 KB 구축 후 + Pro 베타 사용자 피드백에서 "IR덱도 만들어주세요" 요청 빈도 확인 후. 빠르면 v1.3쯤
- **대안으로 고려 가능**: "IR덱 구조 + 콘텐츠 초안" 텍스트 기능 (슬라이드 생성 대신 10장 구조 + 각 슬라이드 들어갈 내용 텍스트로). 반나절 구현, 저위험. 사용자가 Gamma/Keynote에서 직접 만들어 씀. v1.x 중간에 검토 가능

---

## 27. 세션 시작 체크리스트 + 사용자 선호

### 체크리스트
1. 이 CONTEXT.md 읽기 (특히 직전 세션 작업 로그)
2. `git log --oneline -15`으로 최근 커밋 확인
3. **DESIGN.md 읽기** — UI 관련 작업 전 필수. Apple/Claude 원칙 기반 디자인 시스템 정본
4. "알려진 이슈"와 "로드맵" 블록 재확인
5. 사용자 지시 대기 (또는 로드맵 최우선 작업 제안)
6. **한국어로 응답, `ask_user_input` 버튼 비선호**

### 사용자 선호·설정
- Chrome "창 닫으면 사이트 데이터 삭제" OFF + `[*.]route01.kr` 쿠키 예외 추가됨
- 품질 향상 시 가격 인상 의향 있음 (Opus 라우팅 OK)
- 정식 오픈 전 Supabase 백엔드 도입 필요
- Apple 스타일, warm-neutral 팔레트 (DESIGN.md 참조), 이모지·장식 아이콘 금지
- 로컬 preview 파일 만들지 말 것 — 바로 push해서 route01.kr로 확인
- 롤백 포인트 사전 준비 선호 (큰 리팩터 전 태그 생성)

### 롤백 앵커 (원격에 존재하는 태그)
- `pre-apple-style-refresh` (`c05b6d9`) — 2026-04-23 Apple 리팩터 이전
- `pre-design-refactor-v2` (`93edd2d` 바로 전) — 2026-04-24 warm-neutral 디자인 리팩터 이전
- 개별 커밋 revert로 세부 롤백 가능

---

## 28. 2026-04-24 세션 작업 로그 (11커밋)

### A. 오전: Phase 2-A 복잡도 기반 라우팅 (`a48a275`)
- 5명 멘토를 FREE(PG·Thiel) / PRO(Chesky·Huang·Naval) tier로 구분 (`MENTOR_META.free`)
- `pickModel(ctx)` 헬퍼: FREE 멘토 → 항상 Sonnet 4.5 / PRO + 복잡질문(파일·키워드·200자+) → Opus 4.7
- 복잡도 키워드 20개: 분석/전략/시나리오/비교/계획/설계/구조/리서치/로드맵/경쟁/포지셔닝/피보팅/IR/투자유치/사업계획/밸류에이션/차별화/플랫폼/생태계/독점
- 메인 `doSend` 경로에만 적용, 지원사업 도우미·추천질문 생성은 Sonnet/Haiku 고정 유지
- `[route]` 콘솔 로그로 관측성 확보 (`[cache]` 로그와 함께)

### B. 1차 Apple 복원 시도 (`efa38e9` + `b030b9d` + `386de75`)
- `efa38e9`: 답변 번호 리스트 크림슨 마커 도입, H2 여백·두께 조정, 애플 톤 복원 1차
- `b030b9d`: 5명 멘토 `[금지]` 블록에 "지정된 H2 외 생성 금지" 조항 — 스크린샷에서 Naval이 "이번 주/이번 달/3개월 후" H2 만든 문제 대응
- `386de75`: 사이드바 "질문 기록" Apple Notes 톤 (헤더 자간·시간대 라벨·항목 호흡)

### C. 스트리밍 건너뛰기 결정 (커밋 없음, 대화 결정)
- 사용자 의향 확인: "B방식 스트리밍은 체감 변화 없음, Route01은 Cloudflare Pages + 클라이언트 직접 API라 서버 부담 개념 없음"
- 결론: Phase 1 Step 3 **SKIP**, Phase 2로 직행
- 백엔드 도입 시점에 A방식(화면에 토큰 순차) 재검토 예정 — 타임아웃 방지 + 체감 속도 + 동시접속 처리

### D. 오후: DESIGN.md 기반 전면 디자인 리팩터 (5커밋)

사용자가 awesome-design-md 레포 공유 → Apple/Claude/Notion 공식 디자인 시스템 문서 분석 → Route01 전용 DESIGN.md 작성.

**롤백 태그**: `pre-design-refactor-v2` 생성 (원격 푸시됨). `git reset --hard pre-design-refactor-v2` + force push로 전체 복구 가능.

1. **`e633f16`** docs: DESIGN.md 추가
   - 프로젝트 루트 `/DESIGN.md` — 322줄
   - 9개 섹션: Visual Theme / Color Palette / Typography / Components / Layout / Depth / Do's & Don'ts / Responsive / Export
   - **크림슨은 brand/interactive only 원칙 명문화** — "H2 좌측 막대 금지"
   - warm-neutral 팔레트 5단계 정의
   - 세션 간 일관성 규칙 10단계 명문화

2. **`5a5f4c6`** style(tokens): `:root` warm-neutral 전환
   - bg L3 `#dfdfe4` → `#e8e6dc` Warm Sand
   - bg L2 `#e8e8ec` → `#f2f0ea`
   - bg L4 `#d4d4da` → `#ddd9cd` warm taupe
   - nav glass rgba(0,0,0,.8) → rgba(20,20,19,.8) warm near-black
   - ink2 `#424245` → `#3d3d3a` (Claude Dark Warm)
   - ink3 `#6e6e73` → `#5e5d59` (Olive Gray)
   - **신규 `--ink4` `#87867f`** Stone Gray (ul 마커용)
   - border `#d2d2d7` → `#e5e2d7` / `#c7c7cc` → `#d1cdbf`
   - 신규 `--ring-crimson` 포커스 halo

3. **`dd2ee32`** style(answer): `.report-bubble` typography-only 위계
   - H2 크림슨 좌측 막대 **완전 제거**
   - H2 크기 21→24px, weight 700→600
   - H3 색 shift `var(--ink2)` #3d3d3a
   - H1 크기 23→24px, weight 800→700
   - 본문 15→15.5px
   - 볼드-only 단락 border-bottom 제거 (두 줄 artifact 해결)
   - 표 짝수행 `#f4f4f6` 쿨핑크 → `#fbf9f3` 웜크림
   - 블록쿼트 `#f7f8fb` → `#f7f6ef` 웜 parchment

4. **`336dc02`** style(export): DOCX/PDF 동기화
   - `EXPORT_DOC_STYLES` + `htmlStyle` 배열 양쪽 웜톤·H2 막대 제거 적용
   - Word change-bar 방어 규칙에 h2도 포함 (막대 없으니 더 이상 예외 안 둠)

5. **`93edd2d`** style(ui): 주변 UI 쿨톤 청소
   - 15개 hover border `#86868b` → `var(--border2)` 일괄 sed 교체
   - `.m-bubble` 표·블록쿼트 웜톤 동기화
   - **치명적 발견**: late `!important` override 블록이 앞선 변경을 덮어쓰고 있었음. 표·블록쿼트도 여기서 강제 통일
   - `.ob-btn.pri`/`.modal-btn.pri`의 `#86868b` bg는 **의도된 neutral gray 버튼**이라 보존

### E. H2 밑줄 재발견 + 완전 제거 (`60eaac5`)

사용자 스크린샷 추가 확인 → "오늘부터 10년" H2 밑에 가로선 발견.

- 원인: `.report-bubble h2`가 3곳에 중복 정의됨 (795 / 2288 / 2809)
- 2288: `border-bottom:1px solid var(--border)` (중복, 그러나 non-important)
- 2809: `border-bottom:2px solid var(--brand-main) !important` — **이게 진짜 범인**
- 2288 블록 삭제, 2809 블록을 DESIGN.md 사양(24px/600/no border)으로 업데이트
- `dd2ee32`의 795줄 변경이 실제로는 late cascade에 가려져 일부만 적용되고 있었음이 드러남

### F. 수평선(`---`) 금지 (`34f38bf`)

스크린샷 비교: 3장 중 1장만 가로선 존재 → 모델이 랜덤하게 `---` 넣는 게 원인.

- 프롬프트: 5명 멘토 `[금지]` + buildSys 공통 블록 모두에 "`---` `***` `___` 사용 금지" 조항 추가
- CSS: `.report-bubble hr`, `.m-bubble hr`, `EXPORT_DOC_STYLES hr`, `htmlStyle hr` 2곳 모두 `display:none !important`
- 이중 방어 (프롬프트 근본 해결 + CSS 안전망)
- 중복 `.m-bubble hr` 정의 제거

### G. CONTEXT.md 업데이트 (`41ba9f4`)

오늘 11커밋 전체 정리 + 알려진 이슈/로드맵 최신화 + DESIGN.md 참조 안내 추가

### H. Phase 2-B PDF 캐싱 + 업로드 관찰 로그 (`ccc0611`)

**결정 경위**: 사용자와 RAG 설계 논의 중 중요한 사실 발견 — Anthropic Files API는 **매 호출마다 PDF 전체가 context window에 로드**되어 토큰 비용 절감 효과 없음 (업로드 대역폭만 절약). **실제로 비용을 줄이는 건 prompt caching**. 또한 사용자 PDF 사용 패턴을 모르는 상태에서 full RAG 파이프라인은 과잉 투자라는 판단.

**최소 변경·최대 이득 선택**:
- `buildUserContent`의 채팅 첨부 PDF 블록에 `cache_control: {type:'ephemeral'}` 한 줄 추가 → 같은 PDF로 5분 내 추가 질문 시 **PDF 토큰 90% 할인**
- 온보딩 PDF(`uploadedDocs`)는 제외 — 1회만 주입되어 캐싱 이득 없음
- 텍스트·이미지 첨부는 현재 정책에선 캐싱 안 붙임 (작아서 이득 미미)

**관찰 장치**:
- `readFile()`에 `[pdf] upload` 콘솔 로그 — 파일명·크기(KB)·추정 토큰·캐싱 여부
- 기존 `[cache]` 로그와 결합하면 cache hit 실제 작동 확인 가능:
  - 첫 질문: `[cache] {write: 87000, read: 0}`
  - 2번째: `[cache] {write: 0, read: 87000}` ← 캐시 히트 = 90% 할인

**사용자 UX**: 완전 동일. 업로드 방식·답변 품질·응답 시간 체감 변화 없음.

**검증 계획**: 사용자 판단 — **클로즈 베타에서 실제 데이터 수집 후 판단**. 정식 오픈 전까지는 관찰 로그만 쌓아두고, 베타 사용자 확보 후:
- 긴 PDF(100K+ 토큰) 빈도 → 본격 RAG 필요 여부 판단
- 같은 PDF 재질문 패턴 → 캐싱 이득 실측
- 거의 안 쓰임 → Phase 2-B 여기서 종료

### I. URL 정리 — `nachim_v3.html` → `index.html`

**문제**: 사용자가 `route01.kr` 방문하면 주소창이 `route01.kr/nachim_v3.html`로 바뀌어 내부 개발 코드명이 외부에 노출됨. 기존 구조는 `index.html` meta refresh와 `_redirects`가 서로 싸우는 엉킨 상태였음.

**원인 분석**:
- 기존 `index.html`: JS + meta refresh로 `./nachim_v3.html`로 이동 (URL 변경 발생)
- 기존 `_redirects`: `/nachim_v3.html → / 301` + `/ → /nachim_v3.html 200` — 모순되는 두 규칙
- Cloudflare Pages는 정작 `nachim_v3.html` → `nachim_v3` 자동 리다이렉트까지 수행. 상태 엉킴

**해결책 선택 과정**:
- Cloudflare 공식 문서 확인: `/*  /nachim_v3.html  200` 규칙은 `nachim_v3.html → nachim_v3.html` 루프로 인해 "Infinite loop detected" 경고 발생 위험
- Cloudflare Pages는 루트에 `index.html`이 있으면 자동으로 `/`에서 서빙함
- **가장 정석**: 파일명 자체를 `index.html`로 바꾸기 → Cloudflare 기본 동작이 URL을 `/`로 유지

**실행**:
- `git mv nachim_v3.html index.html` (히스토리 보존)
- 기존 리다이렉트 `index.html` 제거
- `_redirects`를 하위 호환만 남김: `/nachim_v3.html → / 301`, `/nachim_v3 → / 301`
- CSS/JS 파일명(`nachim_v3.css`/`.js`)은 **변경 안 함** — 내부 참조 그대로 유지, 외부 노출 없음
- CONTEXT.md 파일 트리 + 배포 설명 업데이트

**결과**:
- `route01.kr/` → `index.html` 자동 서빙, URL은 `/`로 유지 ✅
- `route01.kr/nachim_v3.html` (옛 링크) → 301로 `/`로 영구 리다이렉트 ✅
- `route01.kr/nachim_v3` (Cloudflare 자동 확장자 제거된 형태) → 301로 `/`로 ✅
- 주소창에 깔끔하게 `route01.kr`만 표시

---

## 29. 2026-04-24 끝난 시점의 핵심 팩트 (다음 세션용)

- **DESIGN.md가 프로젝트 루트에 존재** — UI 작업 전 반드시 읽기
- **warm-neutral 팔레트 확정**: L1 #fff / L2 #f2f0ea / L3 #e8e6dc / L4 #ddd9cd / L5 rgba(20,20,19,.8)
- **크림슨 `#8B1A1A` = 브랜드 only**: 표 헤더, 번호 마커, 로고, PRO tier, 포커스 링, CTA. **섹션 장식 금지**
- **H2 위계는 typography + whitespace 단독** (크기 24px, weight 600, margin 3.5rem/1rem, **no border**)
- **H3 색 shift** `var(--ink2)` #3d3d3a로 H2와 차별화
- **수평선 `---` 금지** — 프롬프트·CSS 양쪽
- **메인 앱 파일**: `index.html` (2026-04-24 이전엔 `nachim_v3.html`). CSS·JS는 파일명 유지 (`nachim_v3.css`/`.js`)
- **URL 정책**: `route01.kr/` 루트만 사용자에게 보임. 옛 `/nachim_v3.html` 링크는 `/`로 301 리다이렉트
- **Phase 2-A 라우팅 작동 중** — FREE 멘토 Sonnet, PRO + 복잡 질문 Opus 4.7
- **Phase 2-B PDF 캐싱 적용** — 채팅 첨부 PDF `cache_control: ephemeral`. 5분 TTL 내 재질문 시 PDF 토큰 90% 할인. 관찰 로그 `[pdf]` + `[cache]`로 확인. 본격 RAG 여부는 클로즈 베타 데이터로 판단.
---

## 30. 2026-04-24 오후~저녁 세션 작업 로그 (추가 20+ 커밋)

오전 세션에서 Apple 리팩터·Phase 2-A·2-B 끝낸 후, 오후부터 UX 세부 폴리시·요금제 구조 정리·툴팁 시스템·디자인 미세 조정이 이어짐. 총 **50+ 커밋/1일 기록**.

### A. URL 정리 (`2f7ef06`)
- `nachim_v3.html` → `index.html` 리네임. Cloudflare Pages가 `/`에서 자동 서빙
- 옛 `/nachim_v3.html`·`/nachim_v3` URL은 `_redirects`로 301 하위호환
- CSS/JS 파일명 `nachim_v3.*`는 유지 (외부 노출 없음)

### B. 온보딩 필수 라벨 재디자인 (`0e8b0e3`)
- 네이비 풀 배지 9.5px → **붉은 점(●) + 크림슨 텍스트 11px**
- Apple form-asterisk 톤. 폼 덩어리감 제거 + 필수 신호 명확

### C. 지원사업 도우미 Opus 4.7 라우팅 (`89c4328`)
- PRO 전용 기능(`checkGrantAccess`) 성격에 맞게 Sonnet → Opus
- 긴 공고문·양식 이해 + 수십 페이지 초안 생성에 Opus 품질 필수
- pickModel 우회, 항상 Opus 고정

### D. 요금제 2-tier 통합 (`98e9e26` + 후속 `5786c35`·`40ed4d1`·`22922d9`)
- **Starter 폐지 → Pro 19,900원 단일화**. Team은 v2.0으로 연기
- isPaid 체크 3곳 `'starter' || 'pro' || 'team'` → `'pro'` 단일 조건
- Pro features 재정리: 양 → 질 → 멘토 → 기능 순서
  1. 무제한 질문 / 2. 더 깊이 있는 답변 품질 / 3. 전체 멘토 5명 / 4. 지원사업 도우미 / 5. PDF 업로드 / 6. DOCX/PDF 내보내기
- Free features에서 "도메인별 기본 자문" 제거 (Pro도 당연히 됨 → 오해 소지)
- "우선 응답" → "더 깊이 있는 답변 품질" (구현 안 된 약속 제거, 진짜 가치 명시)
- Pro highlight 색 #F26522 오렌지 → `var(--brand-main)` 크림슨 (DESIGN.md 일관성)
- 요금제 모달 전면 재디자인: 인라인 스타일 전부 CSS 클래스로, 현재 플랜 크림슨 반전, "인기" → "추천", ✓ 크림슨 체크마커

### E. IR덱 기능 보류 문서화 (`03a5ca7`)
- 논의 후 보류 결정 → CONTEXT.md §26에 "⏸ 검토 후 보류" 섹션 신설
- 재검토 시점: Phase 3 KB 후 + Pro 베타 피드백. v1.3+

### F. 헤더 플랜 pill 시스템 (`8844e7c` + 후속 `c6ce2a7`·`00af291`)
- 헤더에 FREE/PRO 배지 pill 추가 (홈 버튼 오른쪽, 마이페이지 왼쪽)
- 클릭 시 openPricingModal 열림
- **디자인 변천 3단계** (사용자 피드백으로 계속 조정):
  1. 흰 배경 + 네이비 텍스트 + `↑` 크림슨 화살표 (너무 튐)
  2. 밝은 sky-navy outline, 화살표 제거 (색이 브랜드랑 안 맞음)
  3. **네이비 솔리드 (최종)**: FREE `var(--brand-point)` 솔리드 + 흰 글씨 / PRO `var(--brand-main)` 솔리드 + 흰 글씨 → **두 티어 대칭 구조**
- syncHeaderPlanPill() 헬퍼로 플랜 변경 시 라벨·색 자동 동기화
- 배지 라벨은 대문자(FREE/PRO), 문장 속에서는 카멜케이스(Free/Pro) 규칙 정립

### G. 프로필 pill 설정 아이콘 (`aa9793f`)
- 헤더 상단 회사명 pill 앞에 Feather Icons settings 톱니바퀴 SVG
- "클릭 가능" 어포던스 명확화 + 홈 아이콘·마이페이지 아이콘과 시각적 일관성

### H. 커스텀 툴팁 시스템 (`51f4763` + 후속 `eb4e848`·`55b7595`·`89cb11f`·`13e2d7a`)
- **r01-tooltip** — 멘토 전환 토스트와 동일 디자인 언어:
  - Ink `#1d1d1f` 배경 + 흰 글씨 12px/500
  - 10px radius, cubic-bezier(.34,1.56,.64,1) 바운스
  - 8px 회전 사각형 화살표, 150ms 딜레이
- `[data-tip]` 속성 + JS IIFE가 document 캡처로 이벤트 처리
- getBoundingClientRect 기반 위치, 뷰포트 경계 자동 클램프, 상단 전환 지원
- `data-tip-align="left"` 옵션으로 넓은 컨테이너(로고) 좌측 정렬
- 적용 범위: 헤더 pill 7개 + 로고 + 사이드바 접기/열기 2개 + 좌하단 배지 2개
- **버그 수정 4건**:
  - title과 r01-tooltip 중복 표시 → hover 중 title을 data-tip-title로 이동
  - 로고 내부 자식 이동 시 다중 툴팁 → relatedTarget 같은 parent 검사로 skip
  - e.target이 Element 아닐 때 `closest is not a function` TypeError → nodeType 1 가드
  - 넓은 컨테이너 중앙 정렬 위치 이상 → data-tip-align='left' 지원 추가

### I. 스크롤바 전역 통일 (`e4f1591`)
- 평상시 투명, hover 시 rgba(0,0,0,0.22) 얇은 8px 썸 페이드인
- Chrome/Safari/Edge (webkit) + Firefox 둘 다 대응
- 2px 투명 border + background-clip:padding-box로 macOS 스크롤바 톤
- `.ob-card` 기존 전용 규칙 제거 → 전역에 위임 (일관성)
- 썸 hover 시 rgba(0,0,0,0.35)로 진해짐 (드래그 피드백)

### J. 사이드바 폭 확장 (`b931d08`)
- 데스크탑 240px → 272px (한국어 긴 질문 제목이 2줄로 말리던 문제 해결)
- 모바일(≤900px)은 240px 유지 (좁은 화면 희생 방지)

### K. 온보딩 슬로건 위계 뒤집기 + (N초) 제거 (`dd179a1`)
- `AI Startup Advisory`(크고 굵음) / `Finding your Route...`(작고 얇음) → **뒤집기**
- Finding 줄이 메인 브랜드 약속으로 부각, AI Startup Advisory는 카테고리 라벨
- Step 1·2·3 서브 문구의 "(30초)" / "(20초)" ETA 캐주얼 전부 제거 (Apple 톤과 안 맞음)

### L. 사이드바 배지 각자 스텝으로 (`b4e2f83` + `e865cc0`)
- "사업 요약" 배지 → 온보딩 Step 1 (기본 동작)
- "핵심 고민" 배지 → **온보딩 Step 2 직행** (editProfile(2) 인자 추가)
- **hydrateOnboardingFromOb 숨은 버그 발견**: 폼 채우기 함수가 step=1로 강제 리셋하고 있어서 editProfile(2)가 무시됨
- **해결**: `hydrateOnboardingFromOb(opts)` — `opts.keepStep: true` 플래그로 선택적 리셋 스킵. editProfile에서 이 옵션 전달
- 부수 버그 수정: 기존 `['sec1','sec2']` 토글 루프가 sec3 빠뜨려서 Step 3 잔존 가능 → 3 섹션 전부 통일

### M. 홈 버튼 둥근 사각형 (`ea4be54`)
- `.hb-icon-only` border-radius 완전 원형 → 10px 둥근 사각형
- 30x30 사각 버튼에 자연스러운 비율 (iOS 앱 아이콘 톤)
- 텍스트 pill들은 기존 알약 모양 유지

### N. 로그인 히어로 카피 굵기 강화 (`f482978`)
- "Finding your Route from Zero to One" weight 900 + **text-stroke 0.5px currentColor**
- 크기 clamp(26~44) → clamp(30~50) 소폭 증가
- 폰트 교체 없이 SF Pro 그대로 두고 시각 굵기만 증폭
- 모바일은 stroke 0.3px로 완화 (26px 고정 크기에서 뭉침 방지)
- CSS 두 곳 중복 정의 동일 값으로 통일 (기술 부채 일부 정리)

### O. 카피 일관성 정리 (`d30a7b1`)
- 배지는 대문자(`FREE`/`PRO`) 유지 — 짧은 상태 라벨에 적합
- 문장 속은 카멜케이스(`Free`/`Pro`)로 통일 — 긴 문맥에서 소리 지르는 느낌 제거
- 4곳 정리: 온보딩 안내 / 플랜 pill 초기 툴팁 / Free features / syncHeaderPlanPill 툴팁

---

## 31. 다음 세션 최우선 — 백엔드 + 로그인·유료화 통합 (방향 A 확정)

사용자 2026-04-24 세션 마무리 시 결정: **이 작업부터 시작한다**.

### 현재의 근본 블로커
- **API 키가 클라이언트에 노출**되어 있음
- 이대로 오픈하면 누구나 DevTools로 키 추출 → 무단 사용 가능
- 유료 서비스 불가능, 실제 오픈 전 반드시 해결

### 이 작업이 한꺼번에 해결하는 것들
- #1 이메일/PW 로그인 + 이메일 인증
- #1 네이버·카카오 소셜 로그인
- #4 약관·개인정보처리방침 (유료 서비스 기준)
- #11 토스페이먼츠/포트원 결제 연동
- #12 마이페이지 (PW 변경·탈퇴·요금제 관리)
- PROTOTYPE_MODE 실제 해제 → 진짜 유료화 게이트 작동
- 스트리밍 A방식 재검토 (백엔드 경유 시 타임아웃 방지용)

### 기술 선택 후보 (다음 세션 초반 논의)
- **Supabase** — 인증·DB·Edge Functions·결제 웹훅 통합. 한국어 문서·레퍼런스 많음. 제 1순위 추천
- Node(Express/Hono) + Vercel — 세밀한 제어, 복잡도 ↑
- 조합형 (Clerk Auth + Neon DB + Vercel Functions) — 고려 가능

### 예상 규모
집중 **1주~10일** 작업. 인증·약관·결제·마이페이지 한 번에 끝내는 덩어리.

### 시작 전 결정 필요 사항
1. Supabase vs 다른 스택
2. 결제 공급자 토스페이먼츠 vs 포트원 vs 둘 다 지원
3. 이메일 인증 방식 (Supabase 기본 / 별도 SMTP)
4. 약관·개인정보처리방침 초안 (템플릿 생성 후 법무 검토)
5. API 키 관리 전략 (Supabase Edge Function에서 Anthropic API 프록시)

---

## 32. 2026-04-25 새 세션 시작 체크리스트 (내일용)

**다음 세션 시작 시 순서대로**:

1. **CONTEXT.md 읽기** — 특히 §30 (이번 세션 로그), §31 (방향 A 최우선 결정), §29 (핵심 팩트)
2. **DESIGN.md 읽기** — UI 건드릴 일 있을 때만, 하지만 항상 업데이트 상태 유지
3. `git log --oneline -20` — 이번 세션 마지막 커밋 확인
4. **방향 A 본격 시작**:
   - Supabase vs 다른 스택 결정
   - 아키텍처 스케치 (사용자 요청 흐름: 브라우저 → 백엔드 → Anthropic API)
   - 단계별 로드맵 쪼개기 (인증 → 유료화 → 결제 → 마이페이지)
5. 사용자 지시 대기

### 주의할 사항
- **이 작업은 큰 덩어리** — 한 세션에 다 못 끝냄. 마일스톤 쪼개고 단계별 검증
- **기존 PROTOTYPE_MODE 로직 다 있음** — 이미 `isPaid`, `checkGrantAccess`, `pickMentorOrUpgrade` 등 게이트 함수들 존재. 백엔드 붙일 때 이 진입점들로 바꿔 끼우기만 하면 됨
- **프론트 UI는 준비됨** — 요금제 모달, 마이페이지 모달, 결제 안내 alert 다 존재. 백엔드 연결만 남음
- 사용자 선호: ask_user_input_v0 버튼 비선호, 한국어 응답, 큰 결정엔 확인 후 진행

---

## 33. 2026-04-27 세션 — 멘토 프롬프트 자유화 (방향 A 시작 전 우선 처리)

### 배경 — 사용자 직감
사용자가 "멘토 스타일별 답변 양식 강제 때문에 자문 품질이 떨어지는지 걱정"을 제기. A/B 비교를 통해 검증 결정.

### A/B 비교 (PMF 질문, Peter Thiel + Naval, 사용자가 직접 두 버전 답변 받아 docx로 제출)

**A 버전 (현재 사이트 — 형식 강제)**
- 구조 깨끗, 4섹션 정돈
- **결정적 발견**: A의 Thiel과 A의 Naval이 거의 같은 콘텐츠 (NRR/Churn 표·Sean Ellis 40%·"4가지 불편한 질문"·ICP+Facebook 하버드 사례 모두 일치). 섹션 이름만 다르고 알맹이는 수렴
- 형식 강제가 모델을 "이 형식 안에 들어갈 가장 안전한 PMF 콘텐츠"를 채우는 모드로 몰아넣어 멘토 정체성을 약화시키고 있었음

**B 버전 (Claude.ai — 사고 순서 기반 자유화)**
- Thiel B: "고객 5명에게 가격 3배 통보 → 반응이 답"이라는 contrarian 가격 권력 실험
- Naval B: push vs pull 이분법, retention 곡선·환불 사유·고객 hack의 3가지 행동 신호, "100명에게 그저 그런 것보다 10명이 미친 듯이 사랑하는 게 PMF에 더 가깝다"
- 두 멘토가 명백히 다른 답을 함. 공통 콘텐츠 거의 없음
- 답변 깊이·contrarian 통찰·멘토 정체성 차별화 모두 우세

**결론**: §28-B의 "Naval이 시간축 H2 만든 문제 → 강제 H2 외 생성 금지"는 잘못된 방향이었음. 모델이 형식을 깨던 게 버그가 아니라 더 나은 구조를 시도하던 신호였음. 형식 강제로 답변 깊이가 깎이고 멘토 정체성이 수렴하고 있었음.

### 적용한 변경 (5명 멘토 전체 자유화)

**롤백 태그**: `pre-mentor-freedom` (2026-04-27 직전 상태) — 원격 푸시됨. `git reset --hard pre-mentor-freedom` + force push로 전체 복구 가능.

**MENTOR_STYLES 5명 전면 재작성** (`nachim_v3.js` 807~)
- `[답변 포맷 — 엄수]` → `[사고 순서]` + `[형식 가이드 — 권장이지 강제가 아님]` 두 블록으로 분리
- `[사고 순서]`: 멘토 머릿속 흐름 5단계 명시 (예: Thiel은 "전제 의심 → 진짜 질문 추출 → 독점 관점 답 → 근본 재설계 방향 → contrarian 액션")
- `[형식 가이드]`: 권장 패턴만 제시. H2 개수·이름은 모델이 질문에 맞게 자유롭게 결정
- `[금지]` 블록에서 형식 강제 규칙 전부 제거 ("위 [답변 포맷]에 명시된 4개 H2 외 만들지 말 것" 류)
- 톤·어휘·인용 사례·도메인별 접근은 유지 강화 (멘토 정체성 보호)
- `---` 금지는 유지 (가독성 이슈는 별개)

**buildSys 본체 정리** (`nachim_v3.js` 2640~)
- "제목(헤딩) 규칙 — 매우 중요" → "제목(헤딩) 규칙 — 가독성 보호용 최소 규칙"으로 톤 약화
- H1 오프닝 조건을 "당신의 멘토 포맷이 H1을 허용하는 경우" → "결론·격언·핵심 단언으로 박을 때"로 일반화
- "하위 섹션" 예시에서 멘토별 강제 사례 (Thiel 독점 설계, PG 에세이) 제거 — 일반 원칙만 남김
- "[멘토 스타일 적용 규칙 — 마지막 확인]" 블록 재작성: H2 강제 중복 규칙·시간축 H2 금지 모두 삭제. 사고 순서·정체성·금지만 명시

**유지된 가독성 보호 규칙** (이건 형식 강제와 다름)
- 섹션 제목 20자 이내 명사구
- 섹션 제목 끝에 마침표·물음표·느낌표 금지
- 문장을 H2로 박지 말 것
- 같은 섹션 제목 중복 금지
- 수평선 `---` `***` `___` 금지

### 변경 분량
- `nachim_v3.js`: +143 / -157 (순감 14줄)
- 문서: 형식 강제 표현 모두 제거, 사고 순서·자유 가이드는 더 풍부

### 다음 세션 시작 시 해야 할 검증
1. **사용자가 같은 3개 질문(전략형/실무형/모호형)으로 5명 멘토 답변 받아보고 체감 확인**
2. 특히 비교: 자유화 후에도 멘토 정체성이 유지되는가? Thiel은 Thiel답고 Naval은 Naval답고 두 답변이 겹치지 않는가?
3. 답변 길이가 너무 길어지는 멘토 있는지 (사용자 "품질 우선 — 길이 무제한" 지시했으나 실측 필요)
4. 우려 시 갈래 1(부분 완화)로 후퇴 가능 — `git revert` 또는 `pre-mentor-freedom` 태그로

### 그 후 — 방향 A 본격 시작
이 자유화 검증 끝나면 §31 방향 A(백엔드 + 로그인·유료화 통합) 본격 시작. 사용자가 결정해야 할 사항:
1. 백엔드 스택 (Supabase 유력)
2. 결제 공급자 (토스페이먼츠 유력)
3. 무료 사용자 일일 질문 제한 숫자 (5/일? 10/일?)


---

## 34. 2026-04-27 후속 — PRO 멘토 Opus 라우팅 + 정체성 강제

### 자유화(§33) 후 1차 검증 결과

사용자가 같은 PMF 질문을 Peter Thiel·Naval Ravikant 두 멘토에게 던져 docx로 가져옴. 분석 결과:

**좋은 점**
- 새 자유화 프롬프트 정상 적용됨 (콘솔에서 `MENTOR_STYLES['Peter Thiel...'].includes('사고 순서')` → `true` 확인)
- 두 멘토에게 다른 시스템 프롬프트 정상 전달됨
- 멘토별 약한 정체성은 표출됨 (Naval=pull/당기는 힘 프레임, Thiel=Facebook 하버드+contrarian)

**문제점**
- 본문 약 70%가 글자 단위로 동일 (NRR 표 5행, "Sean Ellis 테스트", "고통의 깊이", "돈을 먼저 받아라", "딱 10개 기업" 등)
- 시그니처 어휘 사용 거의 0개 (Thiel: monopoly·secrets·10배·Zero to One·PayPal 미등장 / Naval: leverage·specific knowledge·복리·long-term game·Almanack 미등장)
- 두 답변 모두 "표준 PMF 답변" 안전지대로 수렴

### 진단 — 자유화 자체 문제 아님, 모델 한계

콘솔 `[route]` 로그에서 두 답변 모두 `model: 'claude-sonnet-4-6'` 확인.

가설: A/B 테스트 때 Claude.ai에서 본 강한 멘토 차별화는 Opus 효과였음. Sonnet은 같은 자유화 프롬프트로도 표준답에 수렴. 멘토 자유화 ≠ 멘토 차별화.

### 적용한 변경 (`6e95e17` 이후 추가)

**롤백 태그**: `pre-identity-enforcement` (2026-04-27 자유화 직후, 정체성 강제 직전 상태)

**A. PRO 멘토 항상 Opus 라우팅** (`pickModel`)
- 이전: PRO 멘토 + 복잡 질문(파일/200자+/키워드) → Opus, 단순 질문 → Sonnet
- 변경: PRO 멘토 → 항상 Opus (복잡도 체크 우회)
- 이유: PRO의 가치 약속 = "더 깊이 있고 차별화된 답변"이 Sonnet 라우팅 시 작동 안 함
- FREE 멘토(PG·Thiel)는 Sonnet 유지 (비용·속도 우선)
- `[route]` 로그 reason: `pro_mentor_simple` → `pro_mentor_always_opus`

**B. 정체성 강제 블록 추가** (`buildSys` 끝)
시스템 프롬프트 마지막에 `[정체성 강제 — 답변 검수 시 반드시 확인]` 4개 체크 추가:
1. 시그니처 어휘 3개 이상 (멘토별 [어휘·프레임]에서 발췌, 예시 명시)
2. 시그니처 사례 1개 이상 (멘토별 [자주 인용하는 사례]에서 발췌, 예시 명시)
3. 표준 답변 안전지대 회피 ("Sean Ellis 테스트", "MVP 빨리", "Build-Measure-Learn" 같은 일반론 회피)
4. 다른 멘토 답변과의 차별화 자기 검증

이건 자유화(§33)의 "[사고 순서]"와 보완 관계. 사고 순서가 머릿속 흐름이라면, 정체성 강제는 출력 검수.

**C. 캐시 버스터 v2** (`index.html`)
- `?v=20260427-mentor-freedom` → `?v=20260427-mentor-freedom-v2`
- §33 자유화에서 본 캐시 문제 재발 방지

### 비용 영향
- 이전: PRO 멘토 단순 질문은 Sonnet → 짧은 인사·간단 질문도 Opus로 가게 됨
- 영향: 클로즈 베타 단계라 비용 증가 미미. 정식 오픈 시 무료 사용자 게이트(예상 5~10/일 질문 제한)로 통제

### 다음 검증
- 같은 PMF 질문을 Thiel·Naval 두 PRO 멘토로 재테스트
- 콘솔 `[route]` 로그에서 `model: 'claude-opus-4-...'` 확인
- 답변이 진짜로 다른지: 시그니처 어휘 등장, 시그니처 사례 인용, 본문 공통 비율 < 50%
- 미달 시 추가 정체성 강제 또는 멘토 프롬프트 본문 강화


---

## 35. 2026-04-27 §34 검증 결과 + tier 기반 라우팅 (방향 A 사전 정합성 확보)

### §34 검증 결과 (성공)

사용자가 모호형 질문("지금 만들고 있는 서비스가 진짜 시장이 원하는 건지 확신이 없습니다. 계속 가야 할지 피보팅해야 할지...")으로 Naval(Opus)·Peter Thiel(Sonnet) 두 멘토 답변 받음.

콘솔 로그 확인:
- Naval: `model: 'claude-opus-4-7', tier: 'pro', reason: 'pro_mentor_always_opus'`
- Thiel: `model: 'claude-sonnet-4-6', tier: 'free', reason: 'free_mentor_always_sonnet'`

정량 분석:
| 지표 | Naval (Opus) | Thiel (Sonnet) |
|---|---|---|
| 시그니처 어휘 사용 | 26회 (10종) | 22회 (9종) |
| 시그니처 사례 인용 | AngelList·Venture Hacks·Twitter | Facebook 하버드·Palantir CIA |
| 타 멘토 어휘 침범 | 0회 | 0회 |
| 본문 공통도 | 거의 0% (질문 맥락만 공유) | |

**Naval 답변**: "Pull인가, Push인가" H1 → pull/push 이분법으로 답변 전체 관통 → "내가 AngelList를 만들 때 Venture Hacks 블로그 글이었다" 본인 사례 직접 인용 → "Play long-term games with long-term people" 격언으로 마무리. 진짜 Naval.

**Thiel 답변**: "당신이 묻는 건 PMF가 아니라 secrets다" H1 → 'secret' 7회/'독점' 3회/'10배' 4회/'indefinite thinking' 등장 → Facebook 하버드 + Palantir CIA 사례 인용 → "가장 contrarian한 한 수: 잠재 고객 5명에게 전화해서 '월 50만 원 낼 의향이 있냐' 물어라"로 마무리. 진짜 Thiel.

**결론**: §33 자유화 + §34 PRO Opus 라우팅 + 정체성 강제 4개 체크 조합이 정답. 자유화 챕터 종결.

### §35 — Tier 기반 라우팅 + 유료화 정책 정합성

**문제 인식**: §34 검증 후 사용자가 정합성 모순 지적 — "Pro 사용자가 PG·Thiel 선택 시에도 Opus가 맞지 않나?" Pro의 가치 약속("더 깊은 답변")이 멘토에 따라 작동/비작동하면 일관성 없음.

**결정 (2026-04-27)**:
- Free 사용자: PG·Thiel 2명만 선택 가능, **Sonnet** 모델
- Pro 사용자: 5명 모두 선택 가능, **Opus** 모델
- Free 일일 한도: **5건/일** (백엔드 카운터로 구현, 이번 세션 미포함)
- Pro 일일 한도: 무제한 표기. 실제론 50/일 또는 분당 rate limit (백엔드 작업 시 결정)
- 가격: 19,900원/월 유지 (시장 검증 후 조정)

**적용한 코드 변경 (`pre-tier-routing` 태그 직후)**

A. `pickModel` user tier 기반 리팩터
- 이전 (§34): 멘토 카테고리(free:true/false)로 모델 결정
- 현재: `getCurrentPlan()` 결과로 모델 결정. 멘토 카테고리는 "어떤 사용자가 선택 가능한가"의 의미만
- `[route]` 로그: `tier`/`reason`/`complex` 제거, `plan`만 표시
- 코드 단순화 (43줄 → 33줄)

B. PROTOTYPE_MODE 우회 5곳 정리
- 멘토 선택 모달: 우회 제거 → 무료 사용자가 Pro 멘토 클릭 시 결제 안내
- 온보딩 멘토 선택: 우회 제거
- 지원사업 도우미: 우회 제거 → Pro 전용
- 파일(PDF) 업로드: 우회 제거 → Pro 전용
- 잔존: doSend 안의 월 한도 체크 PROTOTYPE_MODE (백엔드 카운터 미구현 단계라 유지)

C. selectPlan에 PROTOTYPE_MODE 결제 시뮬레이션 추가
- 결제 백엔드 없는 단계에서 Pro 라우팅(Opus) 검증할 수 있도록
- 헤더 FREE pill 클릭 → 요금제 모달 → "업그레이드" → confirm() → 즉시 plan='pro' 전환
- 해제: PRO pill 클릭 → "Free로 변경"
- 주석: `/* PROTOTYPE_MODE: 결제 백엔드가 아직 없는 단계... 실제 결제는 토스페이먼츠 SDK 호출로 교체 */`

D. R01_PLANS 정책 정정
- Free `limit: 10` (월 단위) → `limit: 5, limitUnit: 'day'` (일 단위)
- Free features에 "Claude Sonnet 모델" 명시
- Pro features에 "Claude Opus 모델 (더 깊이 있는 답변)" 명시
- 멘토 라인업 명시 (PG·Thiel 2명 / 5명 전체)

E. 캐시 버스터 v3
- `?v=20260427-mentor-freedom-v2` → `?v=20260427-tier-routing-v3`

**롤백 태그**: `pre-tier-routing` (정책 변경 직전)

### 다음 세션 — 방향 A 본격 시작 직전 결정 항목

1. **백엔드 스택**: Supabase 추천 (인증·DB·Edge Function 통합)
2. **결제 공급자**: 토스페이먼츠 추천 (한국·구독·SDK)
3. **Pro 일일 한도 결정**: 50/일 하드 캡 vs 분당 rate limit
4. **§13 차별화 (한국 스타트업 KB)**: 별도 설계 문서(`KB.md`) 작성 시점

### 검증 (다음 세션 전 사용자 확인 필요)

1. 무료 상태에서 멘토 선택 모달 → Naval/Chesky/Huang 클릭 시 결제 안내 모달
2. 헤더 FREE pill 클릭 → 요금제 모달 → 업그레이드 → confirm → PRO 전환 → 헤더 pill PRO로 변경
3. PRO 상태에서 5명 멘토 모두 선택 가능
4. PRO 상태에서 답변 받기 → 콘솔 `[route] {model: 'claude-opus-...', plan: 'pro', ...}` 확인
5. 헤더 PRO pill 클릭 → "Free로 변경" → plan 다시 free
6. Free 상태에서 답변 받기 → 콘솔 `[route] {model: 'claude-sonnet-...', plan: 'free', ...}` 확인


---

## 36. 2026-04-27 §35 검증 결과 + H1 오프닝 패턴 명시

### §35 검증 결과 (라우팅 정상, 본문 차별화 정상, H1 오프닝만 수렴)

사용자가 PMF 질문으로 4개 시나리오 검증:
1. Naval Pro → `claude-opus-4-7, plan: pro` ✓
2. Paul Graham Pro → `claude-opus-4-7, plan: pro` ✓ (핵심 검증 — Pro 사용자가 PG 선택해도 Opus)
3. Peter Thiel Pro → `claude-opus-4-7, plan: pro` ✓
4. Paul Graham Free → `claude-sonnet-4-6, plan: free` ✓

**라우팅 정책 완벽하게 작동**.

### 발견 — H1 오프닝 패턴이 5명 모두 수렴

4개 답변 첫 문장:
- Naval Pro: "PMF는 측정하는 게 아니라 느끼는 것이다."
- Paul Pro: "PMF는 검증하는 게 아니라, 느끼는 거다."
- Thiel Pro: "PMF는 측정하는 게 아니다. 설계하는 것이다."
- Paul Free: "PMF는 측정하는 게 아니라 느끼는 것이다."

본문은 멘토별로 차별화 잘됨 (각자 시그니처 어휘·사례 사용). H1 오프닝만 정형 패턴으로 수렴.

### 원인 진단

1. **프롬프트의 "반직관적·통념을 뒤집는 한 줄" 강조**가 5명에게 동일하게 작용
2. PMF + 통념 뒤집기 = Marc Andreessen "felt, not measured" 변형이 가장 매력적인 LLM 출력
3. 결과: 본문은 갈라지지만 첫 문장은 같은 안전지대로 수렴

### 적용 변경

**롤백 태그**: `pre-opening-patterns`

A. **5명 멘토 각각에 [오프닝 패턴 — 시그니처] 블록 추가**
- **Paul Graham**: 명령형 단언 / 창업자 본능 정정 / 시간 단위 직설 / YC 패턴 인용. 추천: "Don't ~" 영문 한 줄
- **Peter Thiel**: 질문 재정의 / 전제 도전 / 소크라테스 질문 / Zero to One 7가지 질문. 추천: "당신이 묻는 건 X가 아니라 Y다"
- **Brian Chesky**: 시나리오 직진입 / 감정·경험 단언 / 11성급 환기 / 디자인 단언. 추천: "Imagine your user..."
- **Jensen Huang**: 시간 축 직진입 / plateau→탈출 / Pain 재해석 / 플랫폼 단언 / Impossible 한 줄. 추천: "30년 뒤..."
- **Naval**: 이분법 한 줄 / Twitter 격언 / 본질 질문 / 레버리지 단언. 추천: "Pull인가, Push인가" (이전 검증에서 작동)

B. **각 멘토에 명시적 H1 금지 패턴**
- "[X]는 [측정/검증]하는 게 아니라 [느끼는] 것이다" — Andreessen 인용형, 멘토 시그니처 아님
- "[질문 키워드]는 X가 아니라 Y다" — LLM 정형 출력
- 추상적 단언만 있고 멘토 색 없음

C. **buildSys 정체성 강제 5번 추가** — 위 두 정형 패턴 모두 회피하고 [오프닝 패턴 — 시그니처]에서 선택

D. **입력창 아래 안내 한 줄로 통합**
- 이전: `.disclaimer`(면책) + `.hint`(2줄: Enter 전송, PDF 첨부)
- 현재: `.disclaimer` 안에 `.disclaimer-main` + `.disclaimer-hint` flex 배치
- 모바일(640px 이하)에선 자연스럽게 줄바꿈

E. 캐시 버스터 v4: `?v=20260427-opening-patterns-v4`

### 다음 검증

같은 PMF 질문으로 5명 멘토 답변 받아서 H1 오프닝이 다 다른지 확인:
- Paul Graham → "Don't ~" 또는 시간 단위 명령
- Peter Thiel → "당신이 묻는 건 X가 아니라 Y다"
- Brian Chesky → "Imagine your user..."
- Jensen Huang → "30년 뒤..."
- Naval → 이분법 한 줄 또는 격언

검증 통과 시 자유화·정체성 강제 챕터 완전 종결. 다음 세션부터 §31 방향 A(백엔드 + 인증 + 유료화) 본격 시작.


---

## 37. 2026-04-27 §36 후속 — 언어 정책 (본문 한국어 강제)

### 발견

§36의 [오프닝 패턴 — 시그니처]가 차별화는 성공시켰으나, 부작용으로 본문에 영어가 침투. 사용자 보고: "고유명사를 제외하고 갑자기 영어가 많이 나오고 있다."

원인 — §36이 5명 중 3명에게 영문 한 줄을 시그니처로 명시했음:
- PG: "Don't [통념]. [반전 액션]." 영문 한 줄 — "가장 PG답다" 명시
- Chesky: "Imagine your user..." 시나리오 — "가장 Chesky답다" 명시
- Jensen: "Impossible is not a fact..." 영문 한 줄 패턴
- Naval: Twitter 격언형 — Naval 본인이 영문 트위터러라 끌림

→ 모델이 "영문이 시그니처답다"고 학습하면서 본문에도 영어를 섞기 시작. 한국어 사용자에게 가독성 악화.

### 사용자 결정 — 갈래 1 (영문 H1만 허용, 본문 한국어 강제)

H1 시그니처 영문 한 줄은 멘토 정체성에 기여하므로 유지. 본문은 한국어 강제. 영문 시그니처 어휘(monopoly, leverage 등)는 짧은 단어·구로만.

### 적용 변경

**롤백 태그**: `pre-language-policy`

A. **buildSys에 [언어 정책 — 한국어 답변 원칙] 블록 추가** (정체성 강제 직전)
   영어 사용 4가지만 허용:
   1. H1 시그니처 한 줄 (멘토 [오프닝 패턴]에 명시된 영문)
   2. 고유명사 (인명·회사명·기술 표준)
   3. 핵심 멘토 어휘 (monopoly, leverage, pull vs push, ramen profitability 등) — 짧은 단어·구만
   4. 짧은 인용 (한국어 해설 동반)

   금지:
   - 본문 영어 문장 길게 잇기 / 영어 문장 2개 이상 연속
   - 한영 혼용 ("이 product는 customer에게 value를 제공한다")
   - H2·H3 영어 섹션 제목
   - 표 셀 영어 문장

B. **정체성 강제 6번 추가** — 답변 후 언어 정책 자가 검수
   - H1 영문 OK
   - 본문 영어 문장 길이 점검
   - 일반 어휘 한영 혼용 점검
   - 시그니처 영문은 단어·짧은 구로만
   - H2·H3 한국어 명사구 확인

C. **5명 멘토 [오프닝 패턴] 추천 라인에 본문 한국어 명시 추가**
   - PG: 이미 "+ 한국어 본문" 명시되어 있어 변경 없음
   - Thiel: "H1 외 본문은 한국어로" 추가
   - Chesky: "H1의 영문 한 줄만 영어 OK, 본문은 한국어로"
   - Jensen: "H1에 영문 시그니처...쓰면 OK이지만, 본문은 한국어로"
   - Naval: "본문은 한국어로, 영어 핵심 어휘는 단어·짧은 구로만"

D. 캐시 버스터 v5: `?v=20260427-language-policy-v5`

### 검증

같은 PMF 질문(또는 다른 모호형 질문)으로 5명 답변 받기. 점검 포인트:
- H1 오프닝이 영문 시그니처여도 본문은 한국어인가
- "이 product는 customer에게 ~" 같은 한영 혼용 사라졌는가
- monopoly/leverage 같은 핵심 어휘는 짧은 단어로만 등장하는가 (영어 문장으로 길어지지 않음)
- H2·H3 섹션 제목이 한국어 명사구인가


---

## 38. 2026-04-27 내보내기 Pro 게이트 (정책 누락 보완)

### 발견

사용자 점검 — DOCX/PDF 내보내기는 R01_PLANS·CONTEXT 정책상 Pro 전용인데, 코드는 무료 사용자도 그대로 사용 가능. §35 PROTOTYPE_MODE 정리 시 다른 게이트(파일 업로드, 지원사업, 멘토 모달)는 정리됐으나 exportAnswer는 처음부터 PROTOTYPE_MODE 분기조차 없이 열려있어 정리 대상에서 누락.

### 사용자 결정

- 복사 버튼: 무료 OK (이미 그렇게 작동 중)
- 내보내기 버튼: 보이되 PRO 아이콘 표기, 클릭 시 결제 모달

### 적용 변경

**롤백 태그**: `pre-export-gate`

A. **renderAnswerActions — PRO 배지 표시 분기**
   - getCurrentPlan() 결과에 따라 무료 사용자에게는 내보내기 버튼에 `<span class="a-act-pro-badge">PRO</span>` 추가
   - 잠긴 톤 표시: `a-act--locked` 클래스 (opacity 0.78)
   - Pro 사용자에게는 배지·잠금 표시 없음 (정상)

B. **exportAnswer 진입부 Pro 게이트**
   - `getCurrentPlan() !== 'pro'` 면 결제 안내 모달 → 요금제 모달 유도
   - 모달 메시지: "DOCX·PDF 내보내기는 Pro 플랜에서 이용할 수 있어요. 무료 플랜에서는 복사 버튼으로 답변을 옮길 수 있습니다."
   - 다른 Pro 게이트(파일 업로드, 지원사업)와 같은 UX 패턴

C. **refreshAnswerActionsForPlan 헬퍼 추가**
   - plan 변경 시 기존 답변 카드의 액션 영역을 다시 렌더링 (PRO 배지가 즉시 반영)
   - selectPlan에서 free → pro / pro → free 전환 시 호출

D. **CSS — `.a-act-pro-badge` + `.a-act--locked`**
   - 배지: 9.5px / 700 / 흰색 반투명 배경 / 둥근 알약 / 골드 버튼 안 자연스럽게 박힘
   - 잠금: opacity 0.78 → hover 0.92 (살짝 눌린 톤)

E. 캐시 버스터 v6: `?v=20260427-export-gate-v6`

### 검증

1. 무료 상태 답변 받기 → 답변 카드 우하단 "내보내기 (DOCX) PRO" / "내보내기 (PDF) PRO" 배지 보임
2. 무료 상태에서 내보내기 클릭 → "📄 Pro 전용 기능" 모달 → "요금제 보기" 버튼
3. Pro 전환 → 답변 카드 PRO 배지 즉시 사라짐 → 내보내기 정상 작동
4. Pro → Free 복귀 → 답변 카드 PRO 배지 다시 표시

### 정책 일관성 확인

이제 모든 Pro 전용 기능에 일관된 게이트:
- 멘토 선택 모달 (Pro 멘토 3명) ✓
- 온보딩 멘토 선택 (pickMentorOrUpgrade) ✓
- 지원사업 도우미 (checkGrantAccess) ✓
- PDF 업로드 (checkUploadAccess) ✓
- DOCX/PDF 내보내기 (exportAnswer) ✓ ← 이번에 추가

남은 미구현: doSend 일일 5건 카운터 (백엔드 작업 시 구현 — §31 방향 A)


---

## 39. 2026-04-27 멘토-plan 정합성 안전망

### 발견 — 게이트 우회 시나리오

사용자 검증 중 발견: Free 사용자가 Jensen Huang(Pro 전용 멘토)으로 답변 받는 사례.
콘솔: `model: 'claude-sonnet-4-6', plan: 'free', mentor: 'Jensen Huang (NVIDIA)'`

재현 경로: Pro 토글 → Jensen 선택 → Free로 복귀 → 멘토 설정이 그대로 유지

§35 정책: Free는 PG·Thiel만 선택 가능. 게이트는 "선택 시점"에만 있고 plan 변경 시 멘토 정합성 검증이 없어 우회 가능.

### 적용 변경

**롤백 태그**: `pre-mentor-plan-sync`

A. **`ensureMentorPlanSync(opts)` 헬퍼 추가** (syncHeaderPlanPill 직후)
   - getCurrentPlan() === 'free'인데 profile.style이 Pro 멘토면 → Paul Graham으로 자동 리셋
   - localStorage vd_profile 갱신 + applyProfile() 호출 → UI 즉시 반영
   - opts.silent === false면 토스트 안내: "Free 플랜에서는 [멘토] 사용 불가 — Paul Graham으로 변경됐어요"
   - 반환값: `{changed, oldMentor, newMentor}`

B. **3곳에서 호출 — 다층 안전망**
   1. **부팅 시** (DOMContentLoaded 끝부분, syncHeaderPlanPill 직후): `silent:true`. 이전 세션 잔존 상태 정리
   2. **selectPlan free 변경 시**: alert 메시지에 멘토 변경 사실 포함 (toast 대신 alert로 통합)
   3. **doSend 진입부** (안전망): `silent:false`. 어떤 경로로든 정합성 깨졌으면 송신 직전에 잡고 토스트로 알림. 50ms 대기 후 송신해 시스템 프롬프트가 새 멘토로 재구성될 시간 확보

C. 캐시 버스터 v7: `?v=20260427-mentor-plan-sync-v7`

### 검증

1. **재현 시나리오 차단**:
   - 헤더 FREE → Pro 토글 → Jensen 선택 → Free 복귀 → alert에 "Paul Graham으로 자동 변경" 포함, 헤더 멘토 pill도 PG로
   - 송신 시 콘솔 `[route]`: `mentor: 'Paul Graham (YC)', plan: 'free', model: 'claude-sonnet-...'`

2. **부팅 시 자동 정리**:
   - 옛날 세션에서 Pro+Jensen 상태로 새로고침/재방문 → 헤더 즉시 PG로 표시 (토스트 없음, silent)

3. **Pro 사용자 영향 없음**:
   - Pro 상태에서 5명 멘토 모두 정상 작동, 정합성 검사 패스

### 정책 게이트 — 모든 진입점 점검 완료

| 진입점 | 게이트 | 안전망 |
|---|---|---|
| 멘토 모달 클릭 | meta.free 검사 | ensureMentorPlanSync (doSend) |
| 온보딩 멘토 picker | meta.free 검사 | 동일 |
| 지원사업 도우미 | plan 검사 | — |
| PDF 업로드 | plan 검사 | — |
| DOCX/PDF 내보내기 | plan 검사 | — |
| 답변 송신 (어떤 경로든) | — | ensureMentorPlanSync ✓ |
| 부팅 잔존 정리 | — | ensureMentorPlanSync ✓ |
| Pro → Free 변경 | — | ensureMentorPlanSync + alert ✓ |


---

## 40. 2026-04-27 Paywall UX 통일 — 모든 Pro 게이트 1단계 직행

### 배경
사용자가 §38 내보내기 게이트 검증 중 지적: "안내 창이 하나 더 뜨는데 바로 요금제 안내로 가는게 낫지 않을까?" 전수 점검 결과 5곳 중 4곳이 2단계(안내 모달 → 요금제 모달), 1곳(멘토 변경 모달)만 1단계로 일관성 깨짐.

### 적용 변경

**롤백 태그**: `pre-paywall-unification`

4곳 모두 안내 모달 제거 → `openPricingModal()` 직행:

| 진입점 | 함수 | 라인 |
|---|---|---|
| DOCX/PDF 내보내기 | `exportAnswer` | 4344 |
| 지원사업 도우미 | `checkGrantAccess` | 5757 |
| 온보딩 멘토 picker | `pickMentorOrUpgrade` | 6258 |
| PDF 업로드 | `checkUploadAccess` | 6271 |

각 함수에서 무료 사용자 분기를 다음 한 줄로 단순화:
```js
try{ openPricingModal(); }catch(_){}
return;
```

### 통일된 UX 패턴
**모든 Pro 게이트**: 시각적 표시(PRO 배지·잠금 아이콘·Pro 멘토 잠금 카드) → 클릭 → 요금제 모달.
사용자는 진입점에서 이미 Pro 기능임을 인지한 상태이므로 안내 모달은 잉여 마찰.

### 코드 영향
- 4개 안내 모달 코드 블록 제거 (~80줄 감소)
- 일관성 확보 — 어디서 막히든 같은 흐름
- 결제 모달까지 1클릭 단축

### 캐시 버스터 v8
`?v=20260427-paywall-unification-v8`


---

## 41. 2026-04-27 PDF 업로드 게이트 누수 차단 (다층 안전망)

### 발견 — 게이트 누수 3가지 진입점

사용자 점검 — "Free 사용자가 입력창의 📎 클릭하면 그냥 첨부됨?"
전수 조사 결과 4개 진입점 중 1곳만 게이트 있고 3곳 누수:

| 진입점 | 게이트 상태 |
|---|---|
| 온보딩 PDF 박스(커다란 드롭존) | ✅ `checkUploadAccess()` |
| 웰컴 화면 📎 버튼 | ❌ `document.getElementById('ws-file-input').click()` 직호출 |
| 채팅 화면 📎 버튼 | ❌ `document.getElementById('chat-file-input').click()` 직호출 |
| 파일 선택 핸들러(`chatFileSelect`/`obFileSelect`) | ❌ plan 검사 없음 |
| `doSend` 송신 직전 | ❌ 첨부 파일 plan 검사 없음 |

→ Free 사용자가 PDF 첨부해서 송신 가능. Anthropic API로 PDF 토큰까지 그대로 전송. Pro 게이트 무력화.

### 적용 변경 (§39 멘토 동기화와 동일한 다층 패턴)

**롤백 태그**: `pre-pdf-gate-layers`

A. **1차 게이트 — 📎 버튼 onclick** (`index.html`)
   - 웰컴 화면(line 596): `checkUploadAccess('ws-file-input')`
   - 채팅 화면(line 639): `checkUploadAccess('chat-file-input')`

B. **`checkUploadAccess(inputId)` 확장**
   - 인자로 input id 받아 해당 input의 `.click()` 호출
   - 인자 생략 시 'ob-file-input' 폴백 (호환성)

C. **2차 게이트 — 핸들러 진입부**
   - `obFileSelect`: 진입 시 plan 검사. 무료면 요금제 모달 + return
   - `chatFileSelect`: 동일
   - 드래그앤드롭(`obDrop`)·다른 우회 경로 모두 차단

D. **3차 게이트 — `doSend` 송신 직전 안전망**
   - `chatPendingFiles` + `uploadedDocs` 둘 다 검사
   - 무료인데 첨부 있으면 → 비우고 + `renderChatFiles`/`renderObFiles` UI 갱신 + 요금제 모달 + return

E. 캐시 버스터 v9: `?v=20260427-pdf-gate-layers-v9`

### 통일된 Pro 게이트 구조 (§39 + §41)

| 진입점 | 1차 (UI 클릭) | 2차 (핸들러) | 3차 (doSend) |
|---|---|---|---|
| 멘토 선택 | meta.free 검사 | — | ensureMentorPlanSync ✓ |
| PDF 업로드 | `checkUploadAccess()` ✓ | `obFileSelect`/`chatFileSelect` plan 검사 ✓ | `chatPendingFiles`+`uploadedDocs` 검사 ✓ |
| 지원사업 도우미 | `checkGrantAccess()` plan 검사 → 요금제 모달 | — | — |
| 내보내기 | `exportAnswer` plan 검사 → 요금제 모달 | — | — |

### 검증

1. Free 상태에서 입력창 📎 클릭 → 요금제 모달 즉시 (파일 다이얼로그 안 열림)
2. 온보딩 박스 클릭 → 요금제 모달 (이미 작동 중)
3. (이론적 우회) 콘솔에서 `chatFileSelect([fakeFile])` 직호출 → 요금제 모달 + 첨부 안됨
4. (3차 안전망) 콘솔에서 `chatPendingFiles.push({...})` → 입력 후 송신 → doSend가 잡아서 비우고 요금제 모달

### 잔존 사항

PDF 정책 자체는 §24-I에서 결정 완료:
- 접근: Pro 전용
- 토큰 효율: prompt caching (90% 할인)
- Full RAG: 클로즈 베타 데이터로 판단

