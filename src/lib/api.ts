import { ZodSchema } from "zod";
import { ApiError } from "./auth";

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json", "cache-control": "private, no-store", ...(init.headers || {}) } });
}
export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && (e as { name?: string }).name === "ZodError") return json({ error: "Invalid input" }, { status: 400 });
  return json({ error: "Internal error" }, { status: 500 });
}
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const maxBytes = 32 * 1024;
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) throw new ApiError(413, "Request body too large");
  if (!req.body) throw new ApiError(400, "Invalid JSON body");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "Request body too large");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Invalid JSON body");
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ApiError(400, "Invalid JSON body"); }
  return schema.parse(body);
}
