-- ============================================================================
-- Route01 — Migration 002: drop unused columns (YAGNI cleanup)
-- 작성일: 2026-04-29
--
-- 배경: §44 Step 3 검증 중 mentor_style·nickname 두 컬럼이 NULL로 남고
--       실제 화면 코드에서 한 번도 안 쓰는 게 확인됨. YAGNI 원칙에 따라
--       지금 안 쓰는 컬럼은 제거하고, 향후 정말 필요하면 ALTER TABLE로 추가.
--
-- 변경 사항:
--   1. profiles.mentor_style 컬럼 삭제 (mentor 한 컬럼이면 충분)
--   2. profiles.nickname 컬럼 삭제 (현재 화면에서 표시 안 함)
--   3. handle_new_user 트리거 단순화 (nickname 관련 로직 제거)
-- ============================================================================

-- 1. mentor_style 컬럼 삭제 — 현재 화면 코드는 profile.style 한 차원만 사용
alter table public.profiles drop column if exists mentor_style;

-- 2. nickname 컬럼 삭제 — 표시명은 현재 startup_name으로 대체됨
alter table public.profiles drop column if exists nickname;

-- 3. handle_new_user 트리거 단순화
--    이전: profiles에 nickname 채워서 INSERT
--    이후: profiles에 id만 INSERT (다른 필드는 온보딩에서 채움)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end $$;

-- 트리거 자체는 재생성 불필요 — 함수만 교체되면 동작도 자동 반영됨.

-- ============================================================================
-- 끝.
-- 실행 후 Table Editor에서 profiles 테이블 새로고침 → mentor_style·nickname
-- 컬럼이 사라져 있으면 성공.
-- ============================================================================
