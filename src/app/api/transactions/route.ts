import { prisma } from "@/lib/db";
import { requireUser, audit, ApiError } from "@/lib/auth";
import { transactionListQuerySchema, transactionSchema } from "@/lib/validate";
import { json, errorResponse, parseBody } from "@/lib/api";
import { parseAmountToPaise } from "@/lib/money";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const url = new URL(req.url);
    const rawQuery = Object.fromEntries(url.searchParams.entries());
    const parsedQuery = transactionListQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) throw new ApiError(400, "Invalid query");
    const { q, type, categoryId, from, to, minAmount, maxAmount, sort, page, pageSize } = parsedQuery.data;
    if (from && to && from > to) throw new ApiError(400, "Invalid date range");

    const where: Record<string, unknown> = { userId: user.id };
    if (type === "INCOME" || type === "EXPENSE") where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (from || to) where.date = { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) };
    const paiseFilter: Record<string, number> = {};
    if (minAmount !== undefined) paiseFilter.gte = Math.round(minAmount * 100);
    if (maxAmount !== undefined) paiseFilter.lte = Math.round(maxAmount * 100);
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) throw new ApiError(400, "Invalid amount range");
    if (Object.keys(paiseFilter).length) where.amountPaise = paiseFilter;
    if (q) where.OR = [
      { description: { contains: q } },
      { notes: { contains: q } },
      { category: { name: { contains: q } } }
    ];
    const orderBy = sort === "date_asc" ? { date: "asc" as const } : sort === "amount_desc" ? { amountPaise: "desc" as const } : sort === "amount_asc" ? { amountPaise: "asc" as const } : { date: "desc" as const };
    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { category: true } })
    ]);
    return json({ total, page, pageSize, items: items.map((t) => ({ ...t, amount: t.amountPaise / 100 })) });
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, transactionSchema);
    const cat = await prisma.category.findFirst({ where: { id: data.categoryId, OR: [{ userId: user.id }, { userId: null }] } });
    if (!cat) throw new ApiError(400, "Invalid category");
    const amountPaise = parseAmountToPaise(data.amount);
    if (amountPaise === null || amountPaise <= 0) throw new ApiError(400, "Invalid amount");
    const t = await prisma.transaction.create({ data: { userId: user.id, type: data.type, amountPaise, currency: data.currency, categoryId: cat.id, description: data.description, notes: data.notes ?? "", date: new Date(data.date) }, include: { category: true } });
    await audit(user.id, "TRANSACTION_CREATED", req, { id: t.id, type: t.type });
    return json({ transaction: { ...t, amount: t.amountPaise / 100 } }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
