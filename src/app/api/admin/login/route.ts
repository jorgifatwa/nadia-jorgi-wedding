import { cookies } from "next/headers";
import { SESSION_COOKIE, checkCredentials, createSessionToken, isAdminConfigured, sessionCookieOptions } from "@/lib/adminAuth";
import { clientIp, rateLimit } from "@/lib/db";
import { withErrors } from "@/lib/apiHandler";

// At most 5 login attempts per minute per IP
const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export const POST = withErrors(async (request: Request) => {
  if (!(await isAdminConfigured())) {
    return Response.json({ error: "Belum ada akun admin. Jalankan pnpm db:seed atau atur ADMIN_PASSWORD." }, { status: 503 });
  }

  if (!(await rateLimit(`login:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_SECONDS))) {
    return Response.json({ error: "Terlalu banyak percobaan, coba lagi dalam 1 menit." }, { status: 429 });
  }

  const { username, password } = ((await request.json().catch(() => ({}))) ?? {}) as { username?: unknown; password?: unknown };
  if (typeof username !== "string" || typeof password !== "string" || !(await checkCredentials(username, password))) {
    return Response.json({ error: "Username atau password salah." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return Response.json({ ok: true });
});
