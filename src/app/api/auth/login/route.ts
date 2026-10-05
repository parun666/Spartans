import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { verifyPassword, createSession, sessionCookieHeader, rateLimit, audit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await parseBody(req, loginSchema);
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(`login:${ip}:${email}`, 5, 5 * 60 * 1000)) {
      await audit(null, "LOGIN_RATE_LIMITED", req, { email });
      return json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await audit(null, "LOGIN_FAILURE", req, { email });
      return json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (!user.enabled) return json({ error: "Account disabled" }, { status: 403 });
    await audit(user.id, "LOGIN_SUCCESS", req);
    const token = await createSession(user.id);
    return new Response(JSON.stringify({ ok: true, name: user.name }), { headers: { "content-type": "application/json", "set-cookie": sessionCookieHeader(token) } });
  } catch (e) { return errorResponse(e); }
}
