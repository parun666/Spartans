"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";
import { sipFutureValuePaise } from "@/lib/finance";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Sip = { id: string; name: string; monthly: number; annualRate: number; years: number; invested: number; futureValue: number };

export default function SipsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["sips"], queryFn: () => apiFetch<{ sips: Sip[] }>("/api/sips") });
  const [name, setName] = useState("Monthly SIP");
  const [monthly, setMonthly] = useState("5000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");
  const [delId, setDelId] = useState<string | null>(null);

  const plan = sipFutureValuePaise(Math.round(Number(monthly) * 100) || 0, Number(rate), Number(years));
  const save = useMutation({
    mutationFn: () => apiFetch("/api/sips", { method: "POST", body: JSON.stringify({ name, monthly: Number(monthly), annualRate: Number(rate), years: Number(years) }) }),
    onSuccess: () => { toast("SIP saved"); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const remove = useMutation({ mutationFn: (id: string) => apiFetch(`/api/sips/${id}`, { method: "DELETE" }), onSuccess: () => { toast("Deleted"); qc.invalidateQueries(); } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SIP Planner</h1>
      <Card>
        <CardTitle>Estimate (Projected)</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div><Label htmlFor="s-name">Name</Label><Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="s-monthly">Monthly (₹)</Label><Input id="s-monthly" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          <div><Label htmlFor="s-rate">Annual rate %</Label><Input id="s-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div><Label htmlFor="s-years">Years</Label><Input id="s-years" type="number" value={years} onChange={(e) => setYears(e.target.value)} /></div>
        </div>
        <p className="mt-3 text-sm">Invested: <b>{formatINR(plan.investedPaise)}</b> · Projected future value: <b className="text-green-600">{formatINR(plan.futureValuePaise)}</b></p>
        <ResponsiveContainer width="100%" height={240} className="mt-3">
          <LineChart data={plan.schedule.filter((_, i) => i % 6 === 0 || i === plan.schedule.length - 1).map((s) => ({ month: s.month, value: s.valuePaise / 100, invested: s.investedPaise / 100 }))}>
            <XAxis dataKey="month" /><YAxis /><Tooltip /><Line dataKey="value" stroke="#63d4a0" strokeWidth={2} name="Projected value" /><Line dataKey="invested" stroke="#a89179" name="Invested" />
          </LineChart>
        </ResponsiveContainer>
        <Button className="mt-3" onClick={() => save.mutate()} disabled={save.isPending}>Save SIP</Button>
      </Card>
      <Card><CardTitle>Saved SIPs</CardTitle>
        {isLoading && <Skeleton className="h-32 mt-3" />}
        {data && data.sips.length === 0 && <p className="text-slate-400 mt-3">No saved SIPs.</p>}
        {data?.sips.map((s) => (
          <div key={s.id} className="flex justify-between py-2 border-b text-sm">
            <span>{s.name}: {formatINR(Math.round(s.monthly * 100))}/mo @ {s.annualRate}% for {s.years}y</span>
            <span>Invested {formatINR(Math.round(s.invested * 100))} · Projected {formatINR(Math.round(s.futureValue * 100))} <Button variant="ghost" onClick={() => setDelId(s.id)}>Delete</Button></span>
          </div>
        ))}
      </Card>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delId && remove.mutate(delId)} title="Delete SIP" message="Remove this SIP plan?" confirmLabel="Delete" />
    </div>
  );
}
