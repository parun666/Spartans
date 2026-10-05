import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "fintrack_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-only-change-me-please-0123456789abcdef");

export type SessionUser = { id: string; email: string; name: string; role: string; currency: string; timezone: string };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({ data: { userId, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) } });
  const token = await new SignJWT({ sid: session.token }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("7d").sign(secret);
  return token;
}

export async function destroySessionByToken(token: string | undefined) {
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.sid) await prisma.session.deleteMany({ where: { token: String(payload.sid) } });
  } catch { /* ignore */ }
}

export function sessionCookieHeader(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}
export function clearSessionCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
export function getCookie(req: Request, name: string): string | undefined {
  const h = req.headers.get("cookie");
  if (!h) return undefined;
  for (const part of h.split(";")) { const [k, v] = part.trim().split("="); if (k === name) return v; }
  return undefined;
}

export async function getUserByToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const sid = String(payload.sid ?? "");
    const sess = await prisma.session.findUnique({ where: { token: sid }, include: { user: true } });
    if (!sess || sess.expiresAt < new Date() || !sess.user.enabled) return null;
    return sess.user;
  } catch { return null; }
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
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || e.resetAt < now) { attempts.set(key, { n: 1, resetAt: now + windowMs }); return true; }
  e.n++;
  return e.n <= limit;
}

export async function audit(userId: string | null, action: string, req?: Request, metadata: Record<string, unknown> = {}) {
  try {
    await prisma.auditEvent.create({ data: { userId, action, ip: req?.headers.get("x-forwarded-for") ?? null, metadata: JSON.stringify(metadata) } });
  } catch { /* never break the request on audit */ }
}
