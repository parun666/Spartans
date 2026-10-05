import { prisma } from "@/lib/db";
import { requireUser, audit, rateLimit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (!rateLimit(`reports:${user.id}`, 30, 60_000)) {
      await audit(user.id, "REPORT_RATE_LIMITED", req);
      return json({ error: "Too many report requests. Try again later." }, { status: 429 });
    }
    const type = new URL(req.url).searchParams.get("type") ?? "monthly";
    if (!["monthly", "category", "income", "expense", "budget", "investment"].includes(type)) {
      return json({ error: "Invalid report type" }, { status: 400 });
    }
    const tx = await prisma.transaction.findMany({ where: { userId: user.id }, include: { category: true }, orderBy: { date: "asc" } });
    if (type === "category") {
      const map = new Map<string, number>();
      for (const t of tx.filter((t) => t.type === "EXPENSE")) map.set(t.category.name, (map.get(t.category.name) ?? 0) + t.amountPaise);
      return json({ rows: [...map.entries()].map(([category, amountPaise]) => ({ category, amount: amountPaise / 100 })) });
    }
    if (type === "income" || type === "expense") {
      const map = new Map<string, number>();
      const want = type === "income" ? "INCOME" : "EXPENSE";
      for (const t of tx.filter((t) => t.type === want)) { const k = `${t.date.toISOString().slice(0, 7)}|${t.category.name}`; map.set(k, (map.get(k) ?? 0) + t.amountPaise); }
      return json({ rows: [...map.entries()].map(([k, v]) => { const [month, category] = k.split("|"); return { month, category, amount: v / 100 }; }) });
    }
    if (type === "budget") {
      const budgets = await prisma.budget.findMany({ where: { userId: user.id }, include: { category: true } });
      const rows = [];
      for (const b of budgets) {
        const [y, m] = b.month.split("-").map(Number);
        const agg = await prisma.transaction.aggregate({ where: { userId: user.id, type: "EXPENSE", categoryId: b.categoryId, date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } }, _sum: { amountPaise: true } });
        rows.push({ month: b.month, category: b.category.name, limit: b.limitPaise / 100, used: (agg._sum.amountPaise ?? 0) / 100 });
      }
      return json({ rows });
    }
    if (type === "investment") {
      const inv = await prisma.investment.findMany({ where: { userId: user.id } });
      return json({ rows: inv.map((i) => ({ name: i.name, type: i.type, invested: i.investedPaise / 100, current: i.currentPaise / 100, profitLoss: (i.currentPaise - i.investedPaise) / 100, returnPct: i.investedPaise === 0 ? null : ((i.currentPaise - i.investedPaise) / i.investedPaise) * 100 })) });
    }
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of tx) { const k = t.date.toISOString().slice(0, 7); const m = map.get(k) ?? { income: 0, expense: 0 }; if (t.type === "INCOME") m.income += t.amountPaise; else m.expense += t.amountPaise; map.set(k, m); }
    return json({ rows: [...map.entries()].map(([month, v]) => ({ month, income: v.income / 100, expense: v.expense / 100 })) });
  } catch (e) { return errorResponse(e); }
}
