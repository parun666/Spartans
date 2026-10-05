"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";

type Profile = { id: string; name: string; email: string; currency: string; timezone: string; preferences: string };

export default function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => apiFetch<{ profile: Profile }>("/api/profile") });
  const [form, setForm] = useState({ name: "", email: "", currency: "INR", timezone: "Asia/Kolkata" });
  const [loaded, setLoaded] = useState(false);
  if (data?.profile && !loaded) { setForm({ name: data.profile.name, email: data.profile.email, currency: data.profile.currency, timezone: data.profile.timezone }); setLoaded(true); }
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [delPw, setDelPw] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    try { await apiFetch("/api/profile", { method: "PUT", body: JSON.stringify(form) }); toast("Profile updated"); qc.invalidateQueries(); } catch (err) { toast((err as Error).message, "error"); }
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    try { await apiFetch("/api/auth/change-password", { method: "POST", body: JSON.stringify(pw) }); toast("Password changed — please sign in again"); router.push("/login"); } catch (err) { toast((err as Error).message, "error"); }
  }
  async function deleteAccount() {
    try { await apiFetch("/api/account", { method: "DELETE", body: JSON.stringify({ password: delPw }) }); toast("Account deleted"); router.push("/register"); } catch (err) { toast((err as Error).message, "error"); }
  }
  async function exportData() {
    const res = await fetch("/api/export?format=json");
    const blob = await res.blob();
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fintrack-export.json"; a.click();
    toast("Export generated successfully.");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardTitle>Profile</CardTitle>
        {isLoading && <Skeleton className="h-32 mt-3" />}
        <form className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={saveProfile}>
          <div><Label htmlFor="p-name">Name</Label><Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="p-email">Email</Label><Input id="p-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label htmlFor="p-currency">Currency</Label><Input id="p-currency" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label htmlFor="p-tz">Timezone</Label><Input id="p-tz" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></div>
          <Button>Save profile</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Security</CardTitle>
        <form className="mt-3 space-y-3 max-w-sm" onSubmit={changePw}>
          <div><Label htmlFor="pw-cur">Current password</Label><Input id="pw-cur" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div><Label htmlFor="pw-new">New password</Label><Input id="pw-new" type="password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          <Button>Change password</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Data &amp; Privacy</CardTitle>
        <p className="text-sm text-slate-500 mt-2">Export your data or view security activity. Your data never leaves this server except to your configured AI provider as minimal aggregates.</p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={exportData}>Export my data (JSON)</Button>
          <Button variant="outline" onClick={() => router.push("/security")}>View security activity</Button>
        </div>
      </Card>
      <Card>
        <CardTitle>Delete account</CardTitle>
        <p className="text-sm text-slate-500 mt-2">Permanently deletes your account and all associated data. This cannot be undone.</p>
        <div className="mt-3 flex gap-2 items-end">
          <div><Label htmlFor="del-pw">Confirm with password</Label><Input id="del-pw" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} /></div>
          <Button variant="destructive" disabled={!delPw} onClick={() => setConfirmDel(true)}>Delete account</Button>
        </div>
      </Card>
      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={deleteAccount} title="Delete account" message="All your data will be permanently deleted. Continue?" confirmLabel="Delete forever" />
    </div>
  );
}
