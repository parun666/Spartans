import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { budgetSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const month = new URL(req.url).searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const [year, m] = month.split("-").map(Number);
    const gte = new Date(year, m - 1, 1), lt = new Date(year, m, 1);
    const budgets = await prisma.budget.findMany({ where: { userId: user.id, month }, include: { category: true } });
    const result = [];
    for (const b of budgets) {
      const agg = await prisma.transaction.aggregate({ where: { userId: user.id, type: "EXPENSE", categoryId: b.categoryId, date: { gte, lt } }, _sum: { amountPaise: true } });
      const usedPaise = agg._sum.amountPaise ?? 0;
      const pct = b.limitPaise === 0 ? null : (usedPaise / b.limitPaise) * 100;
      result.push({ ...b, limit: b.limitPaise / 100, used: usedPaise / 100, pct, warning: pct !== null && pct >= 100 ? "EXCEEDED" : pct !== null && pct >= 80 ? "WARNING_80" : null });
    }
    return json({ budgets: result });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, budgetSchema);
    const limitPaise = parseAmountToPaise(data.limit);
    if (limitPaise === null || limitPaise <= 0) return json({ error: "Invalid limit" }, { status: 400 });
    const cat = await prisma.category.findFirst({ where: { id: data.categoryId, OR: [{ userId: user.id }, { userId: null }] } });
    if (!cat) return json({ error: "Invalid category" }, { status: 400 });
    const b = await prisma.budget.upsert({ where: { userId_categoryId_month: { userId: user.id, categoryId: cat.id, month: data.month } }, update: { limitPaise, currency: data.currency }, create: { userId: user.id, categoryId: cat.id, limitPaise, month: data.month, currency: data.currency } });
    await audit(user.id, "BUDGET_SAVED", req, { categoryId: cat.id, month: data.month });
    return json({ budget: b }, { status: 200 });
  } catch (e) { return errorResponse(e); }
}
