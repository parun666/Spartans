import { addSampleDataForUser } from "@/lib/demoData";
import { audit, rateLimit, requireUser } from "@/lib/auth";
import { errorResponse, json, parseBody } from "@/lib/api";
import { sampleDataSchema } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!rateLimit(`sample-data:${user.id}`, 5, 60 * 60 * 1000)) {
      await audit(user.id, "SAMPLE_DATA_RATE_LIMITED", req);
      return json({ error: "Too many sample-data requests. Try again later." }, { status: 429 });
    }
    await parseBody(req, sampleDataSchema);
    await addSampleDataForUser(user.id);
    await audit(user.id, "SAMPLE_DATA_ADDED", req, { months: 12 });
    return json({ ok: true, months: 12 });
  } catch (error) {
    return errorResponse(error);
  }
}
