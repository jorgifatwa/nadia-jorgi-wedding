import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Admin session: a signed, expiring token in an httpOnly cookie. The password comes from ADMIN_PASSWORD
// (set it in .env.local / the host's environment); the signing key from ADMIN_SESSION_SECRET, falling back to it.

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const adminPassword = () => process.env.ADMIN_PASSWORD ?? "";
const signingKey = () => process.env.ADMIN_SESSION_SECRET || adminPassword();

export const isAdminConfigured = () => adminPassword().length > 0;

const sign = (payload: string) => createHmac("sha256", signingKey()).update(payload).digest("hex");

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

export const checkPassword = (input: string) => isAdminConfigured() && safeEqual(input, adminPassword());

export const createSessionToken = () => {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${sign(String(expires))}`;
};

const verifySessionToken = (token: string | undefined) => {
  if (!token || !isAdminConfigured()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) * 1000 < Date.now()) return false;
  return safeEqual(signature, sign(expires));
};

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export const isAdminRequest = async () => verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);

export const unauthorized = () => Response.json({ error: "Sesi admin berakhir, silakan login kembali." }, { status: 401 });
