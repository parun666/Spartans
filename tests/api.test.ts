import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";

// API-level BOLA / RBAC / rate-limit tests against real SQLite test DB.
let txGET: any, txPUT: any, txDELETE: any, budgetGET: any, dashboardGET: any, invPUT: any, invDELETE: any, goalDELETE: any, exportGET: any, adminGET: any, loginPOST: any;
let aiCtx: any;
let prisma: any, createSession: any, hashPassword: any;
let tokenA: string, tokenB: string, idA: string, idB: string;
let txIdA: string, budgetCatIdA: string, invIdA: string, goalIdA: string;

function req(url: string, token?: string, init: RequestInit = {}) {
  return new Request(`http://localhost${url}`, { ...init, headers: { ...(token ? { cookie: `fintrack_session=${token}` } : {}), "content-type": "application/json", ...(init.headers || {}) } });
}

beforeAll(async () => {
  process.env.DATABASE_URL = "file:./tests/test.db";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-me-please-0123456789abcdef";
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: "file:./tests/test.db" }, stdio: "ignore", cwd: process.cwd() });
  const dbMod = await import("@/lib/db");
  prisma = dbMod.prisma;
  const authMod = await import("@/lib/auth");
  createSession = authMod.createSession;
  hashPassword = authMod.hashPassword;
  txGET = (await import("@/app/api/transactions/route")).GET;
  txPUT = (await import("@/app/api/transactions/[id]/route")).PUT;
  txDELETE = (await import("@/app/api/transactions/[id]/route")).DELETE;
  budgetGET = (await import("@/app/api/budgets/route")).GET;
  dashboardGET = (await import("@/app/api/dashboard/route")).GET;
  invPUT = (await import("@/app/api/investments/[id]/route")).PUT;
  invDELETE = (await import("@/app/api/investments/[id]/route")).DELETE;
  goalDELETE = (await import("@/app/api/goals/[id]/route")).DELETE;
  exportGET = (await import("@/app/api/export/route")).GET;
  adminGET = (await import("@/app/api/admin/overview/route")).GET;
  loginPOST = (await import("@/app/api/auth/login/route")).POST;
  aiCtx = await import("@/lib/aiTools");

  // clean slate
  await prisma.auditEvent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.sip.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const userA = await prisma.user.create({ data: { email: "usera@test.dev", name: "User A", passwordHash: await hashPassword("Passw0rd123") } });
  const userB = await prisma.user.create({ data: { email: "userb@test.dev", name: "User B", passwordHash: await hashPassword("Passw0rd123") } });
  idA = userA.id; idB = userB.id;
  tokenA = await createSession(idA);
  tokenB = await createSession(idB);

  let cat = await prisma.category.findFirst({ where: { userId: null, name: "Groceries" } });
  if (!cat) cat = await prisma.category.create({ data: { userId: null, name: "Groceries", kind: "EXPENSE" } });
  budgetCatIdA = cat.id;
  const tx = await prisma.transaction.create({ data: { userId: idA, type: "EXPENSE", amountPaise: 123456, currency: "INR", categoryId: cat.id, description: "A secret purchase", date: new Date() } });
  txIdA = tx.id;
  const inv = await prisma.investment.create({ data: { userId: idA, name: "A fund", type: "EQUITY", investedPaise: 100, currentPaise: 120 } });
  invIdA = inv.id;
  const goal = await prisma.goal.create({ data: { userId: idA, name: "A goal", targetPaise: 1000 } });
  goalIdA = goal.id;
  await prisma.budget.create({ data: { userId: idA, categoryId: cat.id, limitPaise: 5000, month: new Date().toISOString().slice(0, 7) } });
});

describe("BOLA: transactions", () => {
  it("USER_B cannot read USER_A transactions via list", async () => {
    const res = await txGET(req("/api/transactions", tokenB));
    const body = await res.json();
    expect(body.total).toBe(0);
  });
  it("USER_B cannot update USER_A transaction", async () => {
    const res = await txPUT(req(`/api/transactions/${txIdA}`, tokenB, { method: "PUT", body: JSON.stringify({ type: "EXPENSE", amount: 1, categoryId: budgetCatIdA, description: "x", date: new Date().toISOString() }) }), { params: { id: txIdA } });
    expect(res.status).toBe(404);
  });
  it("USER_B cannot delete USER_A transaction", async () => {
    const res = await txDELETE(req(`/api/transactions/${txIdA}`, tokenB, { method: "DELETE" }), { params: { id: txIdA } });
    expect(res.status).toBe(404);
  });
});

describe("BOLA: budgets / investments / goals / export / AI context", () => {
  it("uses the budget category name for dashboard chart labels", async () => {
    const res = await dashboardGET(req("/api/dashboard", tokenA));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.budgetUse).toContainEqual(expect.objectContaining({ name: "Groceries" }));
    expect(body.budgetUse.some((budget: { name: string }) => budget.name === budgetCatIdA)).toBe(false);
  });

  it("budget list for B is empty", async () => {
    const res = await budgetGET(req(`/api/budgets?month=${new Date().toISOString().slice(0, 7)}`, tokenB));
    expect((await res.json()).budgets).toHaveLength(0);
  });
  it("investment cross-user update/delete blocked", async () => {
    const put = await invPUT(req(`/api/investments/${invIdA}`, tokenB, { method: "PUT", body: JSON.stringify({ name: "x", type: "EQUITY", invested: 1, current: 1 }) }), { params: { id: invIdA } });
    expect(put.status).toBe(404);
    const del = await invDELETE(req(`/api/investments/${invIdA}`, tokenB, { method: "DELETE" }), { params: { id: invIdA } });
    expect(del.status).toBe(404);
  });
  it("goal cross-user delete blocked", async () => {
    const del = await goalDELETE(req(`/api/goals/${goalIdA}`, tokenB, { method: "DELETE" }), { params: { id: goalIdA } });
    expect(del.status).toBe(404);
  });
  it("export contains only the current user's data", async () => {
    const res = await exportGET(req("/api/export?format=json", tokenB));
    const text = await res.text();
    expect(text).not.toContain("A secret purchase");
    expect(text).not.toContain("usera@test.dev");
    expect(text).not.toContain("passwordHash");
  });
  it("AI context for B has no A data", async () => {
    const ctx = await aiCtx.buildAiContext(idB, new Date().toISOString().slice(0, 7));
    expect(JSON.stringify(ctx)).not.toContain("A secret purchase");
    expect(ctx.summary.incomePaise).toBe(0);
  });
});

describe("RBAC & rate limiting", () => {
  it("non-admin cannot read admin overview", async () => {
    const res = await adminGET(req("/api/admin/overview", tokenA));
    expect(res.status).toBe(403);
  });
  it("login rate limited after 5 attempts", async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const res = await loginPOST(req("/api/auth/login", undefined, { method: "POST", body: JSON.stringify({ email: "ratelimit@test.dev", password: "wrongpass1" }) }));
      last = res.status;
    }
    expect(last).toBe(429);
  });
  it("validation rejects bad login payload", async () => {
    const res = await loginPOST(req("/api/auth/login", undefined, { method: "POST", body: JSON.stringify({ email: "not-an-email", password: "" }) }));
    expect(res.status).toBe(400);
  });
  it("does not disclose schema validation details", async () => {
    const res = await loginPOST(req("/api/auth/login", undefined, { method: "POST", body: JSON.stringify({ email: "not-an-email", password: "" }) }));
    expect(await res.json()).toEqual({ error: "Invalid input" });
  });
});
