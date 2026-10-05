import * as React from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-slate-600", className)} {...props} />;
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}
export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "amber" }) {
  const tones = { slate: "border-white/10 bg-white/10 text-slate-200", green: "border-green-400/20 bg-green-950/50 text-green-300", red: "border-red-400/20 bg-red-950/50 text-red-300", amber: "border-amber-400/20 bg-amber-950/50 text-amber-300" };
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
