import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { goalSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";
import { goalProgress } from "@/lib/finance";

function shape(g: { targetPaise: number; savedPaise: number; [k: string]: unknown }) {
  const p = goalProgress(g.savedPaise, g.targetPaise);
  return { ...g, target: g.targetPaise / 100, saved: g.savedPaise / 100, remaining: p.remainingPaise / 100, pct: p.pct };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return json({ goals: goals.map(shape) });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, goalSchema);
    const targetPaise = parseAmountToPaise(data.target);
    const savedPaise = parseAmountToPaise(data.saved ?? 0);
    if (targetPaise === null || savedPaise === null || targetPaise <= 0 || savedPaise < 0) return json({ error: "Invalid amounts" }, { status: 400 });
    const g = await prisma.goal.create({ data: { userId: user.id, name: data.name, targetPaise, savedPaise, currency: data.currency, deadline: data.deadline ? new Date(data.deadline) : null } });
    await audit(user.id, "GOAL_CREATED", req, { id: g.id });
    return json({ goal: shape(g) }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
