import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const events = await prisma.auditEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    return json({ events });
  } catch (e) { return errorResponse(e); }
}
