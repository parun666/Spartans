import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { savingsRate } from "@/lib/finance";
import { dashboardQuerySchema } from "@/lib/validate";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const query = dashboardQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - query.months + 1, 1));
    const monthKeys = Array.from({ length: query.months }, (_, index) =>
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - query.months + index + 1, 1)).toISOString().slice(0, 7)
    );
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthStr = now.toISOString().slice(0, 7);
    const [tx, investments, monthBudgets, budgetSpend] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id, date: { gte: startDate, lte: now } },
        select: {
          id: true,
          type: true,
          amountPaise: true,
          description: true,
          date: true,
          category: { select: { name: true } }
        }
      }),
      prisma.investment.findMany({
        where: { userId: user.id },
        select: { name: true, currentPaise: true }
      }),
      prisma.budget.findMany({
        where: { userId: user.id, month: monthStr },
        include: { category: true }
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: monthStart, lte: now }
        },
        _sum: { amountPaise: true }
      })
    ]);
    let income = 0, expense = 0;
    const byMonth = new Map(monthKeys.map((month) => [month, { income: 0, expense: 0 }]));
    const byCatExpense = new Map<string, number>();
    for (const t of tx) {
      const month = t.date.toISOString().slice(0, 7);
      const m = byMonth.get(month) ?? { income: 0, expense: 0 };
      if (t.type === "INCOME") { income += t.amountPaise; m.income += t.amountPaise; } else { expense += t.amountPaise; m.expense += t.amountPaise; byCatExpense.set(t.category.name, (byCatExpense.get(t.category.name) ?? 0) + t.amountPaise); }
      byMonth.set(month, m);
    }
    const alloc = investments.map((i) => ({ name: i.name, value: i.currentPaise }));
    const recent = tx.sort((a, b) => +b.date - +a.date).slice(0, 8).map((t) => ({ id: t.id, type: t.type, amount: t.amountPaise / 100, category: t.category.name, description: t.description, date: t.date }));
    const spendByCategory = new Map(budgetSpend.map((item) => [item.categoryId, item._sum.amountPaise ?? 0]));
    const budgetUse = monthBudgets.map((budget) => ({
      name: budget.category.name,
      limit: budget.limitPaise,
      used: spendByCategory.get(budget.categoryId) ?? 0
    }));
    return json({
      income: income / 100, expense: expense / 100, balance: (income - expense) / 100,
      savingsRatePct: savingsRate(income, expense),
      rangeMonths: query.months,
      monthly: [...byMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, v]) => ({ month, income: v.income / 100, expense: v.expense / 100, savings: (v.income - v.expense) / 100 })),
      categorySplit: [...byCatExpense.entries()].map(([name, v]) => ({ name, value: v / 100 })),
      highExpense: [...byCatExpense.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, v]) => ({ name, value: v / 100 })),
      budgetUse: budgetUse.map((b) => ({ name: b.name, limit: b.limit / 100, used: b.used / 100 })),
      investmentAllocation: alloc.map((a) => ({ name: a.name, value: a.value / 100 })),
      recent
    });
  } catch (e) { return errorResponse(e); }
}
