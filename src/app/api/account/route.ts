import { prisma } from "@/lib/db";
import { requireUser, verifyPassword, audit, getCookie, destroySessionByToken, clearSessionCookieHeader, rateLimit } from "@/lib/auth";
import { json, errorResponse, parseBody } from "@/lib/api";
import { deleteAccountSchema } from "@/lib/validate";

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    if (!rateLimit(`delete-account:${user.id}`, 3, 60 * 60_000)) {
      await audit(user.id, "ACCOUNT_DELETE_RATE_LIMITED", req);
      return json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const { password } = await parseBody(req, deleteAccountSchema);
    const db = await prisma.user.findUnique({ where: { id: user.id } });
    if (!db || !(await verifyPassword(password, db.passwordHash))) return json({ error: "Password incorrect" }, { status: 400 });
    if (db.role === "ADMIN") {
      const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", enabled: true, id: { not: db.id } } });
      if (otherAdmins === 0) return json({ error: "The last active administrator cannot delete this account." }, { status: 409 });
    }
    await audit(db.id, "ACCOUNT_DELETED", req);
    await prisma.user.delete({ where: { id: user.id } }); // cascades sessions/transactions/etc.
    await destroySessionByToken(getCookie(req, "fintrack_session"));
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearSessionCookieHeader() } });
  } catch (e) { return errorResponse(e); }
}
