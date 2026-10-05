import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const format = new URL(req.url).searchParams.get("format") ?? "json";
    const [transactions, budgets, investments, sips, goals, categories] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id } }),
      prisma.investment.findMany({ where: { userId: user.id } }),
      prisma.sip.findMany({ where: { userId: user.id } }),
      prisma.goal.findMany({ where: { userId: user.id } }),
      prisma.category.findMany({ where: { userId: user.id } })
    ]);
    await audit(user.id, "DATA_EXPORTED", req, { format });
    const data = { exportedAt: new Date().toISOString(), categories, transactions: transactions.map(({ amountPaise, ...t }) => ({ ...t, amount: amountPaise / 100 })), budgets: budgets.map(({ limitPaise, ...b }) => ({ ...b, limit: limitPaise / 100 })), investments: investments.map(({ investedPaise, currentPaise, ...i }) => ({ ...i, invested: investedPaise / 100, current: currentPaise / 100 })), sips: sips.map(({ monthlyPaise, targetPaise, ...s }) => ({ ...s, monthly: monthlyPaise / 100 })), goals: goals.map(({ targetPaise, savedPaise, ...g }) => ({ ...g, target: targetPaise / 100, saved: savedPaise / 100 })) };
    if (format === "csv") {
      const rows = [["date", "type", "amount", "currency", "categoryId", "description", "notes"], ...transactions.map((t) => [t.date.toISOString().slice(0, 10), t.type, String(t.amountPaise / 100), t.currency, t.categoryId, t.description, t.notes])];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=fintrack-export.csv" } });
    }
    return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=fintrack-export.json" } });
  } catch (e) { return errorResponse(e); }
}
