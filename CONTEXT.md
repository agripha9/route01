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


---

## 42. 2026-04-27 PDF 첨부 버튼 PRO 코너 닷지

### 발견

§38에서 내보내기 버튼에는 PRO 배지가 있는데 PDF 첨부 버튼(웰컴·채팅 두 곳)엔 없어 일관성 깨짐. 사용자가 일관성 지적.

### 해결 — 코너 닷지 패턴

내보내기 버튼은 텍스트형이라 옆에 `<span>PRO</span>` 인라인 배지를 박았지만 PDF 첨부 버튼은 작은 아이콘 버튼이라 인라인 공간 없음. **우상단 코너에 작은 PRO 닷지** 패턴으로 처리.

### 적용 변경

**롤백 태그**: `pre-pdf-pro-badge`

A. **HTML — 두 버튼에 PRO 닷지 자식 + `pdf-attach-btn` 클래스**
   - 웰컴 화면 📎: `<span class="pdf-pro-dot" aria-label="Pro 전용">PRO</span>` 추가
   - 채팅 화면 📎: 동일

B. **CSS — `.pdf-attach-btn` + `.pdf-pro-dot`**
   - `.pdf-attach-btn{position:relative;}` (닷지 absolute 기준점)
   - `.pdf-pro-dot`: 우상단 코너(top:-3px, right:-4px), 8.5px / 800 / 크림슨 배경 / 흰 글씨 / box-shadow로 버튼 배경과 분리
   - `.pdf-attach-btn.is-pro .pdf-pro-dot{display:none}` — Pro 사용자에겐 숨김

C. **JS — `refreshPdfAttachButtonsForPlan()` 헬퍼**
   - 모든 `.pdf-attach-btn` 요소에 plan에 따라 `is-pro` 클래스 토글
   - 호출 지점:
     - 부팅 시 (DOMContentLoaded 끝, 다른 plan 동기화와 함께)
     - selectPlan free 변경 시
     - selectPlan pro 변경 시

D. 캐시 버스터 v10: `?v=20260427-pdf-pro-badge-v10`

### 통일된 Pro 가시화 패턴

| 위치 | 표시 방식 |
|---|---|
| 답변 카드 [내보내기 (DOCX)] | 인라인 텍스트 배지 `<span>PRO</span>` |
| 답변 카드 [내보내기 (PDF)] | 동일 |
| 입력창 📎 PDF 첨부 (웰컴) | 우상단 코너 닷지 |
| 입력창 📎 PDF 첨부 (채팅) | 동일 |
| 멘토 모달 Pro 멘토 행 | 행 우측 PRO 배지 (기존) |
| 헤더 plan pill | FREE/PRO 색·라벨 |

전 진입점에서 사용자가 "이건 Pro 기능"임을 시각적으로 인지한 상태에서 클릭 → §40 통일된 1단계 요금제 모달.


---

## 43. 2026-04-27 세션 마무리 — 자유화·정체성·페이월 챕터 종결

### 오늘 세션 한 줄 요약
멘토 자유화 직후 발견된 차별화 부족 문제를 해결하고, Pro 가치 약속이 실제로 작동하도록 라우팅·정체성 강제·페이월 시스템을 통합 정비 완료. 다음 세션 출발선: 백엔드 통합(§31 방향 A).

### 오늘 커밋 11개 (시간순)

| # | 커밋 | 작업 | 롤백 태그 |
|---|---|---|---|
| 1 | c2cf3f9 | 멘토 자유화: 형식 강제 → 사고 순서로 전환 | pre-mentor-freedom |
| 2 | 6e95e17 | Cloudflare 캐시 버스터(?v=) + _headers | — |
| 3 | b2e96da | PRO 멘토 항상 Opus + 정체성 강제 4개 체크 | pre-identity-enforcement |
| 4 | 938be36 | user tier 기반 라우팅 + 유료화 정책 정합성 | pre-tier-routing |
| 5 | 2627aa8 | 멘토별 H1 오프닝 패턴 + 입력창 안내 1줄 | pre-opening-patterns |
| 6 | 45675e4 | 언어 정책 (본문 한국어, 영문 H1 시그니처만) | pre-language-policy |
| 7 | 78b52fb | DOCX/PDF 내보내기 Pro 게이트 + PRO 배지 | pre-export-gate |
| 8 | 42875a7 | 멘토-plan 정합성 다층 안전망 | pre-mentor-plan-sync |
| 9 | 8720147 | 모든 Pro 게이트 1단계 직행 (UX 통일) | pre-paywall-unification |
| 10 | 7a204fe | PDF 업로드 게이트 누수 3층 차단 | pre-pdf-gate-layers |
| 11 | 70578ff | PDF 첨부 버튼 PRO 코너 닷지 | pre-pdf-pro-badge |

### 캐시 버스터 진화
- 시작: (없음 — Cloudflare 빌드 캐시가 옛 코드 서빙하던 문제 발견)
- v2 (mentor-freedom-v2) → v3 (tier-routing-v3) → v4 (opening-patterns-v4) → v5 (language-policy-v5) → v6 (export-gate-v6) → v7 (mentor-plan-sync-v7) → v8 (paywall-unification-v8) → v9 (pdf-gate-layers-v9) → **v10 (pdf-pro-badge-v10) ← 현재**

### 핵심 진단·결정 요약

**문제 시작점**: 멘토 자유화 후 같은 PMF 질문에 5명 멘토 답변이 거의 동일하게 나오는 현상.

**진단 진화**:
1. 처음 가설: 자유화로 멘토 차별화가 자동 발생 → 실패. PMF 질문에 4명 모두 "PMF는 측정하는 게 아니라 느끼는 것이다" 변형으로 시작
2. 2단계 가설: Sonnet이 정체성 표출 약함 + 정체성 강제 부족 → PRO=Opus + 정체성 강제 4개 체크 적용
3. 3단계 발견: 본문은 차별화되는데 H1 오프닝이 수렴 → 멘토별 시그니처 오프닝 패턴 명시
4. 4단계 발견: 영문 시그니처가 본문 영어 침투 유발 → 언어 정책 (본문 한국어 강제)
5. 최종 검증: Claude.ai PG vs Route01 PG 비교 → 프로필 활용 2개 vs 20개, 시그니처 어휘 2.5배, 구체적 실행 가이드 — Pro 가치 명확히 입증

**유료화 정책 결정 (사용자 결정)**:
- Free: PG·Thiel 2명, Sonnet, 일 5건 (카운터 미구현)
- Pro: 5명 전체, Opus, 무제한 (실제론 백엔드 시 50/일 hard cap 또는 rate limit)
- 가격: 19,900원/월 (시장 검증 후 조정)
- 모델 라우팅 = user tier 기반 (멘토 카테고리는 "누가 선택 가능한가"만)

**Pro 게이트 통일 완료** (모든 진입점):
| 진입점 | 시각 표시 | 클릭 시 |
|---|---|---|
| 멘토 모달 Pro 행 | 행 우측 PRO 배지 | 요금제 모달 |
| 답변 카드 내보내기 | 인라인 PRO 텍스트 배지 | 요금제 모달 |
| 입력창 📎 PDF 첨부 (웰컴·채팅) | 우상단 코너 닷지 | 요금제 모달 |
| 온보딩 PDF 박스 | upload-zone--locked 톤 | 요금제 모달 |
| 지원사업 도우미 메뉴 | (UI 별도 표시 없음) | 요금제 모달 |

**다층 안전망 패턴 (멘토 + PDF 동일 구조)**:
- 1차: UI 클릭 시 게이트
- 2차: 핸들러 진입부 plan 검사
- 3차: doSend 송신 직전 안전망

### 검증 결과

**§42까지의 통합 검증 (사용자 docx 분석)**:

| 검증 항목 | 결과 |
|---|---|
| Free 사용자 라우팅 (Sonnet) | ✓ |
| Pro 사용자 라우팅 (Opus, 5명 모두) | ✓ |
| 멘토 정체성 표출 (Naval·Thiel 시그니처 22~26회) | ✓ |
| H1 오프닝 차별화 (멘토별 다른 패턴) | ✓ |
| 본문 한국어 + H1 영문 시그니처만 | ✓ (검증 답변 기준) |
| Pro 멘토 게이트 (Free 차단) | ✓ |
| 멘토-plan 동기화 (Pro→Free 시 멘토 리셋) | ✓ |
| 내보내기 Pro 게이트 + PRO 배지 | ✓ |
| PDF 업로드 다층 게이트 | ✓ (3층 안전망) |
| Pro 가치 입증 (Claude.ai vs Route01 비교) | ✓ (프로필 활용 10배, 구체성 3배) |

### 잔존 사항 (다음 세션 작업 대상)

**§31 방향 A — 백엔드 통합** (이번에 손 안 댄 영역):
1. **인증 시스템**: Supabase Auth (이메일/PW + 이메일 인증, 네이버·카카오 SNS)
2. **결제 연동**: 토스페이먼츠 SDK (Pro 구독 결제 → tier 업데이트)
3. **일일 5건 카운터**: 현재 doSend의 PROTOTYPE_MODE 월간 한도 코드를 Supabase 기반 일일 카운터로 교체
4. **Pro 일일 한도**: 50/일 hard cap 또는 분당 rate limit 결정
5. **마이페이지**: 비밀번호 변경 / 회원탈퇴 / 구독 관리 — UI는 있으나 백엔드 미연결
6. **약관·개인정보처리방침**: 유료 서비스 기준으로 재작성 필요

**Phase 3 — 한국 스타트업 KB 차별화** (별도 트랙):
- 한국 스타트업 지식 베이스 구축 (디스콰이엇·요즘IT·이프코프·DBR 등)
- Contextual retrieval 도입 시점 검토
- 답변 citation 시스템

### 다음 세션 시작 시 결정할 것

1. **백엔드 스택 최종 결정**: Supabase 추천 (인증·DB·Edge Function·Realtime 통합) vs 다른 옵션
2. **결제 공급자 최종 결정**: 토스페이먼츠 추천 (한국 표준·구독·SDK 성숙) vs 포트원
3. **Pro 일일 한도 숫자**: 50/일 hard cap vs 분당 rate limit
4. **인증 우선순위**: 이메일/PW 먼저 → SNS는 나중 vs 동시 작업
5. **§13 한국 KB 별도 설계 문서(`KB.md`) 작성 시점**: 백엔드 구축 후 vs 백엔드와 병행

### 다음 세션 시작 프로토콜
1. 레포 클론 → `CONTEXT.md` 먼저 읽기
2. `git log --oneline -15` 로 오늘 커밋 11개 확인
3. 위 5개 결정 항목 사용자에게 확인
4. 백엔드 스택 결정되면 즉시 실 구현 시작 (Supabase 프로젝트 생성·테이블 스키마·인증 흐름 코드부터)

### 알려진 이슈 (점검 미완)
1. DOCX 표 헤더 흰 줄 (§10 #1) — altChunk 한계, OOXML 직생성 필요. 보류
2. 숫자 리스트 들여쓰기 (§10 #2) — 일부 케이스 정렬 불일치. 우선순위 낮음
3. 표 화면/DOCX/PDF 높이 (§10 #3) — 11pt/1.62 동기화 했으나 실사용 검증 미완
4. 답변 화면 UI/UX 전반 점검 — Apple 스타일 적용은 완료, 추가 다듬기는 사용 데이터 보고 결정

### 보안 확인
- 토큰: fine-grained, 기한 내 유지 정책 (사용자 결정). 메모리·코드·CONTEXT에 저장 안 함 ✓
- API 키: 사용자 직접 입력 방식. 클라이언트 localStorage. 백엔드 도입 시 서버 측 키 관리로 전환 예정

## 44. 2026-04-29 Supabase 백엔드 통합 (방향 A 시작 — 세션 1)

### 오늘 세션 한 줄 요약
PROTOTYPE_MODE 가짜 인증·로컬 데이터에서 진짜 Supabase 백엔드로 전환. 인증·DB·데이터 격리·프로필 동기화 모두 작동. 사용자 입력 모든 프로필 필드가 답변 프롬프트로 흘러들어가는 차별화 핵심 회로 점검·복구.

### 오늘 커밋 9개 (시간순)
1. `6a9ca3d` feat(supabase): add JS client + DB schema migration (§44 Step 1)
2. `6798af6` feat(supabase): real auth — emailLogin/Signup via Supabase + session restore (§44 Step 2)
3. `04ff756` fix(cache): bump JS cache buster to v12 — Step 1·2 changes weren't taking effect
4. `85fa932` feat(supabase): data isolation + profile/plan sync (§44 Step 3)
5. `01e8e66` fix(supabase): correct profile field name mapping (§44 Step 3 fix)
6. `e7c9547` fix(modal): bump modal z-index above onboarding (3000 > 2500)
7. `03c6b49` refactor(supabase): drop unused profiles columns — YAGNI cleanup
8. `5e73bf0` feat(supabase+answer): wire all profile fields → DB → answer prompt
9. `84892df` fix(supabase): rename funding column to invest — match screen code

### Supabase 인프라 (운영)
- **Project URL**: `https://fbfvaqcahppwzhtmlhtn.supabase.co`
- **Region**: Northeast Asia (Seoul, ap-northeast-2)
- **Plan**: Free
- **Publishable key (브라우저)**: `sb_publishable_p4DC2MinPlyZwk4YIjATWg_Zl8OkS7I` — 공개 안전, RLS로 보호
- **Secret key**: 절대 클라이언트에 노출 금지. Edge Function 도입 시 환경변수로만 사용
- **Site URL**: `https://route01.kr`
- **Redirect URLs 화이트리스트**: `https://route01.kr/**` (운영). localhost 두 개도 등록되어 있는데 사용 안 하니 정리 가능

### DB 스키마 (정본은 supabase/001_initial_schema.sql)
3개 테이블 — auth.users(Supabase 관리)와 1:N 관계.
- **profiles**: 사용자 프로필 — startup_name, industry, sector(text[]), stage, target, team_size, worry, mrr, invest, mentor + created_at/updated_at
- **subscriptions**: 결제 상태 — plan('free'/'pro'), expires_at, provider, provider_sub_id
- **daily_usage**: 일일 사용량 카운터 — (user_id, usage_date) PK + question_count

신규 사용자 가입 시 `handle_new_user` 트리거가 자동으로 profiles·subscriptions row 생성 (id만, 나머지는 온보딩에서 채움).

### RLS 정책 (5개)
- profiles_select_own / profiles_insert_own / profiles_update_own — `auth.uid() = id`
- subscriptions_select_own — `auth.uid() = user_id` (INSERT/UPDATE는 의도적 차단, Edge Function에서 service_role로만)
- daily_usage_select_own — 같은 패턴

### 적용된 마이그레이션 4개
- `001_initial_schema.sql` — 정본 (3 tables + 5 RLS + handle_new_user trigger)
- `002_drop_unused_columns.sql` — mentor_style·nickname 삭제 (YAGNI)
- `003_add_profile_fields.sql` — target·sector(text[])·mrr·invest 추가
- `004_rename_funding_to_invest.sql` — 003에서 funding으로 만든 컬럼을 invest로 rename (화면 코드 정합)

001 정본은 002~004까지 모두 반영된 최종 스키마로 업데이트 완료.

### JS 측 변경 핵심
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` 상수 + `sb` 클라이언트 (라인 105~)
- `sbUserToAuthShape`, `sbProfileRowToLocal`, `localProfileToSbRow` — 컨버터
- `loadProfileFromSupabase`, `saveProfileToSupabase`, `loadPlanFromSupabase`, `hydrateUserStateFromSupabase` — Supabase ↔ localStorage 캐시 동기화
- `USER_SCOPED_LS_KEYS` + `clearUserScopedCache` — 사용자 변경 시 옛 사용자 데이터 누수 차단
- `setAuthed` — 사용자 변경 감지 후 캐시 클리어
- `startAfterLogin` — async로 변경, hydrate 후 hasProfile에 따라 launch/onboarding 분기
- `logout` — `sb.auth.signOut()` + 캐시 클리어
- `emailLogin`, `emailSignup`, `verifySignupCode`, `resendVerify`, `sendResetPw` — 모두 Supabase API 호출로 교체
- `handleAuthCallback` — 부팅 시 Supabase 세션 자동 복원 + URL 토큰 정리
- `buildSys` (line 882~) — 답변 프롬프트에 9개 프로필 필드 모두 반영 (industry/sector/stage/target/team/mrr/invest/name/concern)
- `openModal` — 프로필 모달에 sector/target/invest 표시 추가

### 검증 결과 (수동)
- ✅ 신규 가입 → 인증 메일 발송 → 링크 클릭 → 자동 로그인 (또는 토큰 만료 시 로그인 화면 폴백)
- ✅ 옛 사용자 데이터 누수 0 (사이드바 깨끗, 프로필 빈 상태로 시작)
- ✅ 온보딩 완료 시 profiles 테이블에 모든 필드 정확히 매핑되어 저장
- ✅ subscriptions에 plan='free' 자동 생성
- ✅ 재로그인 시 모든 필드 복원 — 데이터 손실 0
- ✅ 가격 모달 z-index 정상 (3000 > onboarding 2500)
- ✅ Auth0 Google 로그인 그대로 작동 (영향 없음)

### 캐시 버스터 진화 (오늘)
- v11 → v12 (Step 1·2 — JS 캐시 버스터 빠뜨려서 변경 반영 안 됨, 큰 시간 손실. **JS·CSS 둘 다 매번 올리는 운영 규칙 메모리 추가**)
- v12 → v13 (Step 3 데이터 격리)
- v13 → v14 (필드명 매핑 fix)
- v14 → v15 (모달 z-index)
- v15 → v16 (YAGNI cleanup)
- v16 → v17 (4개 필드 추가)
- v17 → v18 (funding → invest rename)

### 진단·결정 요약
- 백엔드 스택: Supabase 채택 — 한국어 자료, 네이버/카카오 OAuth 호환, 비용 구조 모두 우위
- 인증 방식: 이메일/PW 먼저 (오늘) → SNS는 세션 4 (네이버/카카오 비즈 등록 필요)
- Pro 한도: 분당 5건 + 일 100건 hard cap 하이브리드 (결제 도입 시 적용)
- 데이터 격리 전략: 사용자별 키 분리(옵션 A) 대신 사용자 변경 시 캐시 클리어(옵션 B). Supabase가 진실의 원천이므로 캐시는 다음 로그인에 자동 복원
- YAGNI 적용 한계: "모든 입력 필드는 답변 품질에 기여해야 한다"는 Route01 차별화 원칙이 우선. 안 쓰는 필드는 빼는 게 아니라 빠진 와이어링을 복구해야 함

### 발견된 보안 구멍 — 다음 세션 결정 필요
- **PROTOTYPE_MODE** (line 6604): 헤더 PRO/FREE pill → 가격 모달 → confirm 한 번이면 localStorage `r01_plan`이 'pro'로 바뀜. 결제 없이 Pro 흉내 가능. 세션 3 토스페이먼츠 연동 시 정리 또는 dev 모드 제한 결정 필요

### 메일 상태 (다음 세션 우선순위)
- ❌ 인증 메일 스팸함 직행 (도착률·전환율 큰 영향)
- ❌ 영문 그대로 ("Confirm your signup")
- ❌ 발신자가 `noreply@mail.app.supabase.io` (Supabase 공유 도메인)
- ❌ 브랜드 0 (로고·색·서명 없음)
- 해결 방법: 자체 도메인 SMTP (SendGrid/Resend) + DNS 설정 + Email Templates HTML 작성

### 자동화 유보 결정
컨버터 round-trip 단위 테스트 (옵션 A)는 다음 세션 시작에 5분 작업으로 추가 예정. 이메일 인증 포함 E2E는 OAuth·결제 안정화 이후 검토.

### 다음 세션 우선순위
1. **메일 디자인** (스팸 차단 + 한국어화 + 브랜딩) — 도착률 직결, 가입 전환율의 첫 관문
2. **컨버터 round-trip 단위 테스트** (회귀 방지)
3. **PROTOTYPE_MODE 보안 결정** — 그대로 유지 vs dev 모드 제한 vs 완전 차단
4. **세션 2 본 작업**: 일일 카운터 작동 + 마이페이지 백엔드 연결 + Anthropic API Edge Function (서버 측 호출, 사용자 자기 키 입력 폐지)
5. **세션 3**: 토스페이먼츠 실 연동 + 약관·개인정보처리방침 결제 조항
6. **세션 4**: Auth0 → Supabase Google 마이그레이션 + 네이버·카카오 OAuth

### 다음 세션 시작 시 결정할 것
- 메일 트랙 어디까지 (자체 SMTP까지 vs Supabase 템플릿만 한국어화)
- 컨버터 단위 테스트 위치 (vendor/test.html vs 별도 npm 스크립트)
- PROTOTYPE_MODE 처리 방향

### 다음 세션 시작 프로토콜
1. 레포 클론 → CONTEXT.md 먼저 읽기 → `git log --oneline -10`
2. Supabase 대시보드 확인 (Authentication → Users / Table Editor → profiles 상태)
3. 캐시 버스터 v18부터 시작, 변경 시 v19로 (JS·CSS 둘 다)

### 알려진 이슈 (이번 세션 발생)
1. 인증 메일 스팸함 직행 — 다음 세션 1순위
2. 토큰 만료 시 (1시간 이상 지난 메일) 로그인 화면 폴백 — 정상 동작이지만 UX 매끄럽지 않음
3. 컬럼 순서가 production DB에서는 created_at·updated_at이 중간에 끼어있음 (cosmetic only, 신규 환경에선 정본 001대로 깔끔하게 생성됨)

### 보안 확인
- Publishable key: 공개 안전 (RLS 정책으로 본인 데이터만 read/write 가능, 검증 완료)
- Secret key: 알려주지 않음, 코드·CONTEXT·메모리 어디에도 저장 안 함 ✓
- DB password: 사용자가 1Password 등 안전한 곳에 보관 (Claude 모름) ✓
- GitHub 토큰: 메모리 정책상 저장 안 함, 매 세션 한 번만 받아 그 세션 안에서만 재사용 ✓
- localStorage 토큰: Supabase JWT는 자동 만료·갱신, autoRefreshToken=true 설정 ✓

## 45. 2026-04-29 메일 인프라 — Resend SMTP + 한국어 템플릿 + Cloudflare Email Routing

### 이번 세션 한 줄 요약
§44 마지막 우선순위 1번 "메일 디자인" 완전 해결 — Route01이 처음으로 운영 가능한 양방향 이메일 인프라(발송 + 수신)를 갖춤.

### 결정 — 옵션 B 선택
세션 시작 시 결정한 메일 트랙: **옵션 B (자체 도메인 SMTP)**.
이유: §44에서 명시했듯 인증 메일 도착률은 가입 전환의 첫 관문. 옵션 A(Supabase 템플릿만 한국어화)는 발신자 `noreply@mail.app.supabase.io` 공유 도메인 그대로 쓰는 거라 스팸 직행 문제가 남음. 근본 해결 위해 옵션 B로.

### 발송 인프라 — Resend 도입
**Resend** (resend.com) 선택. 무료 플랜 월 3,000건 / 일 100건 — Route01 초기 규모 충분.

설정 단계:
1. Resend 가입 → Domain 추가 → `route01.kr` (Tokyo region, ap-northeast-1)
2. Cloudflare Auto configure로 DNS 레코드 자동 추가 (one-time authorization, 권한 영구 X):
   - MX `send.route01.kr` → `feedback-smtp.ap-northeast-1.amazonses.com` (priority 10)
   - TXT `send.route01.kr` → `v=spf1 include:amazonses.com ~all` (SPF)
   - TXT `resend._domainkey.route01.kr` → DKIM 공개키
3. DNS 전파 6분 만에 verified ✅
4. API 키 발급: name `Supabase SMTP`, permission `Sending access`, domain `route01.kr`
5. Supabase Dashboard → Authentication → Emails → SMTP Settings:
   - Sender email: `noreply@route01.kr`, Sender name: `Route01`
   - Host: `smtp.resend.com`, Port: `465`
   - Username: `resend` (고정값, 이메일 X), Password: Resend API 키
   - Minimum interval: 60s

**검증**: 가입 테스트(`agripha+test1@gmail.com`) → 첫 시도부터 받은편지함 도착, 발신자 `Route01 <noreply@route01.kr>` 정상 표시.

### 한국어 + 브랜딩 템플릿 (HTML)
파일 위치: `supabase/email-templates/`
- `01_confirm_signup.html` — 가입 인증 (네이비 CTA)
- `02_reset_password.html` — 비밀번호 재설정 (크림슨 CTA, 가입과 시각적 구분)
- `README.md` — 적용 가이드 + Subject 라인

디자인 사양:
- 헤더 네이비 `#1a3a6e` 3줄: `Route01` (26px bold) → `AI Startup Advisory` (14px medium) → `Finding your Route from Zero to One` (12px italic, 옅음)
- 본문 흰 배경 카드, 600px 폭, table 기반 (Outlook 호환), inline CSS only
- 본문 15px / line-height 1.62, Pretendard / SF Pro 폴백 (DESIGN.md 준수)
- 폴백 링크는 인라인 텍스트 한 줄: "버튼이 보이지 않으시나요? **여기를 클릭**해주세요." (긴 URL 노출 X — 메일 환경 JS 차단으로 복사 기능 불가능, 실효성 없는 URL 텍스트는 시각적 노이즈만 됨)
- 보안 안내 회색 박스: "이 링크는 1시간 동안만 유효합니다."
- 푸터에 `hello@route01.kr` 문의처 (Cloudflare Email Routing으로 수신 가능, 아래 참조)
- Subject 한국어:
  - Confirm signup: "Route01 가입을 위해 이메일을 인증해주세요"
  - Reset password: "Route01 비밀번호 재설정 안내"

변수: `{{ .ConfirmationURL }}` 한 줄만 사용. `nachim_v3.js`의 `handleAuthCallback`(line 446)이 URL hash의 `access_token`/`type=signup`/`type=recovery` 자동 감지해 세션 생성 + URL 정리 — 별도 인증 페이지 불필요. 버튼 클릭 = 인증 + 로그인 + 메인 화면 진입까지 한 번에.

### 수신 인프라 — Cloudflare Email Routing
`hello@route01.kr` 살리기 위해 도입 (메일 푸터에 문의처로 노출되는데 수신 못 하면 사용자 답장 바운스).

설정:
1. Cloudflare Dashboard → route01.kr → Email → Email Routing → Get started
2. Custom address: `hello` → Destination: `agripha@gmail.com`
3. Add records and enable — Cloudflare가 자동으로 다음 레코드 추가:
   - MX `route01.kr` → `route1/2/3.mx.cloudflare.net` (priority 17/57/79)
   - TXT `route01.kr` → `v=spf1 include:_spf.mx.cloudflare.net ~all` (루트 도메인 SPF)
   - TXT `cf2024-1._domainkey.route01.kr` → Cloudflare DKIM
4. 1~2분 후 Routing status: Active

**Resend MX와 충돌 없음**: Resend는 `send.route01.kr` 서브도메인, Cloudflare는 루트 도메인. 호스트가 달라서 공존. SPF·DKIM도 selector·서브도메인이 달라 충돌 X.

**검증**: Naver(agripha@nate.com)에서 hello@route01.kr로 "Test" 발송 → agripha@gmail.com 받은편지함 1분 내 도착 ✅.

(같은 계정 Gmail→Gmail 전달은 Gmail의 deduplication으로 안 보임. Cloudflare가 친절히 "Missing email" 안내 메일 보내줌 — 정상 동작이라는 신호.)

### 이번 세션 발견한 함정
**스팸 학습 메모리**: 첫 테스트 때 영문 기본 템플릿이 한 번 스팸으로 분류되면 Gmail이 "noreply@route01.kr → agripha@gmail.com" 조합을 학습함. 이후 한국어 템플릿으로 바꿔도 해당 사용자 계정에서는 스팸 처리될 수 있음. 해결: 스팸함의 메일 → "Report not spam" → 학습 다시. **이건 한 사용자(테스터)의 Gmail 계정에만 적용된 문제로, 신규 사용자에겐 영향 없음.**

### 4가지 메일 문제 (§44에서 식별) — 모두 해결
- ✅ 스팸함 직행 → 자체 도메인 + DKIM/SPF로 받은편지함 도착
- ✅ 영문 그대로 → 한국어 템플릿 적용
- ✅ 발신자 Supabase 공유 도메인 → `noreply@route01.kr` (도메인 verified)
- ✅ 브랜드 0 → Route01 헤더 3줄 + 디자인 토큰 준수

### 이번 세션 commits
- `c736da6` feat(email): Korean+brand templates for confirm signup / reset password
- `b197644` polish(email): header 3-line + cleaner fallback link

코드 변경은 0줄. 모두 `supabase/email-templates/` 아래 신규 파일(HTML 2개 + README) + Supabase Dashboard / Resend / Cloudflare 외부 콘솔 작업.

### 미작성 메일 템플릿 (다음 세션 또는 사용처 명확해질 때)
- Magic link
- Change email address  
- Reauthentication
- Invite user

기본 영문 템플릿 그대로 두면 작동은 함 — 단, 한국어 사용자에겐 어색. 우선순위 낮음 (현재 Route01 코드가 트리거하지 않는 흐름).

### 알려진 이슈 (이번 세션 발견)
1. **회원가입 모달 디자인 미정렬** — "또는 이메일로" 아래 한국어 안내 영역 + Auth0 설정 + 데모 체험 버튼이 Apple-style·DESIGN.md 토큰과 따로 놂. 다음 세션 작업 (스크린샷에 빨간 박스로 식별됨).
2. **데모 체험 버튼 잔재** — 회원가입 모달에 "🎮 데모 체험 (로그인 없이)" 버튼이 남아있음. Supabase 인증 정상 작동하는 지금은 더 이상 필요 없음. 다음 세션에 제거.

### 다음 세션 우선순위 (재정리)
§44에서 정한 우선순위에 이번 세션 발견한 항목 반영:

1. **회원가입 모달 디자인 정리 + 데모 체험 버튼 제거** (이번 세션 발견, UX 일관성)
2. **컨버터 round-trip 단위 테스트** (§44 유보 항목)
3. **PROTOTYPE_MODE 보안 결정** (§44 발견된 보안 구멍)
4. **세션 2 본 작업**: 일일 카운터 + 마이페이지 백엔드 + Anthropic API Edge Function (서버 측 호출)
5. **세션 3**: 토스페이먼츠 실 연동 + 약관·개인정보처리방침 결제 조항
6. **세션 4**: Auth0 → Supabase Google 마이그레이션 + 네이버·카카오 OAuth

### 다음 세션 시작 프로토콜
1. 레포 클론 → CONTEXT.md 먼저 읽기 → `git log --oneline -10`
2. (메일 작업 끝났으니) Supabase·Resend·Cloudflare 대시보드 점검 불필요 — 모두 설정 완료 상태
3. 첫 작업이 회원가입 모달 디자인이라면 `index.html` 회원가입 영역 + `nachim_v3.css`의 auth/login/signup 관련 스타일부터 검토
4. 캐시 버스터 v18부터 시작, 변경 시 v19로 (JS·CSS 둘 다 함께 bump)

### 보안 확인
- Resend API 키: Supabase Password 필드에만 입력 (저장된 평문 없음, 코드·CONTEXT·메모리 어디에도 저장 X) ✓
- Cloudflare 권한: one-time authorization, 영구 권한 부여 X ✓
- DNS 레코드: 모두 공개 정보 (lookup 가능), 비밀 X ✓
- GitHub 토큰: 메모리 정책상 저장 안 함, 매 세션 한 번만 받아 그 세션 안에서만 재사용 ✓

---

## 46. 2026-04-30 §46 — 회원가입 모달 정리 + verify 디자인 + 보안 게이트 + Auth0 한계 식별

### 작업 요약
§45에서 잡아둔 우선순위 1번(회원가입 모달 디자인 정리)으로 시작했지만, 실제 흐름을 따라가다 보니 단순 디자인을 넘어 **인증 동선 전반의 디테일 + 보안 + 구조적 한계 발견**까지 한 바퀴 돌게 됨. 11번 캐시 버스터 bump (v18 → v28), 9커밋.

### 완료한 작업

**1. 회원가입 모달 정리 (커밋 051d10e, 098f7a3)**
- "🔓 데모 체험 (로그인 없이)" 버튼 완전 제거 (`demoLogin`은 silent stub로 남김 — 외부 호출 호환성)
- "Auth0 설정" 백도어 텍스트 버튼 제거 (`openAuth0Settings` 함수 자체는 `loginProvider` 폴백 경로로 유지)
- "Apple로 계속하기" 버튼 제거 (한국 시장 비중 낮음 + Apple Developer $99/년 부담)
  - `.apple-btn` CSS와 `'apple':'Apple'` 메소드 라벨 매핑은 보존 (기존 가입자 호환)

**2. Verify 화면 재디자인 (커밋 5468245, 9015b88, 73555e4, 685c54a)**
- 📧 이모지 → 라인 SVG envelope 아이콘 (#1a3a6e 네이비 색, #eef2f8 회색 동그라미 배경)
- 제목 위계: 17px → 20px bold display font
- "메일 안의 '이메일 인증하기' 링크 클릭" 안내를 정보 카드로 분리 (좌측 3px 네이비 바, #f7f8fb 배경)
- 스팸 안내: 12px ink3로 보조 정보화
- 재발송 버튼: outline → Apple-style filled gray pill (#f2f2f7, border-radius 980px, hover/active 마이크로 인터랙션)
- 돌아가기 버튼: 텍스트 ← → SVG chevron + hover 시 좌측 2px 미끄러짐
- `verify-mode` 클래스로 verify 화면 진입 시 상단 탭/소셜/구분선 자동 숨김
- 라벨 통일: "이메일 확인" → "이메일 인증하기" (메일 템플릿 CTA 버튼과 일치, §45 메일 템플릿 참조)
  - 3곳 수정: index.html L186, nachim_v3.js L5527 + L5548

**3. Supabase otp_expired 에러 처리 (커밋 2aa9067)**
- 인증 메일 링크를 두 번 클릭하거나 만료(1시간 경과) 후 클릭 시 빈 화면 발생 버그
- URL hash에 `#error=access_denied&error_code=otp_expired&error_description=...` 박혀있는데 `handleAuthCallback`이 이를 처리 못함
- 진입부에 hash error 감지 분기 추가 → 사용자 친화적 alert + URL hash 정리 + 회원가입 화면 복귀
- otp_expired 외 다른 인증 에러도 `error_description`을 디코딩해 노출

**4. Paywall 모달 portal 버그 수정 (커밋 dcfccbb, ef07ceb)**
- 증상: 신규 가입자가 온보딩 진행 중 PRO 멘토/PDF 업로드 클릭 시 paywall 호출되지만 빈 화면이 됨
- 추측 1 (틀림): backdrop-filter stacking context — 형제 z-index 작동하므로 무관
- **진짜 원인**: `<div id="pricing-modal">`이 `<div id="app">` 안에 있는데, 신규 가입자가 온보딩 진행 중일 때 `#app`은 `display:none` 상태 (`showAuthGate`가 none으로 만든 후 `hideAuthGate`가 다시 보이게 안 함 — `startAfterLogin`/`finishOnboarding`에서야 flex로 전환)
- 해결: `openPricingModal` 진입 시 `pricing-modal`이 body 직속이 아니면 body로 이동(idempotent), 닫을 때 onboarding 복원

**5. PROTOTYPE_MODE 보안 게이트 (커밋 3019833)**
- §44에서 발견하고 §45 동안 미뤄둔 보안 구멍
- 일반 사용자가 paywall 다이얼로그에서 OK 한 번 누르면 결제 없이 Pro 전환 가능했음 → **운영 노출되면 안 되는 코드**
- `R01_ADMIN_EMAILS` 화이트리스트 (현재: `agripha@gmail.com`) + `isAdminUser()` 헬퍼 도입
- `selectPlan`의 PROTOTYPE_MODE 분기를 `isAdminUser()` 게이트로 보호
  - 관리자: 기존 시뮬레이션 가능 (메시지를 "관리자 시뮬레이션"으로 명확화)
  - 일반 사용자: "[준비 중] 결제 기능은 곧 오픈됩니다" 메시지로 차단
- 안내 이메일 `contact@route01.kr` → `hello@route01.kr` (실제 수신처, §45 Cloudflare Email Routing)
- 월 사용량 한도 PROTOTYPE_MODE(line 3252)는 그대로 — daily_usage 백엔드 트랙 후 활성화 예정 명시

### 발견된 구조적 한계 — Auth0 사용자 = Supabase 미인증

**증상 (관리자 Pro 시뮬레이션 후 발견)**
- Pro 전환 → 헤더는 PRO로 바뀜
- 멘토 모달/PDF 버튼 클릭 시 paywall이 다시 뜨면서 "현재 플랜 Free"로 표시
- 로그아웃 후 재로그인하면 온보딩 새로 뜸 (프로필 사라짐)
- Pro 시뮬레이션 결과도 다음 세션에서 사라짐

**진짜 원인**
- 리팡님은 Google 로그인 = Auth0 경유 → Supabase 입장에선 미인증 사용자
- `saveProfileToSupabase`: `sb.auth.getUser()` null → "not-authed" 반환, 저장 silent failure
- `loadPlanFromSupabase`: 같은 이유로 null → `'free'` 반환 → r01_plan을 free로 덮어씀
- 즉 §44에서 도입한 Supabase 백엔드는 **이메일/비밀번호 가입자에 한해서만 작동** — Auth0 Google 사용자는 백엔드가 비활성

**임시 우회 (§46 마무리 단계에서 진행)**
- 관리자도 이메일/비밀번호로 별도 가입 (`agripha@gmail.com` 화이트리스트와 일치)
- 그러면 Supabase 인증된 사용자가 되어 모든 백엔드(profiles, subscriptions, daily_usage 추후) 정상 작동
- 본질 해결은 §47에서 Auth0 → Supabase 통일

**검증 방법**
- 이메일/PW로 가입 후 페이지 새로고침 → 온보딩 안 뜨면 프로필 저장 정상
- Pro 시뮬레이션 후 새로고침 → PRO 그대로 유지되면 plan 영속 정상

### 미해결 / 후속 항목

**Pro 시뮬레이션 후 멘토 모달 paywall 재호출 시 "현재 Free" 표시 (§46에서는 추측만)**
- 가설: `pickModel`은 plan으로만 라우팅하므로 모든 멘토가 plan에 따라 Opus/Sonnet — 정상.
- 멘토 모달의 paywall 재출현 + Free 표시는 위 "Auth0 = Supabase 미인증" 원인의 부수 증상일 가능성 높음
- 임시 우회 후(이메일/PW 가입) 재현되는지 확인 필요. 재현 시 디버깅 로그 박고 §47에서 추적.

**컨버터 round-trip 단위 테스트** (계속 보류)
- §45 우선순위 2번 — 다음에 답변 본문 디자인 손볼 때 그 작업과 묶어서 진행
- 지금은 컨버터 안 건드리니 깨질 일 없음

### 다음 세션 우선순위 (재배치)

1. **Auth0 → Supabase 통일** ← 최우선 (§45의 6번이었지만 §46에서 한계가 명확해져 우선순위 ↑)
   - Google: Supabase 네이티브 OAuth로 교체 (콘솔: Google Cloud OAuth client + Supabase Provider 설정)
   - Kakao: Supabase 네이티브 OAuth (2024년 추가)
   - Naver: Supabase 미지원 → Edge Function으로 OAuth 핸드셰이크 직접 구현
   - `loginProvider` 재작성: Auth0 SDK 호출 → `sb.auth.signInWithOAuth`
   - `handleAuthCallback`의 Auth0 콜백 분기 제거 + Auth0 SDK 의존성 제거
   - 기존 Auth0 가입자 처리 정책 결정 (현재 사용자 0~소수일 가능성 → 폐기 + 재가입 안내)
   - **콘솔 작업 동반이라 시간 확보 필수**, 반나절~하루
2. **마이페이지 / 일일 카운터 백엔드** (§45 4번)
3. **토스페이먼츠 실 연동** (§45 5번)
4. **컨버터 round-trip 단위 테스트** (답변 디자인 손볼 때 묶어서)

### 캐시 버스터
- 이번 세션: v18 → v28 (11번 bump)
- 다음 세션 시작값: **v29**

### 커밋 이력 (시간 순)
```
051d10e chore(auth): remove demo button and Auth0 settings link from signup modal
098f7a3 feat(auth): remove Apple login button — focus on Google/Naver/Kakao
5468245 design(verify): redesign email verification screen — Apple-style hierarchy
9015b88 polish(verify): resend button auto-width + stronger back link
73555e4 design(verify): apple-style buttons — gray pill resend + chevron back
685c54a fix(verify): unify CTA label '이메일 확인' → '이메일 인증하기' (메일 템플릿 일치)
2aa9067 fix(auth): handle Supabase otp_expired / access_denied error in URL hash
dcfccbb fix(paywall): hide onboarding while pricing modal is open
ef07ceb fix(paywall): portal pricing-modal to body so it works during onboarding
3019833 security(paywall): gate Pro simulation behind admin email whitelist
```

### 작업 회고 — 추측 vs 검증의 비용
- Paywall 빈 화면 버그에서 backdrop-filter stacking 가설(틀림) → DOM 구조 확인 후 부모 가시성 가설(맞음). 추측 한 사이클 낭비.
- Pro→Free 회귀 버그에서 plan 캐시 의심 → `localStorage.r01_plan`이 hydrate에서 덮어쓰일 가능성 → 결국 Auth0 user가 Supabase 미인증이라는 구조적 한계 발견. 추측 단계가 길었지만 결과적으로 §47 우선순위 결정에 결정적 단서가 됨.
- 교훈: 증상 보고 즉시 코드 패치하지 말고, **무엇이 진실의 원천인지** 확인부터. Supabase가 백엔드인 시스템에서 "Auth0 사용자"는 거짓 인증된 상태였음.

---

## 47. 2026-04-30 §46 후속 — Pro 시뮬레이션 영속화 + §46 진단 정정

### 진단 정정
§46에서 "Auth0 사용자 = Supabase 미인증이라서 Pro가 Free로 회귀한다"고 결론지었으나, **임시 우회(이메일/PW 가입) 후 검증해보니 동일하게 Free로 회귀**. 가설이 틀렸음을 확인.

### 진짜 원인
- `selectPlan('pro')` 시뮬레이션은 `localStorage.setItem('r01_plan','pro')`만 함 — **subscriptions 테이블에 아무것도 안 씀**
- 새로고침 시 `startAfterLogin` → `hydrateUserStateFromSupabase` → `loadPlanFromSupabase`
- `subscriptions`에 row 없음 → `'free'` 반환 (line 266 `if(error || !data) return 'free'`)
- `r01_plan` 캐시가 'free'로 덮어써짐 → PRO 사라짐
- **Auth0와 무관**. 이메일/PW 사용자도 동일 (subscriptions에 row 없으면 모두 'free').

§46이 부분적으로 틀린 이유는 검증 없이 추측에 추측을 쌓았기 때문. 이메일/PW 우회가 작동했다면 진단이 맞았을 텐데, 작동 안 하니 가설 자체가 무효.

### 적용한 수정 (커밋 [TBD])

**TEMP 우회 장치 — 결제 백엔드 도입 시 통째로 제거**

1. **`selectPlan` Pro 시뮬레이션**: `localStorage.r01_plan='pro'`와 함께 `sessionStorage.r01_admin_sim='1'` 박음
2. **`hydrateUserStateFromSupabase`**: plan 덮어쓰기 직전 우회 체크
   ```
   const isAdminSim = sessionStorage.r01_admin_sim==='1' && isAdminUser();
   if(!isAdminSim){ localStorage.setItem('r01_plan', plan); }
   ```
3. **`selectPlan` Free 변경**: `sessionStorage.removeItem('r01_admin_sim')` — 시뮬레이션 해제
4. **`clearUserScopedCache` (로그아웃)**: `sessionStorage` 정리 — 다음 사용자 누수 방지

**보안 특성**
- `sessionStorage`라 탭 닫으면 자연 소멸 (영속 위변조 위험 없음)
- `isAdminUser()` 화이트리스트 체크 동반 → 일반 사용자가 sessionStorage 직접 만져도 우회 안 됨
- 두 조건(플래그 AND 관리자) 모두 만족해야 우회 발동

### 죽음의 조건 (결제 백엔드 트랙에서 제거할 코드)

코드에 `TEMP(결제 백엔드 도입 시 제거)` 주석 4곳:
- `selectPlan` Pro 시뮬레이션 분기 안 sessionStorage.setItem (line ~6720)
- `selectPlan` Free 변경 분기 안 sessionStorage.removeItem (line ~6700)
- `hydrateUserStateFromSupabase` 안 isAdminSim 체크 (line ~290)
- `clearUserScopedCache` 안 sessionStorage.removeItem (line ~373)

결제 백엔드 도입 시점에:
- selectPlan Pro 분기 자체가 토스페이먼츠 SDK 호출로 교체됨 → sessionStorage 코드 자연 제거
- 진짜 결제로 subscriptions에 row 들어감 → hydrate가 정상 'pro' 반환 → 우회 불필요
- 4곳 모두 한 번에 정리 가능

### 다음 세션 우선순위 (재정렬)

§46이 잡아둔 우선순위 그대로 유효. 단 §47에서 발견했듯 "Auth0 통일"이 모든 백엔드 문제의 원인은 아니었음 — 그래도 사용자 데이터 분산·코드 단순화 측면에서 여전히 1순위.

1. **Auth0 → Supabase 통일** (콘솔 작업 동반, 반나절~하루)
2. 마이페이지 / 일일 카운터 백엔드
3. 토스페이먼츠 실 연동 ← 이때 §47 TEMP 코드 4곳 한 번에 정리
4. 컨버터 round-trip 단위 테스트

### 캐시 버스터
- §46 후속: v28 → v29
- 다음 세션 시작값: **v30**

### §47 회고
§46에서 추측을 검증으로 닫지 못한 게 §47에서 드러났음. 임시 우회(이메일/PW)를 적용 후 검증을 직접 했어야 했는데, 적용을 권하기만 하고 닫았던 게 약점. 다음에 비슷한 "구조적 한계 가설" 나오면 **검증 후 닫기**가 원칙이 되어야 함.

### §47 추가 작업 — Chrome 비밀번호 저장 활성화 (커밋 62ab77b)

**증상**: Chrome이 로그인 후 비밀번호 저장 제안을 안 띄움.

**원인**: 로그인/회원가입이 `<div>` 구조 + `<input>`만 있어 Chrome 휴리스틱이 form으로 인식 못 함. autocomplete 속성은 잘 박혀있어 자동완성 자체는 작동하나, 저장 제안은 `<form>` submit 이벤트가 트리거되어야 발동.

**수정**:
- `#aform-login`: `<div>` → `<form onsubmit="emailLogin();return false">`
- `#aform-signup`: `<div>` → `<form onsubmit="emailSignup();return false">`
- 두 submit 버튼: `type="button" onclick="..."` → `type="submit"`

**부수 효과**: Enter 키로도 제출 가능, 가입 시점에도 비밀번호 저장 제안.

**검증 결과**: 알림 토스트는 안 떴지만 주소창 열쇠 아이콘에 정보 저장됨 — 정상 작동.

**캐시 버스터**: v29 → v30. 다음 세션 시작값 **v31**.

### §47 최종 커밋 이력
```
c573786 fix(admin): persist Pro simulation across reloads via sessionStorage flag
62ab77b fix(auth): wrap login/signup in <form> tags so Chrome offers password save
```

§46과 §47을 합치면 11커밋, 캐시 버스터 v18 → v30 (12번 bump). 회원가입·로그인 동선 전체 한 바퀴.
