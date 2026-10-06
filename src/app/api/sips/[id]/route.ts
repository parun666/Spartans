import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const res = await prisma.sip.deleteMany({ where: { id: params.id, userId: user.id } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "SIP_DELETED", req, { id: params.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
