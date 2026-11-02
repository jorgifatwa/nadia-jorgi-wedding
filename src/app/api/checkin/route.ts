import { checkinUnauthorized, isCheckinRequest } from "@/lib/adminAuth";
import { addGuests, checkInGuest, listGuests, updateGuest } from "@/lib/guestsStore";
import { cleanText } from "@/lib/wishValidation";
import { withErrors } from "@/lib/apiHandler";

const NAME_MAX = 80;

// Reception desk (PIN or admin): the guest list for searching, checking a guest in by QR / from the list, adding a
// guest who is not on the list, and undoing a mistaken check-in

export const GET = withErrors(async () => {
  if (!(await isCheckinRequest())) return checkinUnauthorized();
  const guests = (await listGuests()).map(({ id, name, source, checkedInAt }) => ({ id, name, source: source ?? "admin", checkedInAt: checkedInAt ?? null }));
  return Response.json({ guests });
});

export const POST = withErrors(async (request: Request) => {
  if (!(await isCheckinRequest())) return checkinUnauthorized();
  const body = ((await request.json().catch(() => ({}))) ?? {}) as { id?: unknown; name?: unknown };

  if (typeof body.id === "string") {
    const result = await checkInGuest(body.id);
    return result ? Response.json(result) : Response.json({ error: "QR tidak dikenal: tamu tidak ada di daftar." }, { status: 404 });
  }

  const name = typeof body.name === "string" ? cleanText(body.name) : "";
  if (name.length < 2 || name.length > NAME_MAX) return Response.json({ error: `Nama tamu harus 2-${NAME_MAX} karakter.` }, { status: 400 });
  const [guest] = await addGuests([{ name, phone: null }], { source: "desk", checkedIn: true });
  return Response.json({ guest, already: false }, { status: 201 });
});

export const DELETE = withErrors(async (request: Request) => {
  if (!(await isCheckinRequest())) return checkinUnauthorized();
  const id = new URL(request.url).searchParams.get("id");
  const guest = id ? await updateGuest(id, { checkedInAt: null }) : null;
  return guest ? Response.json({ guest }) : Response.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
});
