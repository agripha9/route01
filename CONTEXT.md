# Route01 — 작업 컨텍스트

> **Claude에게**: 새 세션 시작 시 이 파일을 가장 먼저 읽고, 맥락을 파악한 뒤 작업하세요. 세션이 끝날 때(사용자가 "오늘 마무리" 또는 유사 표현) 이 파일을 업데이트하고 commit·push 하세요. 사용자에게 워크플로를 다시 설명하지 마세요 — 이미 알고 있습니다.

최종 업데이트: 2026-04-23

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
├── nachim_v3.html       # 메인 앱 (~890줄)
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
   - Claude Code로 넘겨 실제 `nachim_v3.html/css/js`에 반영할 코드 생성
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

## 25. 알려진 이슈 (2026-04-23 시점)

1. **DOCX 표 헤더 흰 줄** — altChunk 파서가 `line-height`로 배경 안 칠함. CSS로는 해결 불가, `docx.js` OOXML 직생성 마이그레이션 필요 (로드맵 #12 일부)
2. **숫자 리스트 들여쓰기** — `1. 2.` 정렬 불일치 케이스 있음 (2026-04-22부터 표류)
3. **표 화면/DOCX/PDF 렌더 높이 차이** — 4-23 Apple 리팩터에서 11pt/1.62로 화면과 동기화했으나 실사용 검증 미완
4. **Paul Graham 에세이 부족한 H2·표** — 멘토별 포맷 차별화로 `## 지금 할 일` 1개만 남은 구조. `838670c`에서 공통 규칙에 H3·표 활용 보강했지만 실사용 모니터링 필요
5. **다른 멘토 답변 톤 체감 확인 미완** — Peter Thiel/Chesky/Huang/Naval 실제 답변에서 포맷·톤이 의도대로 나오는지 사용자 체감 관찰 필요

---

## 26. 다음 세션 시작 시 권장 순서

### 🔴 최우선: Phase 1 / Step 3 — 스트리밍 (1~2시간 작업)

Phase 1의 3단계 중 마지막. **체감 대기 시간 극적 단축**이 목표.

**범위**:
- 메인 답변 경로만 스트리밍 (가장 체감 큰 경로)
- 지원사업 도우미·추천 질문 생성은 non-stream 유지
- 로더 → 스트리밍 전환: 첫 토큰 도착 시 로더 제거하고 답변 버블 노출 시작
- 점진적 마크다운 렌더: 토큰 올 때마다 버블 내용 업데이트
- `continue` 루프(`max_tokens` 도달 시 이어쓰기)도 스트리밍 유지

**구현 포인트**:
- `fetch`로 SSE 수신 → ReadableStream 파싱
- Anthropic 이벤트 포맷: `message_start` → `content_block_delta` (여러 개) → `content_block_stop` → `message_delta` → `message_stop`
- 스트리밍 중에는 `preprocessMarkdown`의 중복 헤딩 제거 로직이 부분 텍스트에서 오작동할 수 있음 → **스트리밍 중 최소 파이프라인으로 렌더**하고 **완료 시 전체 재렌더**하는 2패스 구조
- stream 응답은 usage 정보가 `message_start.usage`와 `message_delta.usage`로 분산됨 → cache hit 로깅 코드 함께 수정

### 🟡 다음: Phase 2 — 복잡도 기반 모델 라우팅 + RAG 경량화 (1~2주)

**2-A. Sonnet/Opus 라우팅**
- 판단 기준: 첨부 파일 있음 → Opus / 질문에 "분석·전략·시나리오·비교·계획" 포함 or 토큰 > 200 → Opus / 나머지 Sonnet 4.6
- Opus 4.7 `$5/$25` (예전 4.1 대비 67% 인하), 평균 비용 +20~30% 증가 예상
- 유료 플랜과 연결: FREE=Sonnet only, PRO=Opus 자동 라우팅

**2-B. 업로드 PDF 경량 RAG**
- 현재: PDF 전체 텍스트를 매 요청마다 프롬프트에 주입 → 토큰 낭비
- 개선: 청크 분할 → 브라우저 로컬 벡터 검색(TF-IDF or 경량 임베딩) → 질문 관련 청크만 주입
- **기대 효과**: 토큰 70~90% 절감 + 관련성 향상
- 저장은 localStorage/IndexedDB, API 호출 없이 클라이언트 측 구현 가능

### 🟢 장기: Phase 3 — Route01 지식 베이스 구축 (2~4주)

**경쟁 서비스가 따라올 수 없는 해자 만들기**

**3-A. 한국 스타트업 KB 수집**
- 한국 VC 리스트·투자 트렌드
- K-스타트업·TIPS·예비창업패키지 상세 정보
- 한국 스타트업법·개인정보보호법·공정거래법 동향
- 국내 IR 덱 사례·PMF 사례·피보팅 사례
- 업종별 벤치마크 (SaaS CAC·LTV·Churn)
- 멘토 에세이·인터뷰 transcript (법적 허용 범위)

**3-B. 벡터화 + 검색 파이프라인**
- 선택지: Anthropic Contextual Retrieval (임베딩 + BM25 + rank fusion) 또는 Claude Projects의 자동 RAG
- **Contextual Retrieval** = 검색 실패율 67% 감소 (Anthropic 공식 발표 기법)

**3-C. 답변 citation 표시**
- 답변에 근거 자료 인용(출처 hover·링크)
- 신뢰도 극대화

### 로드맵 나머지 (시점 미정)

- **#4 약관·개인정보처리방침**: 유료 서비스 기준 문서 초안 + 접근 동의 UI
- **#9 유료화 정책·결제 연동**: Free vs PRO 요금제 확정 → 토스페이먼츠/포트원 연동
- **#10 마이페이지**: PW 변경, 탈퇴, 요금제 확인/변경 화면
- **#12 Apple UI/UX 리팩터 지속** (진행 중)

### 세션 시작 체크리스트

1. 이 CONTEXT.md 읽기
2. `git log --oneline -10`으로 최근 커밋 확인
3. **가장 최근 세션의 "알려진 이슈"와 "다음 세션 권장 순서" 블록** 재확인
4. 사용자 지시 대기 (또는 권장 순서의 최우선 작업 제안)
5. **한국어로 응답, ask_user_input 버튼 비선호**

### 사용자 선호·설정
- Chrome "창 닫으면 사이트 데이터 삭제" OFF + `[*.]route01.kr` 쿠키 예외 추가됨
- 품질 향상 시 가격 인상 의향 있음 (Opus 라우팅 OK)
- 정식 오픈 전 Supabase 백엔드 도입 필요 (Phase 2 이후)
- Apple 스타일, 네이비 `#1a3a6e` / 크림슨 `#8B1A1A`, 이모지·장식 아이콘 금지
