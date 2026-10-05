import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { requireUser, verifyPassword, hashPassword, audit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await verifyPassword(currentPassword, dbUser.passwordHash))) return json({ error: "Current password is incorrect" }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await audit(user.id, "PASSWORD_CHANGED", req);
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
