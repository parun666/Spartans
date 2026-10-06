import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { parseBody } from "@/lib/api";
import { getTrustedClientIp } from "@/lib/auth";
import { z } from "zod";
import nextConfig from "../../next.config.js";

afterEach(() => vi.unstubAllEnvs());

describe("trusted client IP handling", () => {
  it("ignores forwarded IP headers unless a trusted proxy is configured", () => {
    vi.stubEnv("TRUST_PROXY", "false");
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "203.0.113.8" }
    });

    expect(getTrustedClientIp(request)).toBeNull();
  });

  it("accepts a validated address only when trusted proxy headers are enabled", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" }
    });

    expect(getTrustedClientIp(request)).toBe("203.0.113.8");
  });

  it("ignores malformed forwarded addresses", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "attacker-controlled" }
    });

    expect(getTrustedClientIp(request)).toBeNull();
  });
});

describe("security middleware", () => {
  it("rejects cross-origin state-changing API requests", async () => {
    const request = new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: { origin: "https://attacker.invalid" }
    });

    const response = middleware(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Request rejected" });
  });

  it("allows same-origin state-changing API requests", () => {
    const request = new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json" }
    });
    expect(middleware(request).status).toBe(200);
  });

  it("rejects state-changing requests without Origin or JSON content type", () => {
    const missingOrigin = new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: { host: "localhost", "content-type": "application/json" }
    });
    const wrongType = new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "content-type": "text/plain" }
    });
    expect(middleware(missingOrigin).status).toBe(403);
    expect(middleware(wrongType).status).toBe(403);
  });

  it("rejects declared oversized API request bodies", () => {
    const request = new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "content-length": String(32 * 1024 + 1) }
    });

    expect(middleware(request).status).toBe(413);
  });

  it("configures frame protection, production HSTS and a CSP without unsafe-eval", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const configured = await nextConfig.headers?.();
      expect(configured).toBeDefined();
      const headers = configured?.[0]?.headers ?? [];
      const policy = headers.find((header: { key: string }) => header.key === "Content-Security-Policy")?.value;
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).not.toContain("unsafe-eval");
      expect(headers.some((header: { key: string }) => header.key === "Strict-Transport-Security")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("omits CSP in development so Next.js hot reload can execute", async () => {
    vi.stubEnv("NODE_ENV", "development");
    try {
      const configured = await nextConfig.headers?.();
      const headers = configured?.[0]?.headers ?? [];
      expect(headers.some((header: { key: string }) => header.key === "Content-Security-Policy")).toBe(false);
      expect(headers.some((header: { key: string }) => header.key === "X-Content-Type-Options")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("bounded JSON input parsing", () => {
  it("rejects oversized request bodies even without Content-Length", async () => {
    const body = JSON.stringify({ value: "x".repeat(32 * 1024) });
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });

    await expect(parseBody(request, z.object({ value: z.string() }))).rejects.toMatchObject({ status: 413 });
  });
});
