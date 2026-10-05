"use client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";

type User = { id: string; email: string; name: string; role: string; enabled: boolean; createdAt: string };
type Overview = { userCount: number; activeCount: number; transactionCount: number; eventCount: number; events: { id: string; action: string; createdAt: string; user: { email: string } | null }[] };

export default function AdminPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => apiFetch<Overview>("/api/admin/overview") });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => apiFetch<{ users: User[] }>("/api/admin/users") });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { role?: string; enabled?: boolean } }) => apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => { toast("User updated"); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error")
  });

  if (overview.isLoading) return <Skeleton className="h-64" />;
  if (overview.isError) return <Card><p className="text-red-600">Admin access required.</p></Card>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardTitle>Users</CardTitle><p className="text-xl font-bold">{overview.data?.userCount}</p></Card>
        <Card><CardTitle>Active</CardTitle><p className="text-xl font-bold">{overview.data?.activeCount}</p></Card>
        <Card><CardTitle>Transactions</CardTitle><p className="text-xl font-bold">{overview.data?.transactionCount}</p></Card>
        <Card><CardTitle>Security events</CardTitle><p className="text-xl font-bold">{overview.data?.eventCount}</p></Card>
      </div>
      <Card>
        <CardTitle>Users (counts & roles only — no financial contents)</CardTitle>
        <table className="w-full text-sm mt-2">
          <thead><tr className="text-left text-slate-500"><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody className="divide-y">
            {users.data?.users.map((u) => (
              <tr key={u.id}>
                <td className="py-2">{u.email}</td>
                <td><Badge>{u.role}</Badge></td>
                <td>{u.enabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                <td className="text-right space-x-1">
                  <Button variant="outline" onClick={() => update.mutate({ id: u.id, patch: { role: u.role === "ADMIN" ? "USER" : "ADMIN" } })}>Make {u.role === "ADMIN" ? "user" : "admin"}</Button>
                  <Button variant="outline" onClick={() => update.mutate({ id: u.id, patch: { enabled: !u.enabled } })}>{u.enabled ? "Disable" : "Enable"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardTitle>Recent security events</CardTitle>
        <ul className="divide-y mt-2 text-sm">
          {overview.data?.events.map((e) => (
            <li key={e.id} className="py-2 flex justify-between">
              <span><Badge>{e.action}</Badge> {e.user?.email ?? "system"}</span>
              <span className="text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
