import { prisma } from "@/lib/db";
import { requireUser, audit, rateLimit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { decryptKey } from "@/lib/aiCrypto";
import { AI_SYSTEM_PROMPT, buildAiContext, ruleBasedSummary } from "@/lib/aiTools";
import { aiChatSchema } from "@/lib/validate";
import { parseBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!rateLimit(`ai:${user.id}`, 10, 60_000)) {
      await audit(user.id, "AI_RATE_LIMITED", req);
      return json({ error: "Too many AI requests. Try again later." }, { status: 429 });
    }
    const { message, month } = await parseBody(req, aiChatSchema);
    const m = month ?? new Date().toISOString().slice(0, 7);
    const cfg = await prisma.aiConfig.findUnique({ where: { userId: user.id } });
    if (!cfg) return json({ reply: "AI assistant is currently unavailable. No API key configured.\n\n" + (await ruleBasedSummary(user.id, m)), unavailable: true });
    try {
      const apiKey = decryptKey(cfg.keyCipher);
      const ctx = await buildAiContext(user.id, m); // minimal aggregates only
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: AI_SYSTEM_PROMPT }, { role: "user", content: JSON.stringify({ context: ctx, question: message }) }] })
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
