import { connection } from "next/server";
import { addWish, listWishes } from "@/lib/wishesStore";
import { clientIp, rateLimit } from "@/lib/redis";
import { cleanText, isAttendance, validateWish } from "@/lib/wishValidation";

// One submission per visitor every 20 seconds
const RATE_LIMIT_SECONDS = 20;

export async function GET() {
  await connection(); // always read the latest wishes at request time
  const wishes = await listWishes();
  return Response.json({ wishes });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const { name, message, attendance, website } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== "string" || typeof message !== "string") {
    return Response.json({ error: "Nama dan ucapan wajib diisi." }, { status: 400 });
  }
  // Honeypot field: hidden from people, bots tend to fill it in
  if (typeof website === "string" && website.trim() !== "") {
    return Response.json({ error: "Ucapan tidak dapat dikirim." }, { status: 400 });
  }

  const error = validateWish({ name, message, attendance: typeof attendance === "string" ? attendance : "" });
  if (error || !isAttendance(attendance)) {
    return Response.json({ error: error ?? "Konfirmasi kehadiran tidak valid." }, { status: 400 });
  }

  if (!(await rateLimit(`wish:${clientIp(request)}`, 1, RATE_LIMIT_SECONDS))) {
    return Response.json({ error: "Tunggu sebentar sebelum mengirim ucapan lagi." }, { status: 429 });
  }

  const wish = await addWish(cleanText(name), message.trim().replace(/\n{3,}/g, "\n\n"), attendance);
  return Response.json({ wish }, { status: 201 });
}
