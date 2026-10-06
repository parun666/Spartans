import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const user = await requireUser(req);
    const cat = await prisma.category.findFirst({ where: { id: params.id, userId: user.id } });
    if (!cat) throw new ApiError(404, "Not found");
    const inUse = await prisma.transaction.count({ where: { categoryId: cat.id } });
    if (inUse > 0) return json({ error: "Category is used by transactions" }, { status: 409 });
    await prisma.category.delete({ where: { id: cat.id } });
    await audit(user.id, "CATEGORY_DELETED", req, { id: cat.id });
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
