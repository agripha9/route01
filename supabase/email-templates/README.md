# Route01 — Supabase Email Templates

Resend SMTP 위에서 사용하는 한국어 + Route01 브랜딩 메일 템플릿. `nachim_v3.js`의 `emailSignup` / `sendResetPw`가 트리거.

## 적용 위치

Supabase Dashboard → Authentication → Emails → Templates → 각 항목 → HTML 코드 영역에 통째로 붙여넣기 + Save.

| 파일 | Supabase 템플릿 | 변수 |
|---|---|---|
| `01_confirm_signup.html` | Confirm sign up | `{{ .ConfirmationURL }}` |
| `02_reset_password.html` | Reset password | `{{ .ConfirmationURL }}` |

## Subject 라인 (각 템플릿 위 Subject 입력란)

- **Confirm sign up**: `Route01 가입을 위해 이메일을 인증해주세요`
- **Reset password**: `Route01 비밀번호 재설정 안내`

## 디자인 원칙

- 네이비 헤더 `#1a3a6e` + 흰 본문 카드 + 회색 캔버스 `#dfdfe4` (DESIGN.md L3)
- Pretendard / SF Pro 폴백, 본문 15px / line-height 1.62
- 버튼: 가입은 네이비, 비밀번호 재설정은 크림슨 `#8B1A1A` (액션 강도 차이)
- 폴백 링크 항상 노출 (버튼 차단 환경 대비)
- Preheader로 받은편지함 미리보기 텍스트 제어
- Outlook 호환 위해 table 기반 레이아웃 + inline CSS only

## 미작성 (다음 세션)

다음 4개는 사용처가 명확해질 때 작업:
- Magic link
- Change email address
- Reauthentication
- Invite user

기본(영문) 템플릿 그대로 두면 작동은 함 — 단, 한국어 사용자에겐 어색.
