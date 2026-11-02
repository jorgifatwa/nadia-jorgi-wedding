import { cookies } from "next/headers";
import { CHECKIN_COOKIE, checkPin, checkinCookieOptions, createCheckinToken, isCheckinRequest, isPinSet } from "@/lib/adminAuth";
import { clientIp, rateLimit } from "@/lib/db";
import { withErrors } from "@/lib/apiHandler";

// Reception desk login with the shared PIN. A 6-digit PIN is short, so attempts are capped per IP.
const WINDOW_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 8;

export const GET = withErrors(async () => Response.json({ authenticated: await isCheckinRequest(), pinSet: await isPinSet() }));

export const POST = withErrors(async (request: Request) => {
  if (!(await isPinSet())) return Response.json({ error: "PIN panitia belum diatur oleh admin." }, { status: 503 });
  if (!(await rateLimit(`checkin-login:${clientIp(request)}`, MAX_ATTEMPTS, WINDOW_SECONDS))) {
    return Response.json({ error: "Terlalu banyak percobaan, coba lagi dalam 10 menit." }, { status: 429 });
  }
  const { pin } = ((await request.json().catch(() => ({}))) ?? {}) as { pin?: unknown };
  if (typeof pin !== "string" || !(await checkPin(pin))) return Response.json({ error: "PIN salah." }, { status: 401 });
  const token = await createCheckinToken();
  if (token) (await cookies()).set(CHECKIN_COOKIE, token, checkinCookieOptions);
  return Response.json({ ok: true });
});

export const DELETE = withErrors(async () => {
  (await cookies()).delete(CHECKIN_COOKIE);
  return Response.json({ ok: true });
});
