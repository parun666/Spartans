import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import ToastProvider from "@/components/Toast";
import NavShell from "@/components/NavShell";

export const metadata: Metadata = { title: "FinTrack — Your money. Your insights. Your privacy.", description: "Local-first personal finance tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ToastProvider>
            <NavShell>{children}</NavShell>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
