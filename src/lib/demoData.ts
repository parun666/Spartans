import { prisma } from "@/lib/db";

const DEFAULT_CATEGORIES: { name: string; kind: string; color: string }[] = [
  { name: "Salary", kind: "INCOME", color: "#16a34a" },
  { name: "Freelance", kind: "INCOME", color: "#0d9488" },
  { name: "Investments", kind: "INCOME", color: "#2563eb" },
  { name: "Other Income", kind: "INCOME", color: "#7c3aed" },
  { name: "Groceries", kind: "EXPENSE", color: "#ea580c" },
  { name: "Rent", kind: "EXPENSE", color: "#dc2626" },
  { name: "Utilities", kind: "EXPENSE", color: "#d97706" },
  { name: "Transport", kind: "EXPENSE", color: "#0891b2" },
  { name: "Dining", kind: "EXPENSE", color: "#db2777" },
  { name: "Health", kind: "EXPENSE", color: "#65a30d" },
  { name: "Entertainment", kind: "EXPENSE", color: "#9333ea" },
  { name: "Shopping", kind: "EXPENSE", color: "#f43f5e" },
  { name: "Education", kind: "EXPENSE", color: "#4f46e5" },
  { name: "Other Expense", kind: "EXPENSE", color: "#64748b" }
];

export async function ensureDefaultCategories() {
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await prisma.category.findFirst({ where: { userId: null, name: c.name } });
    if (!exists) await prisma.category.create({ data: { ...c, userId: null } });
  }
}

export async function resetDemoDataForUser(userId: string) {
  await ensureDefaultCategories();
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.sip.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } })
  ]);

  const cats = await prisma.category.findMany({ where: { userId: null } });
  const byName = new Map(cats.map((c) => [c.name, c]));
  const now = new Date();
  const month = (offset: number, day: number) => new Date(now.getFullYear(), now.getMonth() + offset, day);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const tx: { cat: string; type: string; amountPaise: number; desc: string; date: Date }[] = [
    { cat: "Salary", type: "INCOME", amountPaise: 9500000, desc: "Monthly salary", date: month(0, 1) },
    { cat: "Freelance", type: "INCOME", amountPaise: 1800000, desc: "Freelance payout", date: month(0, 9) },
    { cat: "Investments", type: "INCOME", amountPaise: 420000, desc: "Dividend credit", date: month(0, 18) },
    { cat: "Rent", type: "EXPENSE", amountPaise: 2500000, desc: "Apartment rent", date: month(0, 3) },
    { cat: "Groceries", type: "EXPENSE", amountPaise: 760000, desc: "Monthly groceries", date: month(0, 12) },
    { cat: "Dining", type: "EXPENSE", amountPaise: 290000, desc: "Team dinner", date: month(0, 16) },
    { cat: "Transport", type: "EXPENSE", amountPaise: 180000, desc: "Fuel and metro", date: month(0, 11) },
    { cat: "Utilities", type: "EXPENSE", amountPaise: 260000, desc: "Power and internet", date: month(0, 7) },
    { cat: "Shopping", type: "EXPENSE", amountPaise: 540000, desc: "Nike Store", date: month(0, 20) },
    { cat: "Salary", type: "INCOME", amountPaise: 9200000, desc: "Monthly salary", date: month(-1, 1) },
    { cat: "Freelance", type: "INCOME", amountPaise: 1200000, desc: "Client milestone", date: month(-1, 13) },
    { cat: "Rent", type: "EXPENSE", amountPaise: 2500000, desc: "Apartment rent", date: month(-1, 3) },
    { cat: "Groceries", type: "EXPENSE", amountPaise: 690000, desc: "Groceries", date: month(-1, 14) },
    { cat: "Education", type: "EXPENSE", amountPaise: 500000, desc: "Course subscription", date: month(-1, 20) },
    { cat: "Salary", type: "INCOME", amountPaise: 9000000, desc: "Monthly salary", date: month(-2, 1) },
    { cat: "Rent", type: "EXPENSE", amountPaise: 2500000, desc: "Apartment rent", date: month(-2, 3) },
    { cat: "Health", type: "EXPENSE", amountPaise: 330000, desc: "Medical checkup", date: month(-2, 22) },
    { cat: "Entertainment", type: "EXPENSE", amountPaise: 160000, desc: "Movie night", date: month(-2, 26) }
  ];

  for (const t of tx) {
    const cat = byName.get(t.cat);
    if (!cat) continue;
    await prisma.transaction.create({
      data: { userId, type: t.type, amountPaise: t.amountPaise, currency: "INR", categoryId: cat.id, description: t.desc, date: t.date }
    });
  }

  for (const [name, limitPaise] of [["Groceries", 900000], ["Dining", 350000], ["Shopping", 650000], ["Transport", 240000]] as const) {
    const cat = byName.get(name);
    if (cat) await prisma.budget.create({ data: { userId, categoryId: cat.id, limitPaise, month: currentMonth, currency: "INR" } });
  }

  await prisma.investment.createMany({
    data: [
      { userId, name: "Nifty Index Fund", type: "MUTUAL_FUND", investedPaise: 12000000, currentPaise: 13750000 },
      { userId, name: "Bluechip Equity", type: "EQUITY", investedPaise: 8500000, currentPaise: 9200000 },
      { userId, name: "Fixed Deposit", type: "FD", investedPaise: 20000000, currentPaise: 21100000 }
    ]
  });
  await prisma.sip.create({ data: { userId, name: "Nifty 50 SIP", monthlyPaise: 750000, annualRate: 12, years: 10 } });
  await prisma.goal.createMany({
    data: [
      { userId, name: "Emergency Fund", targetPaise: 30000000, savedPaise: 13200000 },
      { userId, name: "Laptop Upgrade", targetPaise: 16000000, savedPaise: 7600000 }
    ]
  });
}
