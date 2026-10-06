"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";
import { formatINR } from "@/lib/money";

type Goal = { id: string; name: string; target: number; saved: number; remaining: number; pct: number; deadline: string | null };

export default function GoalsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<{ goals: Goal[] }>("/api/goals") });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", target: "", saved: "0", deadline: "" });

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, target: Number(form.target), saved: Number(form.saved), deadline: form.deadline || undefined };
      return editing ? apiFetch(`/api/goals/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch("/api/goals", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { toast(editing ? "Goal updated" : "Goal added"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });
  const remove = useMutation({ mutationFn: (id: string) => apiFetch(`/api/goals/${id}`, { method: "DELETE" }), onSuccess: () => { toast("Deleted"); qc.invalidateQueries(); } });

  function estimated(g: Goal): string {
    if (g.remaining <= 0) return "Completed 🎉";
    if (!g.deadline) return "Estimated completion: set a deadline";
    const days = (+new Date(g.deadline) - Date.now()) / 86400000;
    return days <= 0 ? "Deadline passed" : `Estimated completion by ${g.deadline.slice(0, 10)}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: "", target: "", saved: "0", deadline: "" }); setOpen(true); }}>+ Add goal</Button>
      </div>
      {isLoading && <Skeleton className="h-32" />}
      {data && data.goals.length === 0 && <Card><p className="text-slate-400">No goals yet.</p></Card>}
      {data?.goals.map((g) => (
        <Card key={g.id}>
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{g.name}</p>
              <p className="text-sm text-slate-500">Saved {formatINR(Math.round(g.saved * 100))} of {formatINR(Math.round(g.target * 100))} · Remaining {formatINR(Math.round(g.remaining * 100))}</p>
              <p className="text-xs text-slate-400">{estimated(g)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{g.pct.toFixed(0)}%</p>
              <Button variant="ghost" onClick={() => { setEditing(g); setForm({ name: g.name, target: String(g.target), saved: String(g.saved), deadline: g.deadline?.slice(0, 10) ?? "" }); setOpen(true); }}>Edit</Button>
              <Button variant="ghost" onClick={() => setDelId(g.id)}>Delete</Button>
            </div>
          </div>
          <div className="h-2 rounded bg-slate-200 mt-2"><div className="h-2 rounded bg-blue-500" style={{ width: `${g.pct}%` }} /></div>
        </Card>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit goal" : "Add goal"}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div><Label htmlFor="g-name">Name</Label><Input id="g-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="g-target">Target (₹)</Label><Input id="g-target" type="number" min="1" step="0.01" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></div>
          <div><Label htmlFor="g-saved">Saved so far (₹)</Label><Input id="g-saved" type="number" min="0" step="0.01" value={form.saved} onChange={(e) => setForm({ ...form, saved: e.target.value })} /></div>
          <div><Label htmlFor="g-deadline">Deadline</Label><Input id="g-deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
          <Button disabled={save.isPending} className="w-full">Save</Button>
        </form>
      </Dialog>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delId && remove.mutate(delId)} title="Delete goal" message="Remove this goal?" confirmLabel="Delete" />
    </div>
  );
}
