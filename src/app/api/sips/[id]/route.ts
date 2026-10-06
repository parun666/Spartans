import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(req);
    const res = await prisma.sip.deleteMany({ where: { id, userId: user.id } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "SIP_DELETED", req, { id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
