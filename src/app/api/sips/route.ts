import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { sipSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";
import { sipFutureValuePaise } from "@/lib/finance";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const sips = await prisma.sip.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return json({ sips: sips.map((s) => { const r = sipFutureValuePaise(s.monthlyPaise, s.annualRate, s.years); return { ...s, monthly: s.monthlyPaise / 100, invested: r.investedPaise / 100, futureValue: r.futureValuePaise / 100 }; }) });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, sipSchema);
    const monthlyPaise = parseAmountToPaise(data.monthly);
    if (monthlyPaise === null || monthlyPaise <= 0) return json({ error: "Invalid monthly amount" }, { status: 400 });
    const sip = await prisma.sip.create({ data: { userId: user.id, name: data.name, monthlyPaise, annualRate: data.annualRate, years: data.years, currency: data.currency } });
    await audit(user.id, "SIP_CREATED", req, { id: sip.id });
    return json({ sip }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
