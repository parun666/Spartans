"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";
import { sipFutureValuePaise } from "@/lib/finance";

type Inv = { id: string; name: string; type: string; invested: number; current: number; profitLoss: number; returnPct: number | null; currency: string };
type MarketIndex = { symbol: string; name: string; price: number | null; change: number | null; changePct: number | null; points: { date: string; close: number }[]; error?: string };

export default function InvestmentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["investments"], queryFn: () => apiFetch<{ investments: Inv[] }>("/api/investments") });
  const { data: market, isLoading: marketsLoading, isError: marketsError, error: marketError, refetch: refetchMarkets } = useQuery({ queryKey: ["markets"], queryFn: () => apiFetch<{ indices: MarketIndex[]; asOf: string }>("/api/markets"), retry: 1 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inv | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "MUTUAL_FUND", invested: "", current: "" });
  const [sip, setSip] = useState({ name: "Nifty 50 SIP", monthly: "5000", annualRate: "12", years: "10" });

  const sipPlan = useMemo(() => sipFutureValuePaise(Math.round(Number(sip.monthly) * 100) || 0, Number(sip.annualRate), Number(sip.years)), [sip]);
  const sipChart = sipPlan.schedule.filter((_, i) => i % 6 === 0 || i === sipPlan.schedule.length - 1).map((s) => ({ month: s.month, value: s.valuePaise / 100, invested: s.investedPaise / 100 }));

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, invested: Number(form.invested), current: Number(form.current) };
      return editing ? apiFetch(`/api/investments/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch("/api/investments", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { toast(editing ? "Investment updated" : "Investment added"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const saveSip = useMutation({
    mutationFn: () => apiFetch("/api/sips", { method: "POST", body: JSON.stringify({ name: sip.name, monthly: Number(sip.monthly), annualRate: Number(sip.annualRate), years: Number(sip.years) }) }),
    onSuccess: () => { toast("SIP saved"); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const remove = useMutation({ mutationFn: (id: string) => apiFetch(`/api/investments/${id}`, { method: "DELETE" }), onSuccess: () => { toast("Deleted"); qc.invalidateQueries(); } });

  const totals = (data?.investments ?? []).reduce((acc, i) => ({ invested: acc.invested + i.invested, current: acc.current + i.current }), { invested: 0, current: 0 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investments</h1>
          <p className="text-sm text-slate-500">Invest in SIPs or track any investment firm, equity, fund, or FD.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", type: "MUTUAL_FUND", invested: "", current: "" }); setOpen(true); }}>+ Add investment</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>NIFTY 50 and Sensex</CardTitle>
            <Button variant="outline" onClick={() => refetchMarkets()}>Refresh prices</Button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Uses delayed market chart data when the server can reach the market source.</p>
          {marketsLoading && <Skeleton className="h-64 mt-3" />}
          {marketsError && <p role="alert" className="mt-3 text-sm text-red-600">Could not load market prices: {marketError.message} <button className="underline" onClick={() => refetchMarkets()}>Retry</button></p>}
          {market?.asOf && <p className="mt-1 text-xs text-slate-400">Data checked {new Date(market.asOf).toLocaleString("en-IN")}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {market?.indices.map((index) => (
              <div key={index.symbol} className="rounded border p-3">
                <div className="flex justify-between gap-3">
                  <div><p className="font-semibold">{index.name}</p><p className="text-xs text-slate-500">{index.symbol}</p></div>
                  <div className="text-right">
                    <p className="font-bold">{index.price === null ? "Unavailable" : index.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    {index.changePct !== null && <p className={index.changePct >= 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>{index.changePct >= 0 ? "+" : ""}{index.changePct.toFixed(2)}%</p>}
                  </div>
                </div>
                {index.error && <p className="mt-3 text-sm text-amber-700">Live data unavailable: {index.error}</p>}
                {index.points.length > 0 && (
                  <ResponsiveContainer width="100%" height={190} className="mt-3">
                    <LineChart data={index.points}>
                      <XAxis dataKey="date" hide /><YAxis domain={["auto", "auto"]} width={50} /><Tooltip /><Line type="monotone" dataKey="close" stroke="#2563eb" dot={false} name={index.name} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>SIP / investment planner</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div><Label htmlFor="sip-name">Plan name</Label><Input id="sip-name" value={sip.name} onChange={(e) => setSip({ ...sip, name: e.target.value })} /></div>
            <div><Label htmlFor="sip-monthly">Monthly amount</Label><Input id="sip-monthly" type="number" min="1" value={sip.monthly} onChange={(e) => setSip({ ...sip, monthly: e.target.value })} /></div>
            <div><Label htmlFor="sip-rate">Annual return %</Label><Input id="sip-rate" type="number" min="0" max="100" value={sip.annualRate} onChange={(e) => setSip({ ...sip, annualRate: e.target.value })} /></div>
            <div><Label htmlFor="sip-years">Years</Label><Input id="sip-years" type="number" min="1" max="50" value={sip.years} onChange={(e) => setSip({ ...sip, years: e.target.value })} /></div>
          </div>
          <p className="mt-3 text-sm">Invested: <b>{formatINR(sipPlan.investedPaise)}</b> | Projected value: <b className="text-green-600">{formatINR(sipPlan.futureValuePaise)}</b></p>
          <ResponsiveContainer width="100%" height={240} className="mt-3">
            <LineChart data={sipChart}>
              <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line dataKey="value" stroke="#22c55e" name="Projected value" /><Line dataKey="invested" stroke="#94a3b8" name="Invested" />
            </LineChart>
          </ResponsiveContainer>
          <Button className="mt-3" onClick={() => saveSip.mutate()} disabled={saveSip.isPending}>Save SIP plan</Button>
        </Card>
      </div>

      <Card><CardTitle>Portfolio total</CardTitle>
        <p className="text-sm">Invested: {formatINR(Math.round(totals.invested * 100))} | Current: {formatINR(Math.round(totals.current * 100))} | P/L: {formatINR(Math.round((totals.current - totals.invested) * 100))}</p>
      </Card>
      {isLoading && <Skeleton className="h-32" />}
      {data && data.investments.length === 0 && <Card><p className="text-slate-400">No investments yet.</p></Card>}
      {data?.investments.map((i) => (
        <Card key={i.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div><p className="font-semibold">{i.name} <span className="text-xs text-slate-400">{i.type}</span></p>
              <p className="text-sm text-slate-500">Invested {formatINR(Math.round(i.invested * 100))} | Current {formatINR(Math.round(i.current * 100))}</p>
            </div>
            <div className="sm:text-right">
              <p className={i.profitLoss >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{i.profitLoss >= 0 ? "+" : ""}{formatINR(Math.round(i.profitLoss * 100))}</p>
              <p className="text-sm text-slate-500">{i.returnPct === null ? "Return unavailable" : `${i.returnPct.toFixed(1)}%`}</p>
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
          <div><Label htmlFor="i-name">Name / firm</Label><Input id="i-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="i-type">Type</Label><Select id="i-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["EQUITY", "MUTUAL_FUND", "FD", "CRYPTO", "OTHER"].map((t) => <option key={t}>{t}</option>)}</Select></div>
          <div><Label htmlFor="i-inv">Invested amount</Label><Input id="i-inv" type="number" min="0" step="0.01" required value={form.invested} onChange={(e) => setForm({ ...form, invested: e.target.value })} /></div>
          <div><Label htmlFor="i-cur">Current value</Label><Input id="i-cur" type="number" min="0" step="0.01" required value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
          <Button disabled={save.isPending} className="w-full">Save</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delId && remove.mutate(delId)} title="Delete investment" message="Remove this investment permanently?" confirmLabel="Delete" />
    </div>
  );
}
