"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { useToast } from "@/components/Toast";
import { IncomeExpenseBar, CategorySplitPie } from "@/components/charts/Charts";

type Row = Record<string, string | number | null>;

export default function ReportsPage() {
  const toast = useToast();
  const [type, setType] = useState("monthly");
  const { data, isLoading } = useQuery({ queryKey: ["reports", type], queryFn: () => apiFetch<{ rows: Row[] }>(`/api/reports?type=${type}`) });

  async function exportFile(format: "csv" | "json") {
    const res = await fetch(`/api/export?format=${format}`);
    if (!res.ok) { toast("Export failed", "error"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fintrack-export.${format}`; a.click();
    URL.revokeObjectURL(url);
    toast("Export generated successfully.");
  }

  const rows = data?.rows ?? [];
  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports & Export</h1>
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div><Label htmlFor="r-type">Report</Label>
            <Select id="r-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="monthly">Monthly income/expense</option>
              <option value="category">Category (expenses)</option>
              <option value="income">Income by month & category</option>
              <option value="expense">Expense by month & category</option>
              <option value="budget">Budget usage</option>
              <option value="investment">Investments</option>
            </Select>
          </div>
          <Button variant="outline" onClick={() => exportFile("csv")}>Export CSV</Button>
          <Button variant="outline" onClick={() => exportFile("json")}>Export JSON</Button>
        </div>
      </Card>
      <Card>
        <CardTitle>{type} report</CardTitle>
        {isLoading && <Skeleton className="h-48 mt-3" />}
        {rows.length === 0 && !isLoading && <p className="text-slate-400 mt-3">No data for this report.</p>}
        {type === "monthly" && rows.length > 0 && <IncomeExpenseBar data={rows as unknown as { month: string; income: number; expense: number }[]} />}
        {type === "category" && rows.length > 0 && <CategorySplitPie data={(rows as { category: string; amount: number }[]).map((r) => ({ name: r.category, value: r.amount }))} />}
        {rows.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500">{columns.map((c) => <th key={c} className="capitalize">{c}</th>)}</tr></thead>
              <tbody className="divide-y">
                {rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c} className="py-1 pr-4">{r[c] === null ? "—" : String(r[c])}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
