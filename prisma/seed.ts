import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

async function main() {
  // Default categories (userId null)
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await prisma.category.findFirst({ where: { userId: null, name: c.name } });
    if (!exists) await prisma.category.create({ data: { ...c, userId: null } });
  }

  let demo: { id: string } | null = null;
  if (process.env.NODE_ENV !== "production") {
    const demoPassword = process.env.DEMO_USER_PASSWORD;
    if (demoPassword) {
      demo = await prisma.user.upsert({
        where: { email: "demo@fintrack.dev" },
        update: {},
        create: { email: "demo@fintrack.dev", name: "Demo User", passwordHash: await bcrypt.hash(demoPassword, 10), role: "USER" }
      });
    }
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
    if (adminPassword) {
      await prisma.user.upsert({
        where: { email: "admin@fintrack.dev" },
        update: {},
        create: { email: "admin@fintrack.dev", name: "Demo Admin", passwordHash: await bcrypt.hash(adminPassword, 10), role: "ADMIN" }
      });
    }
  }

  const txCount = demo ? await prisma.transaction.count({ where: { userId: demo.id } }) : 0;
  if (demo && txCount === 0) {
    const cats = await prisma.category.findMany({ where: { userId: null } });
    const byName = new Map(cats.map((c) => [c.name, c]));
    const now = new Date();
    const samples: { cat: string; type: string; amount: number; desc: string; daysAgo: number }[] = [
      { cat: "Salary", type: "INCOME", amount: 8500000, desc: "Monthly salary", daysAgo: 20 },
      { cat: "Freelance", type: "INCOME", amount: 1500000, desc: "Design project", daysAgo: 12 },
      { cat: "Rent", type: "EXPENSE", amount: 2500000, desc: "Monthly rent", daysAgo: 18 },
      { cat: "Groceries", type: "EXPENSE", amount: 650000, desc: "Supermarket", daysAgo: 5 },
      { cat: "Utilities", type: "EXPENSE", amount: 220000, desc: "Electricity bill", daysAgo: 8 },
      { cat: "Dining", type: "EXPENSE", amount: 180000, desc: "Dinner with friends", daysAgo: 3 },
      { cat: "Transport", type: "EXPENSE", amount: 120000, desc: "Fuel", daysAgo: 6 },
      { cat: "Entertainment", type: "EXPENSE", amount: 90000, desc: "Movie tickets", daysAgo: 2 },
      { cat: "Shopping", type: "EXPENSE", amount: 340000, desc: "Clothing", daysAgo: 10 },
      { cat: "Education", type: "EXPENSE", amount: 500000, desc: "Online course", daysAgo: 15 }
    ];
    for (const s of samples) {
      const cat = byName.get(s.cat)!;
      await prisma.transaction.create({
        data: { userId: demo.id, type: s.type, amountPaise: s.amount, currency: "INR", categoryId: cat.id, description: s.desc, date: new Date(now.getTime() - s.daysAgo * 86400000) }
      });
    }
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (const [name, limit] of [["Groceries", 800000], ["Dining", 300000], ["Shopping", 500000], ["Transport", 200000]] as const) {
      const cat = byName.get(name)!;
      await prisma.budget.create({ data: { userId: demo.id, categoryId: cat.id, limitPaise: limit, month, currency: "INR" } });
    }
    await prisma.investment.createMany({
      data: [
        { userId: demo.id, name: "Index Fund", type: "MUTUAL_FUND", investedPaise: 10000000, currentPaise: 11200000 },
        { userId: demo.id, name: "Tech Stocks", type: "EQUITY", investedPaise: 5000000, currentPaise: 4600000 },
        { userId: demo.id, name: "Fixed Deposit", type: "FD", investedPaise: 20000000, currentPaise: 21000000 }
      ]
    });
    await prisma.sip.create({ data: { userId: demo.id, name: "Monthly Index SIP", monthlyPaise: 500000, annualRate: 12, years: 10 } });
    await prisma.goal.createMany({
      data: [
        { userId: demo.id, name: "Emergency Fund", targetPaise: 30000000, savedPaise: 12000000 },
        { userId: demo.id, name: "Vacation", targetPaise: 10000000, savedPaise: 3500000 }
      ]
    });
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
