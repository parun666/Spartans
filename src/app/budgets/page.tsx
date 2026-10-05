"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";

type Budget = { id: string; categoryId: string; month: string; limit: number; used: number; pct: number | null; warning: string | null; category: { name: string } };
type Cat = { id: string; name: string };

export default function BudgetsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const month = new Date().toISOString().slice(0, 7);
  const { data, isLoading } = useQuery({ queryKey: ["budgets", month], queryFn: () => apiFetch<{ budgets: Budget[] }>(`/api/budgets?month=${month}`) });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<{ categories: Cat[] }>("/api/categories") });
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");

  const save = useMutation({
    mutationFn: () => apiFetch("/api/budgets", { method: "POST", body: JSON.stringify({ categoryId, limit: Number(limit), month }) }),
    onSuccess: () => { toast("Budget saved"); setLimit(""); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Budgets — {month}</h1>
      <Card>
        <CardTitle>Set a budget</CardTitle>
        <form className="mt-3 flex flex-wrap gap-3 items-end" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div><Label htmlFor="b-cat">Category</Label><Select id="b-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Select…</option>{cats?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label htmlFor="b-limit">Monthly limit (₹)</Label><Input id="b-limit" type="number" min="1" step="0.01" required value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
          <Button disabled={save.isPending || !categoryId}>Save</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Budget usage (derived from transactions)</CardTitle>
        {isLoading && <Skeleton className="h-32 mt-3" />}
        {data && data.budgets.length === 0 && <p className="text-slate-400 mt-3">No budgets set for this month.</p>}
        <div className="space-y-4 mt-3">
          {data?.budgets.map((b) => (
            <div key={b.id}>
              <div className="flex justify-between text-sm">
                <span>{b.category.name}</span>
                <span>{formatINR(Math.round(b.used * 100))} / {formatINR(Math.round(b.limit * 100))} {b.warning === "EXCEEDED" && <Badge tone="red">Over budget</Badge>}{b.warning === "WARNING_80" && <Badge tone="amber">80%+ used</Badge>}</span>
              </div>
              <div className="h-2 rounded bg-slate-200 mt-1">
                <div className={`h-2 rounded ${b.pct !== null && b.pct >= 100 ? "bg-red-500" : b.pct !== null && b.pct >= 80 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, b.pct ?? 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
