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
  for (const category of DEFAULT_CATEGORIES) {
    const exists = await prisma.category.findFirst({ where: { userId: null, name: category.name } });
    if (!exists) await prisma.category.create({ data: { ...category, userId: null } });
  }
}

export async function addSampleDataForUser(userId: string) {
  await ensureDefaultCategories();
  const categories = await prisma.category.findMany({ where: { userId: null } });
  const byName = new Map(categories.map((category) => [category.name, category]));
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const samples = [
    { category: "Salary", type: "INCOME", amountPaise: 9_000_000, day: 1, description: "Sample monthly salary" },
    { category: "Rent", type: "EXPENSE", amountPaise: 2_500_000, day: 2, description: "Sample apartment rent" },
    { category: "Groceries", type: "EXPENSE", amountPaise: 650_000, day: 3, description: "Sample groceries" },
    { category: "Utilities", type: "EXPENSE", amountPaise: 220_000, day: 4, description: "Sample utilities" },
    { category: "Dining", type: "EXPENSE", amountPaise: 180_000, day: 5, description: "Sample dining" }
  ] as const;

  for (let offset = -11; offset <= 0; offset++) {
    const monthStart = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + offset, 1));
    const monthKey = monthStart.toISOString().slice(0, 7);
    const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();

    for (const [index, sample] of samples.entries()) {
      const category = byName.get(sample.category);
      if (!category) throw new Error(`Required sample category is missing: ${sample.category}`);
      const day = Math.min(sample.day, daysInMonth, offset === 0 ? now.getUTCDate() : daysInMonth);
      const amountVariance = (monthStart.getUTCMonth() % 4) * 25_000;
      await prisma.transaction.upsert({
        where: { id: `sample_${userId}_${monthKey.replace("-", "")}_${index}` },
        update: {},
        create: {
          id: `sample_${userId}_${monthKey.replace("-", "")}_${index}`,
          userId,
          type: sample.type,
          amountPaise: sample.amountPaise + amountVariance,
          currency: "INR",
          categoryId: category.id,
          description: sample.description,
          date: new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day, 12))
        }
      });
    }

    for (const [name, limitPaise] of [["Groceries", 900_000], ["Dining", 350_000], ["Transport", 240_000]] as const) {
      const category = byName.get(name);
      if (!category) throw new Error(`Required sample category is missing: ${name}`);
      await prisma.budget.upsert({
        where: { userId_categoryId_month: { userId, categoryId: category.id, month: monthKey } },
        update: {},
        create: { userId, categoryId: category.id, limitPaise, month: monthKey, currency: "INR" }
      });
    }
  }

  for (const investment of [
    { id: `sample_${userId}_investment_index`, name: "Sample Nifty Index Fund", type: "MUTUAL_FUND", investedPaise: 12_000_000, currentPaise: 13_750_000 },
    { id: `sample_${userId}_investment_equity`, name: "Sample Bluechip Equity", type: "EQUITY", investedPaise: 8_500_000, currentPaise: 9_200_000 },
    { id: `sample_${userId}_investment_deposit`, name: "Sample Fixed Deposit", type: "FD", investedPaise: 20_000_000, currentPaise: 21_100_000 }
  ]) {
    await prisma.investment.upsert({
      where: { id: investment.id },
      update: {},
      create: { ...investment, userId, currency: "INR" }
    });
  }

  await prisma.sip.upsert({
    where: { id: `sample_${userId}_sip` },
    update: {},
    create: { id: `sample_${userId}_sip`, userId, name: "Sample Nifty 50 SIP", monthlyPaise: 750_000, annualRate: 12, years: 10 }
  });
  await prisma.goal.upsert({
    where: { id: `sample_${userId}_goal_emergency` },
    update: {},
    create: { id: `sample_${userId}_goal_emergency`, userId, name: "Sample Emergency Fund", targetPaise: 30_000_000, savedPaise: 13_200_000 }
  });
  await prisma.goal.upsert({
    where: { id: `sample_${userId}_goal_laptop` },
    update: {},
    create: { id: `sample_${userId}_goal_laptop`, userId, name: "Sample Laptop Upgrade", targetPaise: 16_000_000, savedPaise: 7_600_000 }
  });
}
