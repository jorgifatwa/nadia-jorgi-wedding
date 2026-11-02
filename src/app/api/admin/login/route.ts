import { cookies } from "next/headers";
import { SESSION_COOKIE, checkPassword, createSessionToken, isAdminConfigured, sessionCookieOptions } from "@/lib/adminAuth";
import { clientIp, rateLimit } from "@/lib/redis";

// At most 5 login attempts per minute per IP
const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return Response.json({ error: "ADMIN_PASSWORD belum diatur di environment server." }, { status: 503 });
  }

  if (!(await rateLimit(`login:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_SECONDS))) {
    return Response.json({ error: "Terlalu banyak percobaan, coba lagi dalam 1 menit." }, { status: 429 });
  }

  const { password } = ((await request.json().catch(() => ({}))) ?? {}) as { password?: unknown };
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ error: "Password salah." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return Response.json({ ok: true });
}
