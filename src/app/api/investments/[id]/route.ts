import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { investmentSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, investmentSchema);
    const investedPaise = parseAmountToPaise(data.invested);
    const currentPaise = parseAmountToPaise(data.current);
    if (investedPaise === null || currentPaise === null || investedPaise < 0 || currentPaise < 0) return json({ error: "Invalid amounts" }, { status: 400 });
    const res = await prisma.investment.updateMany({ where: { id: params.id, userId: user.id }, data: { name: data.name, type: data.type, investedPaise, currentPaise, currency: data.currency } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "INVESTMENT_UPDATED", req, { id: params.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const res = await prisma.investment.deleteMany({ where: { id: params.id, userId: user.id } });
    if (res.count === 0) throw new ApiError(404, "Not found");
    await audit(user.id, "INVESTMENT_DELETED", req, { id: params.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
