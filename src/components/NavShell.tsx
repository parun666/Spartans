"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/Toast";
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, LineChart, Repeat, Target, BarChart3, Bot, Shield, Settings, ShieldCheck, LogOut
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/sips", label: "SIP", icon: Repeat },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const qc = useQueryClient();
  const toast = useToast();
  const reloadResetStarted = useRef(false);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => apiFetch<{ user: { role: string; name: string } | null }>("/api/auth/me") });
  const user = data?.user;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!user || isAuthPage || reloadResetStarted.current) return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type !== "reload") return;
    reloadResetStarted.current = true;
    apiFetch<{ ok: boolean }>("/api/demo/reset", { method: "POST" })
      .then(() => {
        void qc.invalidateQueries();
        toast("Preinstalled dataset restored after reload");
      })
      .catch((error: unknown) => {
        toast(error instanceof Error ? `Could not reset data: ${error.message}` : "Could not reset data.", "error");
      });
  }, [isAuthPage, qc, toast, user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.clear();
    window.location.href = "/login";
  }

  if (isAuthPage || !user) return <main className="min-h-screen bg-slate-50">{children}</main>;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-slate-200">
        <div className="p-4 text-lg font-bold text-white">FinTrack</div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${pathname.startsWith(href) ? "bg-slate-700 text-white" : "hover:bg-slate-800"}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link href="/admin" className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${pathname.startsWith("/admin") ? "bg-slate-700 text-white" : "hover:bg-slate-800"}`}>
              <ShieldCheck size={16} /> Admin
            </Link>
          )}
        </nav>
        <button onClick={logout} className="m-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-800"><LogOut size={16} /> Logout</button>
      </aside>

      {/* Tablet compact icon nav */}
      <nav className="hidden sm:flex md:hidden fixed top-0 inset-x-0 bg-slate-900 text-slate-200 justify-around p-2 z-30">
        {NAV.slice(0, 8).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} title={label} aria-label={label} className={`p-2 rounded ${pathname.startsWith(href) ? "bg-slate-700" : ""}`}><Icon size={18} /></Link>
        ))}
      </nav>

      <main className="flex-1 md:ml-56 p-4 pb-24 md:pb-4 pt-16 sm:pt-16 md:pt-4 max-w-6xl w-full">{children}</main>

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
