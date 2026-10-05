"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";

type Inv = { id: string; name: string; type: string; invested: number; current: number; profitLoss: number; returnPct: number | null; currency: string };

export default function InvestmentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["investments"], queryFn: () => apiFetch<{ investments: Inv[] }>("/api/investments") });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inv | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "EQUITY", invested: "", current: "" });

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, invested: Number(form.invested), current: Number(form.current) };
      return editing ? apiFetch(`/api/investments/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch("/api/investments", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { toast(editing ? "Investment updated" : "Investment added"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const remove = useMutation({ mutationFn: (id: string) => apiFetch(`/api/investments/${id}`, { method: "DELETE" }), onSuccess: () => { toast("Deleted"); qc.invalidateQueries(); } });

  const totals = (data?.investments ?? []).reduce((acc, i) => ({ invested: acc.invested + i.invested, current: acc.current + i.current }), { invested: 0, current: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: "", type: "EQUITY", invested: "", current: "" }); setOpen(true); }}>+ Add</Button>
      </div>
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Market data unavailable — showing user-entered valuation.</p>
      <Card><CardTitle>Portfolio total</CardTitle>
        <p className="text-sm">Invested: {formatINR(Math.round(totals.invested * 100))} · Current: {formatINR(Math.round(totals.current * 100))} · P/L: {formatINR(Math.round((totals.current - totals.invested) * 100))}</p>
      </Card>
      {isLoading && <Skeleton className="h-32" />}
      {data && data.investments.length === 0 && <Card><p className="text-slate-400">No investments yet.</p></Card>}
      {data?.investments.map((i) => (
        <Card key={i.id}>
          <div className="flex justify-between">
            <div><p className="font-semibold">{i.name} <span className="text-xs text-slate-400">{i.type}</span></p>
              <p className="text-sm text-slate-500">Invested {formatINR(Math.round(i.invested * 100))} · Current {formatINR(Math.round(i.current * 100))}</p>
            </div>
            <div className="text-right">
              <p className={i.profitLoss >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{i.profitLoss >= 0 ? "+" : ""}{formatINR(Math.round(i.profitLoss * 100))}</p>
              <p className="text-sm text-slate-500">{i.returnPct === null ? "Return unavailable (invested ₹0)" : `${i.returnPct.toFixed(1)}%`}</p>
              <div className="mt-1 space-x-1">
                <Button variant="ghost" onClick={() => { setEditing(i); setForm({ name: i.name, type: i.type, invested: String(i.invested), current: String(i.current) }); setOpen(true); }}>Edit</Button>
                <Button variant="ghost" onClick={() => setDelId(i.id)}>Delete</Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit investment" : "Add investment"}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div><Label htmlFor="i-name">Name</Label><Input id="i-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="i-type">Type</Label><Select id="i-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["EQUITY", "MUTUAL_FUND", "FD", "CRYPTO", "OTHER"].map((t) => <option key={t}>{t}</option>)}</Select></div>
          <div><Label htmlFor="i-inv">Invested (₹)</Label><Input id="i-inv" type="number" min="0" step="0.01" required value={form.invested} onChange={(e) => setForm({ ...form, invested: e.target.value })} /></div>
          <div><Label htmlFor="i-cur">Current value (₹)</Label><Input id="i-cur" type="number" min="0" step="0.01" required value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
          <Button disabled={save.isPending} className="w-full">Save</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delId && remove.mutate(delId)} title="Delete investment" message="Remove this investment permanently?" confirmLabel="Delete" />
    </div>
  );
}
