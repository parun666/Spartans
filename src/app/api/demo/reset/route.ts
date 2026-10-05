import { requireUser, audit } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { resetDemoDataForUser } from "@/lib/demoData";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await resetDemoDataForUser(user.id);
    await audit(user.id, "DEMO_DATA_RESET", req);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
