"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, Skeleton, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";

type Tx = { id: string; type: string; amount: number; categoryId: string; category: { id: string; name: string; color: string }; description: string; notes: string; date: string; currency: string };
type TxResponse = { total: number; page: number; pageSize: number; items: Tx[] };
type Cat = { id: string; name: string; kind: string };

function TransactionsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const toast = useToast();

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== "page") p.delete("page");
    router.replace(`${pathname}?${p.toString()}`);
  }

  const queryString = params.toString();
  const { data, isLoading, isError } = useQuery({ queryKey: ["transactions", queryString], queryFn: () => apiFetch<TxResponse>(`/api/transactions?${queryString}`) });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<{ categories: Cat[] }>("/api/categories") });
  const categories = cats?.categories ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "EXPENSE", amount: "", categoryId: "", description: "", notes: "", date: new Date().toISOString().slice(0, 10) });

  function openNew() { setEditing(null); setForm({ type: "EXPENSE", amount: "", categoryId: categories[0]?.id ?? "", description: "", notes: "", date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }
  function openEdit(t: Tx) { setEditing(t); setForm({ type: t.type, amount: String(t.amount), categoryId: t.categoryId, description: t.description, notes: t.notes, date: t.date.slice(0, 10) }); setModalOpen(true); }

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) return apiFetch(`/api/transactions/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return apiFetch("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { toast(editing ? "Transaction updated" : "Transaction added"); setModalOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast("Transaction deleted"); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });

  const page = Number(params.get("page") ?? "1");
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={openNew}>+ Add transaction</Button>
      </div>

      <Card className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label htmlFor="q">Search</Label><Input id="q" placeholder="Description, category, notes" defaultValue={params.get("q") ?? ""} onBlur={(e) => setParam("q", e.target.value)} onKeyDown={(e) => e.key === "Enter" && setParam("q", (e.target as HTMLInputElement).value)} /></div>
        <div><Label htmlFor="type">Type</Label><Select id="type" value={params.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)}><option value="">All</option><option value="INCOME">Income</option><option value="EXPENSE">Expense</option></Select></div>
        <div><Label htmlFor="cat">Category</Label><Select id="cat" value={params.get("categoryId") ?? ""} onChange={(e) => setParam("categoryId", e.target.value)}><option value="">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <div><Label htmlFor="sort">Sort</Label><Select id="sort" value={params.get("sort") ?? "date_desc"} onChange={(e) => setParam("sort", e.target.value)}><option value="date_desc">Newest</option><option value="date_asc">Oldest</option><option value="amount_desc">Amount ↓</option><option value="amount_asc">Amount ↑</option></Select></div>
        <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={params.get("from") ?? ""} onChange={(e) => setParam("from", e.target.value)} /></div>
        <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={params.get("to") ?? ""} onChange={(e) => setParam("to", e.target.value)} /></div>
        <div><Label htmlFor="min">Min amount</Label><Input id="min" type="number" value={params.get("minAmount") ?? ""} onBlur={(e) => setParam("minAmount", e.target.value)} /></div>
        <div><Label htmlFor="max">Max amount</Label><Input id="max" type="number" value={params.get("maxAmount") ?? ""} onBlur={(e) => setParam("maxAmount", e.target.value)} /></div>
        <div className="col-span-2"><Button variant="outline" onClick={() => router.replace(pathname)}>Clear filters</Button></div>
      </Card>

      <Card>
        {isLoading && <Skeleton className="h-40" />}
        {isError && <p className="text-red-600">Failed to load transactions.</p>}
        {data && data.items.length === 0 && <p className="text-slate-400">No transactions found. Try adjusting filters or add one.</p>}
        {data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th className="text-right">Amount</th><th /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">{t.date.slice(0, 10)}</td>
                  <td>{t.description}</td>
                  <td><Badge>{t.category.name}</Badge></td>
                  <td>{t.type}</td>
                  <td className={`text-right ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>{t.type === "INCOME" ? "+" : "-"}{formatINR(Math.round(t.amount * 100))}</td>
                  <td className="text-right space-x-1">
                    <Button variant="ghost" onClick={() => openEdit(t)}>Edit</Button>
                    <Button variant="ghost" onClick={() => setDeleteId(t.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <Button variant="outline" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>Previous</Button>
            <span>Page {page} of {totalPages} ({data.total} total)</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setParam("page", String(page + 1))}>Next</Button>
          </div>
        )}
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit transaction" : "Add transaction"}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div><Label htmlFor="t-type">Type</Label><Select id="t-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></Select></div>
          <div><Label htmlFor="t-amount">Amount (₹)</Label><Input id="t-amount" type="number" step="0.01" min="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label htmlFor="t-cat">Category</Label><Select id="t-cat" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label htmlFor="t-desc">Description</Label><Input id="t-desc" required maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label htmlFor="t-notes">Notes</Label><Input id="t-notes" maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div><Label htmlFor="t-date">Date</Label><Input id="t-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <Button disabled={save.isPending} className="w-full">{save.isPending ? "Saving…" : "Save"}</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} title="Delete transaction" message="This will permanently remove the transaction." confirmLabel="Delete" />
    </div>
  );
}

export default function TransactionsPage() {
  return <Suspense fallback={<Skeleton className="h-64" />}><TransactionsInner /></Suspense>;
}
