import { connection } from "next/server";
import { getGuest } from "@/lib/guestsStore";
import { clientIp, rateLimit } from "@/lib/db";
import { withErrors } from "@/lib/apiHandler";

// Resolves the guest of a personal invitation link (?g=<id>). The wish form locks the name only for guests with a
// WhatsApp number; guests added without one may type their own name.
export const GET = withErrors(async (request: Request) => {
  await connection(); // per-request lookup, never prerendered
  if (!(await rateLimit(`guest:${clientIp(request)}`, 30, 60))) {
    return Response.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  }
  const id = new URL(request.url).searchParams.get("g");
  const guest = id ? await getGuest(id) : null;
  return guest ? Response.json({ name: guest.name, locked: Boolean(guest.phone) }) : Response.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
});
