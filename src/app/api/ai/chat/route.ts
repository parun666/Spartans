import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { decryptKey } from "@/lib/aiCrypto";
import { buildAiContext, ruleBasedSummary } from "@/lib/aiTools";
import { z } from "zod";
import { parseBody } from "@/lib/api";

const chatSchema = z.object({ message: z.string().min(1).max(2000), month: z.string().regex(/^\d{4}-\d{2}$/).optional() });

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { message, month } = await parseBody(req, chatSchema);
    const m = month ?? new Date().toISOString().slice(0, 7);
    const cfg = await prisma.aiConfig.findUnique({ where: { userId: user.id } });
    if (!cfg) return json({ reply: "AI assistant is currently unavailable. No API key configured.\n\n" + (await ruleBasedSummary(user.id, m)), unavailable: true });
    try {
      const apiKey = decryptKey(cfg.keyCipher);
      const ctx = await buildAiContext(user.id, m); // minimal aggregates only
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: "You are a careful personal finance assistant. Use only the provided JSON aggregates. Never request raw database rows." }, { role: "user", content: `Context: ${JSON.stringify(ctx)}\nQuestion: ${message}` }] })
      });
      if (!res.ok) throw new Error("provider error");
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? "No response.";
      await audit(user.id, "AI_QUERY", req);
      return json({ reply, unavailable: false });
    } catch {
      return json({ reply: "AI assistant is currently unavailable.\n\n" + (await ruleBasedSummary(user.id, m)), unavailable: true });
    }
  } catch (e) { return errorResponse(e); }
}
