-- ============================================================================
-- Route01 — Migration 003: add missing profile columns
-- 작성일: 2026-04-29
--
-- 배경: §44 Step 3 검증 중, 온보딩에서 입력받는 4개 항목이 DB에 저장되지
--       않아 다시 로그인 시 화면에서 사라지는 데이터 손실 버그 발견.
--       이 4개 필드는 화면 입력만 받고 답변 프롬프트(buildSys)에도
--       반영 안 되고 있던 진짜 누락이었음.
--
-- 설계 원칙: "사용자가 입력한 모든 프로필 필드는 답변 품질에 기여한다"
--           — Route01의 핵심 차별화 포인트.
--
-- 변경 사항:
--   1. profiles.target text — 타겟 고객 (B2B/B2C/B2G/복합)
--   2. profiles.sector text[] — 업종 세부 (다중선택, 배열)
--   3. profiles.mrr text — 월 매출
--   4. profiles.funding text — 투자 상황 (미투자/엔젤·시드/시리즈A 등)
-- ============================================================================

alter table public.profiles add column if not exists target  text;
alter table public.profiles add column if not exists sector  text[];
alter table public.profiles add column if not exists mrr     text;
alter table public.profiles add column if not exists funding text;

-- ============================================================================
-- 끝.
-- 실행 후 Table Editor에서 profiles 테이블 새로고침 → 4개 컬럼이 추가되어
-- 있어야 함. 기존 row의 새 컬럼 값은 NULL (정상 — 다음 프로필 저장 시 채워짐).
-- ============================================================================
