"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}
