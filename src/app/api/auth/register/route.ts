import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { hashPassword, createSession, sessionCookieHeader } from "@/lib/auth";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await parseBody(req, registerSchema);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return json({ error: "Email already registered" }, { status: 409 });
    const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
    await audit(user.id, "REGISTER", req);
    const token = await createSession(user.id);
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "content-type": "application/json", "set-cookie": sessionCookieHeader(token) } });
  } catch (e) { return errorResponse(e); }
}
