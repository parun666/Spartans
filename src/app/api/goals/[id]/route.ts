import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { goalSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(req);
    const data = await parseBody(req, goalSchema);
    const targetPaise = parseAmountToPaise(data.target);
    const savedPaise = parseAmountToPaise(data.saved ?? 0);
    if (targetPaise === null || savedPaise === null || targetPaise <= 0 || savedPaise < 0) return json({ error: "Invalid amounts" }, { status: 400 });
    const res = await prisma.goal.updateMany({ where: { id: id, userId: user.id }, data: { name: data.name, targetPaise, savedPaise, currency: data.currency, deadline: data.deadline ? new Date(data.deadline) : null } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "GOAL_UPDATED", req, { id: id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(req);
    const res = await prisma.goal.deleteMany({ where: { id: id, userId: user.id } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "GOAL_DELETED", req, { id: id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
