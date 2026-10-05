import { prisma } from "@/lib/db";
import { requireUser, verifyPassword, audit, getCookie, destroySessionByToken, clearSessionCookieHeader } from "@/lib/auth";
import { json, errorResponse, parseBody } from "@/lib/api";
import { deleteAccountSchema } from "@/lib/validate";

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    const { password } = await parseBody(req, deleteAccountSchema);
    const db = await prisma.user.findUnique({ where: { id: user.id } });
    if (!db || !(await verifyPassword(password, db.passwordHash))) return json({ error: "Password incorrect" }, { status: 400 });
    await audit(null, "ACCOUNT_DELETED", req, { email: db.email });
    await prisma.user.delete({ where: { id: user.id } }); // cascades sessions/transactions/etc.
    await destroySessionByToken(getCookie(req, "fintrack_session"));
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearSessionCookieHeader() } });
  } catch (e) { return errorResponse(e); }
}
