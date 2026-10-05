import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { savingsRate } from "@/lib/finance";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const tx = await prisma.transaction.findMany({ where: { userId: user.id }, include: { category: true } });
    let income = 0, expense = 0;
    const byMonth = new Map<string, { income: number; expense: number }>();
    const byCatExpense = new Map<string, number>();
    for (const t of tx) {
      const month = t.date.toISOString().slice(0, 7);
      const m = byMonth.get(month) ?? { income: 0, expense: 0 };
      if (t.type === "INCOME") { income += t.amountPaise; m.income += t.amountPaise; } else { expense += t.amountPaise; m.expense += t.amountPaise; byCatExpense.set(t.category.name, (byCatExpense.get(t.category.name) ?? 0) + t.amountPaise); }
      byMonth.set(month, m);
    }
    const investments = await prisma.investment.findMany({ where: { userId: user.id } });
    const alloc = investments.map((i) => ({ name: i.name, value: i.currentPaise }));
    const recent = tx.sort((a, b) => +b.date - +a.date).slice(0, 8).map((t) => ({ id: t.id, type: t.type, amount: t.amountPaise / 100, category: t.category.name, description: t.description, date: t.date }));
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthBudgets = await prisma.budget.findMany({ where: { userId: user.id, month: monthStr } });
    const budgetUse = [];
    for (const b of monthBudgets) {
      const agg = await prisma.transaction.aggregate({ where: { userId: user.id, type: "EXPENSE", categoryId: b.categoryId }, _sum: { amountPaise: true } });
      budgetUse.push({ name: b.categoryId, limit: b.limitPaise, used: agg._sum.amountPaise ?? 0 });
    }
    return json({
      income: income / 100, expense: expense / 100, balance: (income - expense) / 100,
      savingsRatePct: savingsRate(income, expense),
      monthly: [...byMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, v]) => ({ month, income: v.income / 100, expense: v.expense / 100, savings: (v.income - v.expense) / 100 })),
      categorySplit: [...byCatExpense.entries()].map(([name, v]) => ({ name, value: v / 100 })),
      highExpense: [...byCatExpense.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, v]) => ({ name, value: v / 100 })),
      budgetUse: budgetUse.map((b) => ({ name: b.name, limit: b.limit / 100, used: b.used / 100 })),
      investmentAllocation: alloc.map((a) => ({ name: a.name, value: a.value / 100 })),
      recent
    });
  } catch (e) { return errorResponse(e); }
}
