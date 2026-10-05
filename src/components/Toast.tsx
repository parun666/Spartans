"use client";
import { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: number; message: string; kind: "success" | "error" };
const Ctx = createContext<(msg: string, kind?: "success" | "error") => void>(() => {});
export const useToast = () => useContext(Ctx);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`rounded-md px-4 py-2 text-sm shadow-lg text-white ${t.kind === "error" ? "bg-red-600" : "bg-slate-800"}`}>{t.message}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
