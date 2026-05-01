// ============================================================================
// Route01 — Edge Function: delete-user
// ----------------------------------------------------------------------------
// 회원 탈퇴를 처리한다. 클라이언트는 본인 JWT를 Authorization 헤더로 보낸다.
// 함수는:
//   1) JWT를 검증해 호출자(authUser)를 식별
//   2) service_role 권한으로 auth.users.delete(authUser.id) 실행
//   3) auth.users 삭제 시 profiles/subscriptions/daily_usage는
//      ON DELETE CASCADE로 자동 삭제됨 (001_initial_schema.sql 참고)
//
// 보안 모델:
//   - 본인만 본인을 삭제 가능 (다른 사용자 ID를 인자로 받지 않음).
//   - service_role 키는 Edge Function 환경변수(SUPABASE_SERVICE_ROLE_KEY)로
//     자동 주입되며 클라이언트에는 절대 노출되지 않는다.
//
// 배포 (CLI):
//   supabase functions deploy delete-user --no-verify-jwt
//   ※ 함수 내에서 직접 JWT 검증을 하므로 --no-verify-jwt 옵션을 줘야 한다.
//      (verify-jwt를 켜면 anon key 외 호출이 막혀 공유 토큰 검증 단계까지 못 간다)
//
// 배포 (Dashboard):
//   Edge Functions → New Function → 이름 'delete-user' → 본 코드 복사·붙여넣기
//   → Deploy. JWT verify 옵션은 OFF.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/* CORS — route01.kr 및 로컬 개발용. 다른 origin은 거부. */
const ALLOWED_ORIGINS = [
  'https://route01.kr',
  'https://www.route01.kr',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  /* preflight */
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
  }

  /* 1) JWT 추출 */
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ error: 'missing_token' }, 401, origin);
  }

  /* 2) 환경변수 — Supabase가 자동 주입 */
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[delete-user] missing env vars');
    return jsonResponse({ error: 'server_misconfigured' }, 500, origin);
  }

  /* 3) 토큰으로 호출자 user 식별 — anon key가 아닌 token 자체를 통해 user 조회 */
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse({ error: 'invalid_token', detail: userErr?.message }, 401, origin);
  }

  const userId = userData.user.id;

  /* 4) service_role 권한으로 auth.users 삭제 — cascade로 관련 테이블도 함께 삭제 */
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error('[delete-user] admin.deleteUser error', delErr);
    return jsonResponse({ error: 'delete_failed', detail: delErr.message }, 500, origin);
  }

  return jsonResponse({ ok: true, deleted_user_id: userId }, 200, origin);
});
