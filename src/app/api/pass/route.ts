import { addGuests } from "@/lib/guestsStore";
import { clientIp, rateLimit } from "@/lib/db";
import { cleanText } from "@/lib/wishValidation";
import { withErrors } from "@/lib/apiHandler";

const NAME_MAX = 80;

// A guest from a group link takes their own check-in QR: they become a guest entry (source "self") whose id the QR
// carries. The invitation keeps it on the phone, so this runs once per guest; the cap (roomy, since guests on one
// office or venue Wi-Fi share an IP) stops anyone filling the list.
export const POST = withErrors(async (request: Request) => {
  if (!(await rateLimit(`pass:${clientIp(request)}`, 20, 10 * 60))) {
    return Response.json({ error: "Terlalu banyak permintaan, coba lagi sebentar lagi." }, { status: 429 });
  }
  const { name } = ((await request.json().catch(() => ({}))) ?? {}) as { name?: unknown };
  const cleanName = typeof name === "string" ? cleanText(name) : "";
  if (cleanName.length < 2 || cleanName.length > NAME_MAX) return Response.json({ error: `Nama harus 2-${NAME_MAX} karakter.` }, { status: 400 });
  const [guest] = await addGuests([{ name: cleanName, phone: null }], { source: "self" });
  return Response.json({ id: guest.id, name: guest.name }, { status: 201 });
});
