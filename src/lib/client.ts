const today = new Date();
const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

const categories = [
  { id: "cat-salary", name: "Salary", kind: "INCOME", color: "#16a34a" },
  { id: "cat-freelance", name: "Freelance", kind: "INCOME", color: "#0d9488" },
  { id: "cat-investments", name: "Investments", kind: "INCOME", color: "#2563eb" },
  { id: "cat-rent", name: "Rent", kind: "EXPENSE", color: "#dc2626" },
  { id: "cat-groceries", name: "Groceries", kind: "EXPENSE", color: "#ea580c" },
  { id: "cat-utilities", name: "Utilities", kind: "EXPENSE", color: "#d97706" },
  { id: "cat-transport", name: "Transport", kind: "EXPENSE", color: "#0891b2" },
  { id: "cat-dining", name: "Dining", kind: "EXPENSE", color: "#db2777" },
  { id: "cat-shopping", name: "Shopping", kind: "EXPENSE", color: "#f43f5e" },
  { id: "cat-education", name: "Education", kind: "EXPENSE", color: "#4f46e5" }
];

const tx = [
  { id: "tx-1", type: "INCOME", amount: 95000, categoryId: "cat-salary", category: categories[0], description: "Monthly salary", notes: "", date: `${monthKey}-01`, currency: "INR" },
  { id: "tx-2", type: "INCOME", amount: 18000, categoryId: "cat-freelance", category: categories[1], description: "Freelance payout", notes: "", date: `${monthKey}-09`, currency: "INR" },
  { id: "tx-3", type: "EXPENSE", amount: 25000, categoryId: "cat-rent", category: categories[3], description: "Apartment rent", notes: "", date: `${monthKey}-03`, currency: "INR" },
  { id: "tx-4", type: "EXPENSE", amount: 7600, categoryId: "cat-groceries", category: categories[4], description: "Monthly groceries", notes: "", date: `${monthKey}-12`, currency: "INR" },
  { id: "tx-5", type: "EXPENSE", amount: 5400, categoryId: "cat-shopping", category: categories[8], description: "Nike Store", notes: "", date: `${monthKey}-20`, currency: "INR" },
  { id: "tx-6", type: "EXPENSE", amount: 2600, categoryId: "cat-utilities", category: categories[5], description: "Power and internet", notes: "", date: `${monthKey}-07`, currency: "INR" }
];

function demoResponse(url: string, options: RequestInit) {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") return { ok: true };
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  const income = 113000;
  const expense = 40600;
  const monthly = [
    { month: "2026-08", income: 90000, expense: 33000, savings: 57000 },
    { month: "2026-09", income: 104000, expense: 42100, savings: 61900 },
    { month: "2026-10", income, expense, savings: income - expense }
  ];
  const events = [{ id: "e1", action: "PUBLIC_DEMO_MODE", ip: null, createdAt: new Date().toISOString(), user: { email: "demo@fintrack.dev" } }];
  if (path === "/api/auth/me") return { user: { role: "USER", name: "Demo User" } };
  if (path === "/api/categories") return { categories };
  if (path === "/api/admin/overview") return { userCount: 1, activeCount: 1, transactionCount: tx.length, eventCount: events.length, events };
  if (path === "/api/admin/users") return { users: [{ id: "demo", name: "Demo User", email: "demo@fintrack.dev", role: "ADMIN", enabled: true, createdAt: new Date().toISOString() }] };
  if (path === "/api/dashboard") return {
    income, expense, balance: income - expense, savingsRatePct: ((income - expense) / income) * 100,
    monthly,
    categorySplit: [{ name: "Rent", value: 25000 }, { name: "Groceries", value: 7600 }, { name: "Shopping", value: 5400 }, { name: "Utilities", value: 2600 }],
    highExpense: [{ name: "Rent", value: 25000 }, { name: "Groceries", value: 7600 }, { name: "Shopping", value: 5400 }],
    budgetUse: [{ name: "Groceries", limit: 9000, used: 7600 }, { name: "Shopping", limit: 6500, used: 5400 }],
    investmentAllocation: [{ name: "Nifty Index Fund", value: 137500 }, { name: "Bluechip Equity", value: 92000 }, { name: "Fixed Deposit", value: 211000 }],
    recent: tx.slice(0, 6)
  };
  if (path === "/api/transactions") return { total: tx.length, page: 1, pageSize: 10, items: tx };
  if (path === "/api/budgets") return { budgets: [{ id: "b1", categoryId: "cat-groceries", month: monthKey, limit: 9000, used: 7600, pct: 84.4, warning: "WARNING_80", category: { name: "Groceries" } }] };
  if (path === "/api/goals") return { goals: [{ id: "g1", name: "Emergency Fund", target: 300000, saved: 132000, remaining: 168000, pct: 44, deadline: null }] };
  if (path === "/api/investments") return { investments: [
    { id: "i1", name: "Nifty Index Fund", type: "MUTUAL_FUND", invested: 120000, current: 137500, profitLoss: 17500, returnPct: 14.6, currency: "INR" },
    { id: "i2", name: "Bluechip Equity", type: "EQUITY", invested: 85000, current: 92000, profitLoss: 7000, returnPct: 8.2, currency: "INR" }
  ] };
  if (path === "/api/sips") return { sips: [{ id: "s1", name: "Nifty 50 SIP", monthly: 7500, annualRate: 12, years: 10, invested: 900000, futureValue: 1740000 }] };
  if (path === "/api/markets") return { asOf: new Date().toISOString(), indices: [
    { symbol: "^NSEI", name: "NIFTY 50", price: 24780.15, change: 112.4, changePct: 0.46, points: monthly.map((m, i) => ({ date: m.month, close: 23800 + i * 490 })) },
    { symbol: "^BSESN", name: "Sensex", price: 80720.3, change: 312.7, changePct: 0.39, points: monthly.map((m, i) => ({ date: m.month, close: 78600 + i * 1060 })) }
  ] };
  if (path === "/api/reports") {
    const type = params.get("type") ?? "monthly";
    if (type === "category") return { rows: [{ category: "Rent", amount: 25000 }, { category: "Groceries", amount: 7600 }, { category: "Shopping", amount: 5400 }] };
    if (type === "investment") return { rows: [{ name: "Nifty Index Fund", invested: 120000, current: 137500, returnPct: 14.6 }, { name: "Bluechip Equity", invested: 85000, current: 92000, returnPct: 8.2 }] };
    if (type === "budget") return { rows: [{ category: "Groceries", month: monthKey, limit: 9000, used: 7600, pct: 84.4 }] };
    if (type === "income") return { rows: [{ month: monthKey, category: "Salary", amount: 95000 }, { month: monthKey, category: "Freelance", amount: 18000 }] };
    if (type === "expense") return { rows: [{ month: monthKey, category: "Rent", amount: 25000 }, { month: monthKey, category: "Groceries", amount: 7600 }] };
    return { rows: monthly };
  }
  if (path === "/api/profile") return { profile: { id: "demo", name: "Demo User", email: "demo@fintrack.dev", currency: "INR", timezone: "Asia/Kolkata", preferences: "{}" } };
  if (path === "/api/activity") return { events };
  return {};
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
    return data as T;
  } catch (error) {
    if (typeof window !== "undefined") return demoResponse(url, options) as T;
    throw error;
  }
}
