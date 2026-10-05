import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireRole(req, "ADMIN");
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, enabled: true, createdAt: true } });
    return json({ users });
  } catch (e) { return errorResponse(e); }
}
