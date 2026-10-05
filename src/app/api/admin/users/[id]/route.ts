import { prisma } from "@/lib/db";
import { requireRole, audit, ApiError } from "@/lib/auth";
import { json, errorResponse, parseBody } from "@/lib/api";
import { roleSchema } from "@/lib/validate";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireRole(req, "ADMIN");
    const body = await parseBody(req, z.object({ role: roleSchema.shape.role.optional(), enabled: z.boolean().optional() }).strict());
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new ApiError(404, "User not found");
    if (target.id === admin.id && (body.role === "USER" || body.enabled === false)) {
      return json({ error: "Administrators cannot demote or disable their own account." }, { status: 409 });
    }
    const removingActiveAdmin = target.role === "ADMIN" && target.enabled &&
      (body.role === "USER" || body.enabled === false);
    if (removingActiveAdmin) {
      const remainingAdmins = await prisma.user.count({
        where: { role: "ADMIN", enabled: true, id: { not: target.id } }
      });
      if (remainingAdmins === 0) {
        return json({ error: "The last active administrator cannot be demoted or disabled." }, { status: 409 });
      }
    }
    await prisma.user.update({ where: { id }, data: { ...(body.role ? { role: body.role } : {}), ...(body.enabled !== undefined ? { enabled: body.enabled } : {}) } });
    if (body.enabled === false) await prisma.session.deleteMany({ where: { userId: id } });
    await audit(admin.id, body.role ? "ADMIN_ROLE_CHANGED" : "ADMIN_USER_UPDATE", req, { target: id, role: body.role, enabled: body.enabled });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
