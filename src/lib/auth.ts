import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { isIP } from "node:net";
import { prisma } from "./db";

const COOKIE = "fintrack_session";
function getRequiredSecret(name: string): Uint8Array {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  if (value.length < 32) throw new Error(`${name} must be at least 32 characters`);
  return new TextEncoder().encode(value);
}
let jwtSecret: Uint8Array | undefined;
function getJwtSecret(): Uint8Array {
  return (jwtSecret ??= getRequiredSecret("JWT_SECRET"));
}

export type SessionUser = { id: string; email: string; name: string; role: string; currency: string; timezone: string };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({ data: { userId, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) } });
  const token = await new SignJWT({ sid: session.token }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("7d").sign(getJwtSecret());
  return token;
}

export async function destroySessionByToken(token: string | undefined) {
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.sid) await prisma.session.deleteMany({ where: { token: String(payload.sid) } });
  } catch { /* ignore */ }
}

export function sessionCookieHeader(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function clearSessionCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function getCookie(req: Request, name: string): string | undefined {
  const h = req.headers.get("cookie");
  if (!h) return undefined;
  for (const part of h.split(";")) { const [k, v] = part.trim().split("="); if (k === name) return v; }
  return undefined;
}

export function getTrustedClientIp(req: Request): string | null {
  if (process.env.TRUST_PROXY !== "true") return null;
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && isIP(ip) !== 0 ? ip : null;
}

export async function getUserByToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const secret = getJwtSecret();
  let sid: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    sid = String(payload.sid ?? "");
  } catch {
    return null;
  }
  if (!sid) return null;
  const sess = await prisma.session.findUnique({ where: { token: sid }, include: { user: true } });
  if (!sess || sess.expiresAt < new Date() || !sess.user.enabled) return null;
  return sess.user;
}

export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await getUserByToken(getCookie(req, COOKIE));
  if (!user) throw new ApiError(401, "Authentication required");
  return user;
}
export async function requireRole(req: Request, role: "ADMIN"): Promise<SessionUser> {
  const user = await requireUser(req);
  if (user.role !== role) throw new ApiError(403, "Forbidden");
  return user;
}
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, h: string) => bcrypt.compare(pw, h);

const attempts = new Map<string, { n: number; resetAt: number }>();
const loginFailures = new Map<string, { n: number; resetAt: number; lockedUntil: number }>();
let lastCleanup = 0;

function cleanupRateLimits(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
  for (const [key, entry] of loginFailures) {
    if (entry.resetAt <= now && entry.lockedUntil <= now) loginFailures.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupRateLimits(now);
  const e = attempts.get(key);
  if (!e || e.resetAt < now) { attempts.set(key, { n: 1, resetAt: now + windowMs }); return true; }
  e.n++;
  return e.n <= limit;
}

export function isLoginLocked(account: string): boolean {
  const entry = loginFailures.get(account);
  if (!entry) return false;
  if (entry.lockedUntil > Date.now()) return true;
  if (entry.resetAt <= Date.now()) loginFailures.delete(account);
  return false;
}

export function recordLoginFailure(account: string): void {
  const now = Date.now();
  cleanupRateLimits(now);
  const entry = loginFailures.get(account);
  const n = entry && entry.resetAt > now ? entry.n + 1 : 1;
  const lockMs = n < 5 ? 0 : Math.min(30 * 60_000, 60_000 * 2 ** Math.min(n - 5, 4));
  loginFailures.set(account, { n, resetAt: now + 30 * 60_000, lockedUntil: now + lockMs });
}

export function clearLoginFailures(account: string): void {
  loginFailures.delete(account);
}

export async function audit(userId: string | null, action: string, req?: Request, metadata: Record<string, unknown> = {}) {
  try {
    await prisma.auditEvent.create({ data: { userId, action, ip: req ? getTrustedClientIp(req) : null, metadata: JSON.stringify(metadata) } });
  } catch (error) {
    console.error("Audit event write failed", {
      action,
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
  }
}
