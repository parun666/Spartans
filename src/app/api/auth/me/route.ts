import { getUserByToken, getCookie } from "@/lib/auth";
import { errorResponse, json } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await getUserByToken(getCookie(req, "fintrack_session"));
    if (!user) return json({ user: null });
    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, timezone: user.timezone } });
  } catch (error) {
    return errorResponse(error);
  }
}
