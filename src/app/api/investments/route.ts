import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { investmentSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";
import { investmentPerformance } from "@/lib/finance";

function shape(i: { investedPaise: number; currentPaise: number; [k: string]: unknown }) {
  const perf = investmentPerformance(i.investedPaise, i.currentPaise);
  return { ...i, invested: i.investedPaise / 100, current: i.currentPaise / 100, profitLoss: perf.profitLossPaise / 100, returnPct: perf.returnPct };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const items = await prisma.investment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return json({ investments: items.map(shape) });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, investmentSchema);
    const investedPaise = parseAmountToPaise(data.invested);
    const currentPaise = parseAmountToPaise(data.current);
    if (investedPaise === null || currentPaise === null || investedPaise < 0 || currentPaise < 0) return json({ error: "Invalid amounts" }, { status: 400 });
    const inv = await prisma.investment.create({ data: { userId: user.id, name: data.name, type: data.type, investedPaise, currentPaise, currency: data.currency } });
    await audit(user.id, "INVESTMENT_CREATED", req, { id: inv.id });
    return json({ investment: shape(inv) }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
