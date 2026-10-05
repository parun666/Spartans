import { NextRequest, NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_API_BODY_BYTES = 32 * 1024;

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  if (MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const contentType = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!origin || !host || contentType !== "application/json") {
      return NextResponse.json({ error: "Request rejected" }, { status: 403 });
    }
    try {
      const parsedOrigin = new URL(origin);
      const hostOrigin = new URL(`${parsedOrigin.protocol}//${host}`);
      if (parsedOrigin.origin !== req.nextUrl.origin || hostOrigin.host !== parsedOrigin.host) {
        return NextResponse.json({ error: "Request rejected" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Request rejected" }, { status: 403 });
    }
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_API_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
