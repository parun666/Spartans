import { destroySessionByToken, getCookie, clearSessionCookieHeader, audit } from "@/lib/auth";

export async function POST(req: Request) {
  const token = getCookie(req, "fintrack_session");
  await destroySessionByToken(token);
  await audit(null, "LOGOUT", req);
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearSessionCookieHeader() } });
}
