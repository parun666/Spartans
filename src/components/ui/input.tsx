import * as React from "react";
import { cn } from "@/lib/utils";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} id={props.id} className={cn("w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white", props.className)} />;
}
export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{children}</label>;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400", props.className)} />;
}
