import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { categorySchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const categories = await prisma.category.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] }, orderBy: { name: "asc" } });
    return json({ categories });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, categorySchema);
    const existing = await prisma.category.findFirst({ where: { name: data.name, OR: [{ userId: user.id }, { userId: null }] } });
    if (existing) return json({ error: "Category name already exists" }, { status: 409 });
    const c = await prisma.category.create({ data: { ...data, userId: user.id } });
    await audit(user.id, "CATEGORY_CREATED", req, { id: c.id });
    return json({ category: c }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
