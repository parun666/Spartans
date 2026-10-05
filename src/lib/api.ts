import { ZodSchema } from "zod";
import { ApiError } from "./auth";

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) } });
}
export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && (e as { name?: string }).name === "ZodError") return json({ error: "Invalid input", details: (e as { issues?: unknown }).issues }, { status: 400 });
  return json({ error: "Internal error" }, { status: 500 });
}
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try { body = await req.json(); } catch { throw new ApiError(400, "Invalid JSON body"); }
  return schema.parse(body);
}
