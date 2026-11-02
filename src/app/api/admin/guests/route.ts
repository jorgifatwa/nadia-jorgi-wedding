import { isAdminRequest, unauthorized } from "@/lib/adminAuth";
import { addGuests, deleteGuest, listGuests, updateGuest } from "@/lib/guestsStore";
import { normalizePhone } from "@/lib/phone";
import { cleanText } from "@/lib/wishValidation";

const NAME_MAX = 80;

// Validates one {name, phone} entry; phone is optional (the WhatsApp contact can then be picked when sending)
const parseEntry = (raw: unknown): { name: string; phone: string | null } | string => {
  const { name, phone } = (raw ?? {}) as { name?: unknown; phone?: unknown };
  const cleanName = typeof name === "string" ? cleanText(name) : "";
  if (cleanName.length < 2 || cleanName.length > NAME_MAX) return `Nama tamu harus 2-${NAME_MAX} karakter.`;
  if (typeof phone !== "string" || phone.trim() === "") return { name: cleanName, phone: null };
  const normalized = normalizePhone(phone);
  return normalized ? { name: cleanName, phone: normalized } : `Nomor WhatsApp "${phone}" tidak valid.`;
};

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  return Response.json({ guests: await listGuests() });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const { guests } = ((await request.json().catch(() => ({}))) ?? {}) as { guests?: unknown };
  if (!Array.isArray(guests) || guests.length === 0 || guests.length > 500) {
    return Response.json({ error: "Kirim 1-500 tamu sekaligus." }, { status: 400 });
  }
  const entries = guests.map(parseEntry);
  const errors = entries.map((entry, idx) => (typeof entry === "string" ? `Baris ${idx + 1}: ${entry}` : null)).filter(Boolean);
  if (errors.length) return Response.json({ error: errors.join("\n") }, { status: 400 });
  const added = await addGuests(entries as { name: string; phone: string | null }[]);
  return Response.json({ guests: added }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = ((await request.json().catch(() => ({}))) ?? {}) as { id?: unknown; name?: unknown; phone?: unknown; sent?: unknown };
  if (typeof body.id !== "string") return Response.json({ error: "ID tamu wajib diisi." }, { status: 400 });

  const changes: { name?: string; phone?: string | null; sentAt?: string | null } = {};
  if (body.name !== undefined || body.phone !== undefined) {
    const entry = parseEntry({ name: body.name, phone: body.phone });
    if (typeof entry === "string") return Response.json({ error: entry }, { status: 400 });
    Object.assign(changes, entry);
  }
  if (typeof body.sent === "boolean") changes.sentAt = body.sent ? new Date().toISOString() : null;

  const guest = await updateGuest(body.id, changes);
  return guest ? Response.json({ guest }) : Response.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID tamu wajib diisi." }, { status: 400 });
  return (await deleteGuest(id)) ? Response.json({ ok: true }) : Response.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
}
