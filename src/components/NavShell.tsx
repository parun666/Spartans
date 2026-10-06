"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, LineChart, Repeat, Target, BarChart3, Shield, Settings, ShieldCheck, LogOut
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/sips", label: "SIP", icon: Repeat },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings }
];

// When there is no database / JWT configured, show the app in demo mode
// so every Netlify visitor can see the live dashboard without a login redirect loop.
const DEMO_USER = { name: "Demo User", role: "USER" };

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: { role: string; name: string } | null }>("/api/auth/me"),
    retry: 1,
  });
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Track whether we are in demo mode (no configured backend)
  const [demoMode, setDemoMode] = useState(false);

  const user = data?.user ?? (demoMode ? DEMO_USER : null);

  useEffect(() => {
    if (isAuthPage) return;
    if (isLoading) return;
    // If the API returned {user: null} and we are on a protected page,
    // activate demo mode instead of redirecting to /login — this lets
    // Netlify deployments without a database show the full dashboard.
    if (!isError && data && !data.user) {
      setDemoMode(true);
    }
  }, [data, isAuthPage, isError, isLoading, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" } });
    qc.clear();
    window.location.href = "/login";
  }

  if (isAuthPage) return <main className="min-h-screen bg-slate-50">{children}</main>;
  if (isLoading) return <main className="min-h-screen bg-slate-50 p-6" role="status">Checking your session…</main>;
  if (isError) {
    // Hard error (network failure etc.) — activate demo mode
    return (
      <NavShellInner user={DEMO_USER} pathname={pathname} logout={logout} demoMode={true}>
        {children}
      </NavShellInner>
    );
  }
  if (!user) return <main className="min-h-screen bg-slate-50 p-6" role="status">Loading…</main>;

  return (
    <NavShellInner user={user} pathname={pathname} logout={logout} demoMode={demoMode}>
      {children}
    </NavShellInner>
  );
}

function NavShellInner({
  user,
  pathname,
  logout,
  demoMode,
  children,
}: {
  user: { name: string; role: string };
  pathname: string;
  logout: () => void;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen md:flex">
      <aside className="app-sidebar hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0">
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-6 text-lg font-semibold tracking-wide text-white">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>FinTrack</span>
        </Link>
        <p className="px-5 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} data-active={pathname.startsWith(href)} className="app-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link href="/admin" data-active={pathname.startsWith("/admin")} className="app-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
              <ShieldCheck size={16} /> Admin
            </Link>
          )}
        </nav>
        <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="mt-1 text-xs text-slate-400">{demoMode ? "Demo mode — read only" : "Personal account"}</p>
          {!demoMode && (
            <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-slate-400 transition hover:text-white"><LogOut size={14} /> Logout</button>
          )}
          {demoMode && (
            <Link href="/login" className="mt-3 flex items-center gap-2 text-xs text-emerald-400 transition hover:text-emerald-200">Sign in for full access →</Link>
          )}
        </div>
      </aside>

      <nav className="hidden sm:flex md:hidden fixed top-0 inset-x-0 bg-slate-900 text-slate-200 justify-around p-2 z-30">
        {NAV.slice(0, 8).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} title={label} aria-label={label} data-active={pathname.startsWith(href)} className="app-nav-link rounded-xl p-2"><Icon size={18} /></Link>
        ))}
      </nav>

      <main className="app-main flex-1 md:ml-60 p-4 pb-24 md:px-7 md:pb-7 pt-16 sm:pt-16 md:pt-6 w-full">
        {demoMode && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 flex items-center justify-between gap-3">
            <span>📊 <strong>Demo Mode</strong> — showing sample data. <Link href="/login" className="underline hover:text-amber-100">Sign in</Link> for a personal account.</span>
          </div>
        )}
        <header className="app-topbar mb-6 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 md:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Your money, in focus</p>
            <p className="mt-0.5 text-sm text-slate-400">Welcome back, <span className="font-medium text-white">{user.name}</span></p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200/20 bg-gradient-to-br from-emerald-300/30 to-emerald-700/30 text-sm font-semibold text-emerald-100" aria-label={`${user.name} profile`}>
            {user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        </header>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-slate-900 text-slate-300 flex justify-around p-2 z-30">
        {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-label={label} className={`flex flex-col items-center text-[10px] ${pathname.startsWith(href) ? "text-white" : ""}`}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
