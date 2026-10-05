import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireRole(req, "ADMIN");
    const [userCount, activeCount, txCount, eventCount, lastEvents] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { enabled: true } }),
      prisma.transaction.count(),
      prisma.auditEvent.count(),
      prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { email: true } } } })
    ]);
    return json({ userCount, activeCount, transactionCount: txCount, eventCount, events: lastEvents });
  } catch (e) { return errorResponse(e); }
}
