"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton, Badge } from "@/components/ui/card";

const CONTROLS = [
  "bcrypt password hashing (cost 10)",
  "JWT session in HttpOnly SameSite=Lax cookie (7-day expiry, server-side session record)",
  "Login rate limiting (5 attempts / 5 minutes)",
  "Central requireUser()/requireRole() on every API route",
  "Object-level ownership checks (userId filter) on every query",
  "Zod input validation on all mutation endpoints",
  "Parameterised queries via Prisma (no raw SQL string building)",
  "AI API key stored AES-256-GCM encrypted, masked in UI",
  "Security headers: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy",
  "Audit logging of auth & mutation events (no secrets or bodies)",
  "User disable immediately invalidates sessions",
  "Account deletion cascades all user data"
];

type Event = { id: string; action: string; ip: string | null; createdAt: string };

export default function SecurityPage() {
  const { data, isLoading } = useQuery({ queryKey: ["activity"], queryFn: () => apiFetch<{ events: Event[] }>("/api/activity") });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Security Center</h1>
      <Card>
        <CardTitle>Security controls in place</CardTitle>
        <ul className="list-disc ml-5 mt-2 text-sm text-slate-700 space-y-1">{CONTROLS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Card>
      <Card>
        <CardTitle>Your security activity</CardTitle>
        {isLoading && <Skeleton className="h-32 mt-3" />}
        {data && data.events.length === 0 && <p className="text-slate-400 mt-3">No activity recorded yet.</p>}
        <ul className="divide-y mt-2 text-sm">
          {data?.events.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="amber">{e.action.replaceAll("_", " ")}</Badge>
                {e.ip ? <span className="text-slate-400">from {e.ip}</span> : null}
              </div>
              <time className="text-xs text-slate-400" dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
