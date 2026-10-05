import { prisma } from "@/lib/db";
import { requireUser, audit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { aiKeySchema } from "@/lib/validate";
import { parseBody } from "@/lib/api";
import { encryptKey, maskKey } from "@/lib/aiCrypto";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const cfg = await prisma.aiConfig.findUnique({ where: { userId: user.id } });
    return json({ configured: !!cfg, provider: cfg?.provider ?? null, model: cfg?.model ?? null, maskedKey: cfg ? maskKey(cfg.keyCipher) : null });
  } catch (e) { return errorResponse(e); }
}
export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const data = await parseBody(req, aiKeySchema);
    const cfg = await prisma.aiConfig.upsert({ where: { userId: user.id }, update: { provider: data.provider, model: data.model, keyCipher: encryptKey(data.apiKey) }, create: { userId: user.id, provider: data.provider, model: data.model, keyCipher: encryptKey(data.apiKey) } });
    await audit(user.id, "AI_KEY_SET", req);
    return json({ configured: true, maskedKey: maskKey(cfg.keyCipher) });
  } catch (e) { return errorResponse(e); }
}
export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    await prisma.aiConfig.deleteMany({ where: { userId: user.id } });
    await audit(user.id, "AI_KEY_DELETED", req);
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
