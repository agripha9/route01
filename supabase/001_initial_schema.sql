-- ============================================================================
-- Route01 — 초기 DB 스키마 (세션 1)
-- 작성일: 2026-04-28
--
-- 이 파일은 Supabase SQL Editor에서 한 번만 실행한다.
-- 재실행 시 IF NOT EXISTS / DO $$ 블록으로 안전하게 skip되도록 작성.
-- ============================================================================

-- ============================================================================
-- 1. profiles — 사용자별 프로필 (업종·단계·멘토 등)
-- ============================================================================
-- Supabase auth.users 테이블이 마스터이고,
-- profiles는 1:1 관계로 사용자별 도메인 정보를 보관한다.
-- id 컬럼은 auth.users.id를 그대로 참조 (PK 겸 FK).
--
-- 설계 원칙: 모든 컬럼은 답변 프롬프트(buildSys)에 흘러들어가 답변
--           맞춤화의 재료가 됨. "프로필 필드 = 답변 차별화 재료" 원칙.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  -- 비즈니스 도메인 정보 (Step 1)
  startup_name    text,
  industry        text,                 -- 업종 한 줄 소개 (자유 텍스트)
  sector          text[],               -- 업종 세부 (다중선택, 배열)
  stage           text,                 -- 단계 (아이디어/MVP/초기매출/시드준비/시드완료/시리즈A+)
  target          text,                 -- 타겟 고객 (B2B/B2C/B2G/복합)
  -- 운영 정보 (Step 2)
  team_size       text,                 -- 팀 규모 (1명·솔로 / 2~3명 / 4~10명 / 11명 이상)
  worry           text,                 -- 핵심 고민 또는 목표
  mrr             text,                 -- 월 매출 (선택)
  invest          text,                 -- 투자 상황 (선택, 화면 코드의 ob.invest와 정렬)
  -- 멘토 (Step 3)
  mentor          text,                 -- 'Paul Graham (YC)' 등 (멘토 이름이 곧 스타일)
  -- 메타 (시스템 자동)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. subscriptions — 사용자별 plan (free / pro)
-- ============================================================================
-- 별도 테이블로 분리한 이유:
--   - profiles와 lifecycle이 다름 (결제·만료·갱신·환불 이력 별도 추적)
--   - 향후 결제 이력 테이블(payments)과 연결될 hub
create table if not exists public.subscriptions (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  plan            text not null default 'free' check (plan in ('free','pro')),
  -- Pro 만료 시점 (free는 null)
  expires_at      timestamptz,
  -- 결제 공급자 정보 (세션 3 토스페이먼츠 연동 시 채워짐)
  provider        text,                 -- 'toss', 'portone', null
  provider_sub_id text,                 -- 공급자 측 구독 ID
  -- 메타
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. daily_usage — 일일 질문 사용량 카운터
-- ============================================================================
-- Free 사용자 일 5건 한도 + Pro 사용자 일 100건 fair-use cap 검증용.
-- 세션 1에선 스키마만 만들고, 실제 카운트 증가/검증은 세션 2에서 구현.
-- (사용자, 날짜) 조합이 PK — UPSERT로 카운터 증가.
create table if not exists public.daily_usage (
  user_id         uuid not null references auth.users(id) on delete cascade,
  usage_date      date not null default current_date,
  question_count  integer not null default 0,
  primary key (user_id, usage_date)
);

-- 조회 성능 — 사용자별 최근 사용량 빠르게 가져오기
create index if not exists idx_daily_usage_user_date
  on public.daily_usage(user_id, usage_date desc);

-- ============================================================================
-- 4. 신규 사용자 자동 초기화 트리거
-- ============================================================================
-- auth.users에 신규 사용자가 생기면 자동으로:
--   - profiles 빈 row 생성 (id만 — 다른 필드는 온보딩에서 채움)
--   - subscriptions 'free' row 생성
-- 이렇게 해두면 클라이언트 코드가 매번 "있는지 확인 후 없으면 생성" 안 해도 됨.
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

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. Row Level Security (RLS) — 본인 데이터만 read/write
-- ============================================================================
-- RLS를 켜고, 정책을 안 걸면 아무도 못 읽음 (deny-by-default).
-- 그래서 RLS 켠 뒤 반드시 SELECT/INSERT/UPDATE/DELETE 정책을 걸어야 함.

-- profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- DELETE 정책은 의도적으로 없음 (회원 탈퇴는 auth.users 삭제 시 cascade로 자동 삭제)

-- subscriptions RLS
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE는 의도적으로 클라이언트에 안 줌.
-- plan 변경은 결제 검증 거친 서버 측(Edge Function)에서만 가능해야 함.
-- 세션 3에서 Edge Function 도입 시 service_role로 처리.

-- daily_usage RLS
alter table public.daily_usage enable row level security;

drop policy if exists "daily_usage_select_own" on public.daily_usage;
create policy "daily_usage_select_own" on public.daily_usage
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE는 세션 2의 Edge Function에서 service_role로 처리.
-- 클라이언트가 직접 카운터 증가시키는 걸 막아야 우회가 불가능.

-- ============================================================================
-- 끝.
-- 실행 후 Supabase Dashboard → Database → Tables 에서
-- profiles / subscriptions / daily_usage 세 테이블이 보이면 성공.
-- ============================================================================
