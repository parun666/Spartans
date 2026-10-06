import { getUserByToken, getCookie } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await getUserByToken(getCookie(req, "fintrack_session"));
    if (!user) return json({ user: null });
    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, timezone: user.timezone } });
  } catch {
    // JWT_SECRET not configured, DB unreachable, or any other runtime error.
    // Return {user: null} so the client shell gracefully redirects to /login
    // and demo fallbacks in client.ts take over — never expose a 500 here.
    return json({ user: null });
  }
}
