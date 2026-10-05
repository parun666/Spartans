"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      toast("Account created");
      router.push("/dashboard");
      router.refresh();
    } catch (err) { toast((err as Error).message, "error"); } finally { setLoading(false); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Create your FinTrack account</h1>
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="name">Name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="password">Password (8+ chars, letters &amp; numbers)</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button disabled={loading} className="w-full">{loading ? "Creating…" : "Register"}</Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">Have an account? <Link className="text-blue-600" href="/login">Sign in</Link></p>
      </Card>
    </div>
  );
}
