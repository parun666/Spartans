import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { profileSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const db = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, currency: true, timezone: true, preferences: true } });
    return json({ profile: db });
  } catch (e) { return errorResponse(e); }
}
export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, profileSchema);
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id: user.id } } });
    if (existing) return json({ error: "Email in use" }, { status: 409 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: data.name, email: data.email, currency: data.currency, timezone: data.timezone, preferences: JSON.stringify(data.preferences ?? {}) }, select: { id: true, name: true, email: true, currency: true, timezone: true } });
    await audit(user.id, "PROFILE_UPDATED", req);
    return json({ profile: updated });
  } catch (e) { return errorResponse(e); }
}
