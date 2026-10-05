"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncomeExpenseBar, CategorySplitPie, BudgetUseBar, AllocationPie, MonthlySpendLine } from "@/components/charts/Charts";
import { formatINR } from "@/lib/money";

type DashboardData = {
  income: number; expense: number; balance: number; savingsRatePct: number | null;
  monthly: { month: string; income: number; expense: number }[];
  categorySplit: { name: string; value: number }[];
  budgetUse: { name: string; limit: number; used: number }[];
  investmentAllocation: { name: string; value: number }[];
  recent: { id: string; type: string; amount: number; category: string; description: string; date: string }[];
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => apiFetch<DashboardData>("/api/dashboard") });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (isError || !data) return <Card><p className="text-red-600">Could not load dashboard.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => { qc.invalidateQueries(); refetch(); }} aria-label="Refresh">↻ Refresh</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardTitle>Income</CardTitle><p className="text-xl font-bold text-green-600">{formatINR(Math.round(data.income * 100))}</p></Card>
        <Card><CardTitle>Expenses</CardTitle><p className="text-xl font-bold text-red-600">{formatINR(Math.round(data.expense * 100))}</p></Card>
        <Card><CardTitle>Balance</CardTitle><p className="text-xl font-bold">{formatINR(Math.round(data.balance * 100))}</p></Card>
        <Card><CardTitle>Savings rate</CardTitle><p className="text-xl font-bold">{data.savingsRatePct === null ? "Unavailable (no recorded income)" : `${data.savingsRatePct.toFixed(1)}%`}</p></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardTitle>Income vs Expense</CardTitle>{data.monthly.length ? <IncomeExpenseBar data={data.monthly} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Monthly spend</CardTitle>{data.monthly.length ? <MonthlySpendLine data={data.monthly} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Category split</CardTitle>{data.categorySplit.length ? <CategorySplitPie data={data.categorySplit} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Budget use</CardTitle>{data.budgetUse.length ? <BudgetUseBar data={data.budgetUse} /> : <p className="text-slate-400">No budgets this month.</p>}</Card>
        <Card><CardTitle>Investment allocation</CardTitle>{data.investmentAllocation.length ? <AllocationPie data={data.investmentAllocation} /> : <p className="text-slate-400">No investments.</p>}</Card>
        <Card><CardTitle>Recent activity</CardTitle>
          {data.recent.length === 0 && <p className="text-slate-400">No transactions yet.</p>}
          <ul className="divide-y">
            {data.recent.map((t) => (
              <li key={t.id} className="py-2 flex justify-between text-sm">
                <span>{t.description} · <span className="text-slate-400">{t.category}</span></span>
                <span className={t.type === "INCOME" ? "text-green-600" : "text-red-600"}>{t.type === "INCOME" ? "+" : "-"}{formatINR(Math.round(t.amount * 100))}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
