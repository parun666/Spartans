import * as React from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-slate-600 uppercase tracking-wide", className)} {...props} />;
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}
export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "amber" }) {
  const tones = { slate: "bg-slate-100 text-slate-700", green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700" };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
