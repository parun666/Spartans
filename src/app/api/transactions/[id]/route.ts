import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { transactionSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, transactionSchema);
    const cat = await prisma.category.findFirst({ where: { id: data.categoryId, OR: [{ userId: user.id }, { userId: null }] } });
    if (!cat) throw new ApiError(400, "Invalid category");
    const amountPaise = parseAmountToPaise(data.amount);
    if (amountPaise === null || amountPaise <= 0) throw new ApiError(400, "Invalid amount");
    const res = await prisma.transaction.updateMany({ where: { id: params.id, userId: user.id }, data: { type: data.type, amountPaise, currency: data.currency, categoryId: cat.id, description: data.description, notes: data.notes ?? "", date: new Date(data.date) } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "TRANSACTION_UPDATED", req, { id: params.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
export async function DELETE(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const res = await prisma.transaction.deleteMany({ where: { id: params.id, userId: user.id } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "TRANSACTION_DELETED", req, { id: params.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
