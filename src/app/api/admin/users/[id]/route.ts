import { prisma } from "@/lib/db";
import { requireRole, audit, ApiError } from "@/lib/auth";
import { json, errorResponse, parseBody } from "@/lib/api";
import { roleSchema } from "@/lib/validate";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(req, "ADMIN");
    const body = await parseBody(req, z.object({ role: z.enum(["USER", "ADMIN"]).optional(), enabled: z.boolean().optional() }));
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new ApiError(404, "User not found");
    await prisma.user.update({ where: { id: params.id }, data: { ...(body.role ? { role: body.role } : {}), ...(body.enabled !== undefined ? { enabled: body.enabled } : {}) } });
    if (body.enabled === false) await prisma.session.deleteMany({ where: { userId: params.id } });
    await audit(admin.id, "ADMIN_USER_UPDATE", req, { target: params.id, role: body.role, enabled: body.enabled });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
