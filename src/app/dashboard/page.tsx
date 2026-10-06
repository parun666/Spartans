"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatINR } from "@/lib/money";
import { useToast } from "@/components/Toast";

const ChartLoading = () => <div className="h-[260px] animate-pulse rounded bg-slate-100" aria-label="Loading chart" />;
const IncomeExpenseBar = dynamic(() => import("@/components/charts/Charts").then((module) => module.IncomeExpenseBar), { loading: ChartLoading });
const CategorySpendBar = dynamic(() => import("@/components/charts/Charts").then((module) => module.CategorySpendBar), { loading: ChartLoading });
const BudgetUseBar = dynamic(() => import("@/components/charts/Charts").then((module) => module.BudgetUseBar), { loading: ChartLoading });
const MonthlySpendLine = dynamic(() => import("@/components/charts/Charts").then((module) => module.MonthlySpendLine), { loading: ChartLoading });
const MonthlySavingsLine = dynamic(() => import("@/components/charts/Charts").then((module) => module.MonthlySavingsLine), { loading: ChartLoading });

type DashboardData = {
  income: number; expense: number; balance: number; savingsRatePct: number | null;
  rangeMonths: number;
  monthly: { month: string; income: number; expense: number; savings: number }[];
  categorySplit: { name: string; value: number }[];
  highExpense: { name: string; value: number }[];
  budgetUse: { name: string; limit: number; used: number }[];
  investmentAllocation: { name: string; value: number }[];
  recent: { id: string; type: string; amount: number; category: string; description: string; date: string }[];
};
type Cat = { id: string; name: string; kind: string };

export default function DashboardPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [months, setMonths] = useState(6);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["dashboard", months], queryFn: () => apiFetch<DashboardData>(`/api/dashboard?months=${months}`) });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<{ categories: Cat[] }>("/api/categories") });
  const categories = useMemo(() => cats?.categories ?? [], [cats?.categories]);
  const [quick, setQuick] = useState({ type: "INCOME", amount: "", description: "Quick entry", categoryId: "" });
  const matchingCategories = useMemo(() => categories.filter((c) => c.kind === quick.type || c.kind === "BOTH"), [categories, quick.type]);

  useEffect(() => {
    if (!matchingCategories.length) return;
    if (!matchingCategories.some((c) => c.id === quick.categoryId)) setQuick((q) => ({ ...q, categoryId: matchingCategories[0].id }));
  }, [matchingCategories, quick.categoryId]);

  const addQuick = useMutation({
    mutationFn: () => apiFetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify({ ...quick, amount: Number(quick.amount), date: new Date().toISOString().slice(0, 10), notes: "" })
    }),
    onSuccess: () => {
      toast(quick.type === "INCOME" ? "Earned amount added" : "Spent amount subtracted");
      setQuick((q) => ({ ...q, amount: "", description: "Quick entry" }));
      qc.invalidateQueries();
    },
    onError: (e) => toast((e as Error).message, "error")
  });
  const addSampleData = useMutation({
    mutationFn: () => apiFetch("/api/demo/sample-data", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => {
      toast("Sample history is ready; existing records were not changed.");
      qc.invalidateQueries();
    },
    onError: (error) => toast((error as Error).message, "error")
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (isError || !data) return <Card><p className="text-red-600">Could not load dashboard.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Preview monthly savings, high expenditure, and your latest money movement.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <div>
            <Label htmlFor="analysis-period">Analysis period</Label>
            <Select id="analysis-period" value={months} onChange={(event) => setMonths(Number(event.target.value))}>
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
            </Select>
          </div>
          <Button
            variant="outline"
            className="self-end"
            disabled={addSampleData.isPending}
            onClick={() => {
              if (window.confirm("Add fictional sample records for this period? Existing financial records will not be changed.")) {
                addSampleData.mutate();
              }
            }}
          >
            {addSampleData.isPending ? "Adding samples…" : "Add 1-year sample data"}
          </Button>
          <Button variant="outline" onClick={() => { qc.invalidateQueries(); refetch(); }} aria-label="Refresh">Refresh</Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">Transaction trends and category analysis use the selected period. Budget use and investment allocation show current snapshots.</p>
      <p className="text-xs text-slate-500">Sample data covers the past 12 months, is fictional, and is added only when requested. Existing financial records are never reset or replaced.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardTitle>Income</CardTitle><p className="text-xl font-bold text-green-600">{formatINR(Math.round(data.income * 100))}</p></Card>
        <Card><CardTitle>Expenses</CardTitle><p className="text-xl font-bold text-red-600">{formatINR(Math.round(data.expense * 100))}</p></Card>
        <Card><CardTitle>Balance</CardTitle><p className="text-xl font-bold">{formatINR(Math.round(data.balance * 100))}</p></Card>
        <Card><CardTitle>Savings rate</CardTitle><p className="text-xl font-bold">{data.savingsRatePct === null ? "Unavailable" : `${data.savingsRatePct.toFixed(1)}%`}</p></Card>
      </div>

      <Card>
        <CardTitle>Quick earn / spend entry</CardTitle>
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3" onSubmit={(e) => { e.preventDefault(); addQuick.mutate(); }}>
          <div><Label htmlFor="quick-type">Action</Label><Select id="quick-type" value={quick.type} onChange={(e) => setQuick({ ...quick, type: e.target.value, categoryId: "" })}><option value="INCOME">I earned</option><option value="EXPENSE">I spent</option></Select></div>
          <div><Label htmlFor="quick-amount">Amount</Label><Input id="quick-amount" type="number" min="0.01" step="0.01" required placeholder="5000" value={quick.amount} onChange={(e) => setQuick({ ...quick, amount: e.target.value })} /></div>
          <div><Label htmlFor="quick-category">Category</Label><Select id="quick-category" value={quick.categoryId} onChange={(e) => setQuick({ ...quick, categoryId: e.target.value })}>{matchingCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label htmlFor="quick-description">Description</Label><Input id="quick-description" required maxLength={200} value={quick.description} onChange={(e) => setQuick({ ...quick, description: e.target.value })} /></div>
          <Button className="self-end" disabled={addQuick.isPending}>{quick.type === "INCOME" ? "Add income" : "Subtract spend"}</Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardTitle>Income vs Expense</CardTitle>{data.monthly.length ? <IncomeExpenseBar data={data.monthly} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Monthly savings</CardTitle>{data.monthly.length ? <MonthlySavingsLine data={data.monthly} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>High expenditure trend</CardTitle>{data.monthly.length ? <MonthlySpendLine data={data.monthly} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Highest expense categories</CardTitle>{data.highExpense.length ? <CategorySpendBar data={data.highExpense} /> : <p className="text-slate-400">No expenses yet.</p>}</Card>
        <Card><CardTitle>Category breakdown</CardTitle>{data.categorySplit.length ? <CategorySpendBar data={data.categorySplit} /> : <p className="text-slate-400">No data yet.</p>}</Card>
        <Card><CardTitle>Budget use</CardTitle>{data.budgetUse.length ? <BudgetUseBar data={data.budgetUse} /> : <p className="text-slate-400">No budgets this month.</p>}</Card>
        <Card><CardTitle>Investment allocation</CardTitle>{data.investmentAllocation.length ? <CategorySpendBar data={data.investmentAllocation} /> : <p className="text-slate-400">No investments.</p>}</Card>
        <Card><CardTitle>Recent activity</CardTitle>
          {data.recent.length === 0 && <p className="text-slate-400">No transactions yet.</p>}
          <ul className="divide-y">
            {data.recent.map((t) => (
              <li key={t.id} className="py-2 flex justify-between text-sm gap-3">
                <span className="min-w-0 truncate">{t.description} <span className="text-slate-400">- {t.category}</span></span>
                <span className={t.type === "INCOME" ? "text-green-600" : "text-red-600"}>{t.type === "INCOME" ? "+" : "-"}{formatINR(Math.round(t.amount * 100))}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
