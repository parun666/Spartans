"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast("Logged in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (err) { toast((err as Error).message, "error"); } finally { setLoading(false); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-4">Your money. Your insights. Your privacy.</p>
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button disabled={loading} className="w-full">{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
          <p className="font-semibold text-slate-300 mb-1.5">Quick Demo Access:</p>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
              onClick={() => {
                setEmail("demo@fintrack.dev");
                setPassword("Demo@12345");
              }}
            >
              Fill Demo User
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
              onClick={() => {
                setEmail("admin@fintrack.dev");
                setPassword("Admin@12345");
              }}
            >
              Fill Admin User
            </button>
          </div>
          <p className="text-[11px] text-slate-400">Demo: demo@fintrack.dev / Demo@12345</p>
        </div>
        <p className="mt-4 text-sm text-slate-500">No account? <Link className="text-blue-600" href="/register">Register</Link></p>
      </Card>
    </div>
  );
}
