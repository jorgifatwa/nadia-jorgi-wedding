import { connection } from "next/server";
import { getGuest, isGroupInvite, updateGuest } from "@/lib/guestsStore";
import { addWish, listWishes, type Wish } from "@/lib/wishesStore";
import { clientIp, rateLimit } from "@/lib/db";
import { cleanText, isAttendance, validateWish } from "@/lib/wishValidation";
import { withErrors } from "@/lib/apiHandler";

// One submission per visitor every 20 seconds
const RATE_LIMIT_SECONDS = 20;

// The guest id works as the key of a personal invitation link, so it never leaves the server
const publicWish = ({ id, name, message, attendance, createdAt }: Wish) => ({ id, name, message, attendance, createdAt });

export const GET = withErrors(async () => {
  await connection(); // always read the latest wishes at request time
  const wishes = await listWishes();
  return Response.json({ wishes: wishes.map(publicWish) });
});

export const POST = withErrors(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const { message, attendance, website, guestId } = (body ?? {}) as Record<string, unknown>;
  // From a personal link the wish is tied to the guest; for guests with a WhatsApp number the name also comes from the
  // guest list, whatever the form sent (those without one type their own name)
  const guest = typeof guestId === "string" && guestId ? await getGuest(guestId) : null;
  if (typeof guestId === "string" && guestId && !guest) {
    return Response.json({ error: "Link undangan tidak valid, silakan buka kembali link dari pesan WhatsApp." }, { status: 400 });
  }
  const lockedName = guest?.phone ? guest.name : null;
  const name = lockedName ?? (body as Record<string, unknown>)?.name;
  if (typeof name !== "string" || typeof message !== "string") {
    return Response.json({ error: "Nama dan ucapan wajib diisi." }, { status: 400 });
  }
  // Honeypot field: hidden from people, bots tend to fill it in
  if (typeof website === "string" && website.trim() !== "") {
    return Response.json({ error: "Ucapan tidak dapat dikirim." }, { status: 400 });
  }

  const error = validateWish({ name, message, attendance: typeof attendance === "string" ? attendance : "", nameFromGuestList: lockedName !== null });
  if (error || !isAttendance(attendance)) {
    return Response.json({ error: error ?? "Konfirmasi kehadiran tidak valid." }, { status: 400 });
  }

  if (!(await rateLimit(`wish:${clientIp(request)}`, 1, RATE_LIMIT_SECONDS))) {
    return Response.json({ error: "Tunggu sebentar sebelum mengirim ucapan lagi." }, { status: 429 });
  }

  const wish = await addWish(cleanText(name), message.trim().replace(/\n{3,}/g, "\n\n"), attendance, guest?.id);
  // A group invitation's RSVP isn't one member's answer
  if (guest && !isGroupInvite(guest)) await updateGuest(guest.id, { attendance, respondedAt: wish.createdAt });
  return Response.json({ wish: publicWish(wish) }, { status: 201 });
});
