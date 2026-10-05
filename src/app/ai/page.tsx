"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client";
import { Card, CardTitle, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/Toast";

type Cfg = { configured: boolean; provider: string | null; model: string | null; maskedKey: string | null };

export default function AiPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: cfg, isLoading } = useQuery({ queryKey: ["ai-config"], queryFn: () => apiFetch<Cfg>("/api/ai/config") });
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ reply: string; unavailable: boolean } | null>(null);
  const [sending, setSending] = useState(false);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    try { await apiFetch("/api/ai/config", { method: "PUT", body: JSON.stringify({ apiKey }) }); toast("API key saved (encrypted)"); setApiKey(""); qc.invalidateQueries(); } catch (err) { toast((err as Error).message, "error"); }
  }
  async function deleteKey() {
    try { await apiFetch("/api/ai/config", { method: "DELETE" }); toast("API key deleted"); qc.invalidateQueries(); } catch (err) { toast((err as Error).message, "error"); }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try { setChat(await apiFetch<{ reply: string; unavailable: boolean }>("/api/ai/chat", { method: "POST", body: JSON.stringify({ message }) })); }
    catch (err) { toast((err as Error).message, "error"); } finally { setSending(false); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">AI Assistant</h1>
      <Card>
        <CardTitle>Your API key</CardTitle>
        {isLoading && <Skeleton className="h-10 mt-3" />}
        <p className="text-sm text-slate-500 mt-2">Status: {cfg?.configured ? `Configured (${cfg.maskedKey}, provider ${cfg.provider}, model ${cfg.model})` : "Not configured — AI is unavailable, rule-based summary only."}</p>
        <form className="mt-3 flex gap-2 items-end" onSubmit={saveKey}>
          <div className="flex-1"><Label htmlFor="ai-key">OpenAI API key</Label><Input id="ai-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" /></div>
          <Button disabled={!apiKey}>{cfg?.configured ? "Replace key" : "Save key"}</Button>
          {cfg?.configured && <Button type="button" variant="destructive" onClick={deleteKey}>Delete key</Button>}
        </form>
        <p className="text-xs text-slate-400 mt-2">Only minimal monthly aggregates (totals, category breakdowns, budget status, counts) are ever sent to the provider — never raw transactions, credentials, or account details.</p>
      </Card>
      <Card>
        <CardTitle>Ask</CardTitle>
        <form className="mt-3 flex gap-2" onSubmit={send}>
          <Input aria-label="Message" placeholder="How did I spend this month?" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button disabled={sending || !message}>{sending ? "…" : "Send"}</Button>
        </form>
        {chat && <pre className="mt-3 whitespace-pre-wrap text-sm bg-slate-50 rounded p-3">{chat.reply}</pre>}
      </Card>
    </div>
  );
}
