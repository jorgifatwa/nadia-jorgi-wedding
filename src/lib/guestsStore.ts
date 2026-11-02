import "server-only";
import { randomUUID } from "crypto";
import { readJson, updateJson } from "./jsonStore";
import { getDb, toIso } from "./db";
import type { Attendance } from "./wishValidation";

// Invitation guest list and the WhatsApp message settings. Postgres tables `guests` (insertion order) and `settings`
// (JSON value under the "invite" key); locally without a database: data/guests.json and data/settings.json.

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  sentAt: string | null;
  // Set when the guest sends a wish from their personal link
  attendance?: Attendance | null;
  respondedAt?: string | null;
}

export interface InviteSettings {
  template: string;
}

export const DEFAULT_TEMPLATE = `Assalamu'alaikum Warahmatullahi Wabarakatuh

Kepada Yth.
Bapak/Ibu/Saudara/i
*{nama}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

*Nadia Nur Fitri Hermawan & Jorgi Fatwa Ambia*

Sabtu, 5 Desember 2026
Menara BP Jamsostek Lantai 9, Jakarta Selatan

Berikut link undangan kami untuk info lengkap dari acara:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.

Terima kasih banyak atas perhatiannya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh`;

const GUESTS = "guests";
const SETTINGS = "settings";
const SETTINGS_KEY = "invite";
const DEFAULT_SETTINGS: InviteSettings = { template: DEFAULT_TEMPLATE };

interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  created_at: Date;
  sent_at: Date | null;
  attendance: Attendance | null;
  responded_at: Date | null;
}

const fromRow = (row: GuestRow): Guest => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  createdAt: toIso(row.created_at)!,
  sentAt: toIso(row.sent_at),
  attendance: row.attendance,
  respondedAt: toIso(row.responded_at),
});

export const listGuests = async (): Promise<Guest[]> => {
  const sql = await getDb();
  if (sql) return (await sql<GuestRow[]>`select * from guests order by seq`).map(fromRow);
  return readJson<Guest[]>(GUESTS, []);
};

export const getGuest = async (id: string): Promise<Guest | null> => {
  const sql = await getDb();
  if (sql) {
    const [row] = await sql<GuestRow[]>`select * from guests where id = ${id}`;
    return row ? fromRow(row) : null;
  }
  return (await readJson<Guest[]>(GUESTS, [])).find((guest) => guest.id === id) ?? null;
};

export const addGuests = async (entries: { name: string; phone: string | null }[]): Promise<Guest[]> => {
  const now = new Date().toISOString();
  const added: Guest[] = entries.map((entry) => ({ id: randomUUID(), name: entry.name, phone: entry.phone, createdAt: now, sentAt: null }));
  const sql = await getDb();
  if (sql) {
    if (added.length === 0) return [];
    // One multi-row insert; the identity column keeps the list order
    const rows = await sql<GuestRow[]>`
      insert into guests ${sql(added.map(({ id, name, phone }) => ({ id, name, phone })), "id", "name", "phone")}
      returning *
    `;
    return rows.map(fromRow);
  }
  return updateJson<Guest[], Guest[]>(GUESTS, [], (guests) => ({ data: [...guests, ...added], result: added }));
};

type GuestChanges = Partial<Pick<Guest, "name" | "phone" | "sentAt" | "attendance" | "respondedAt">>;

const COLUMNS: Record<keyof GuestChanges, string> = {
  name: "name",
  phone: "phone",
  sentAt: "sent_at",
  attendance: "attendance",
  respondedAt: "responded_at",
};

export const updateGuest = async (id: string, changes: GuestChanges): Promise<Guest | null> => {
  const sql = await getDb();
  if (sql) {
    const values = Object.fromEntries(
      (Object.keys(changes) as (keyof GuestChanges)[]).filter((field) => changes[field] !== undefined).map((field) => [COLUMNS[field], changes[field] ?? null]),
    );
    if (Object.keys(values).length === 0) return getGuest(id);
    const [row] = await sql<GuestRow[]>`update guests set ${sql(values)} where id = ${id} returning *`;
    return row ? fromRow(row) : null;
  }
  return updateJson<Guest[], Guest | null>(GUESTS, [], (guests) => {
    const current = guests.find((guest) => guest.id === id);
    if (!current) return { data: guests, result: null };
    const updated = { ...current, ...changes };
    return { data: guests.map((guest) => (guest.id === id ? updated : guest)), result: updated };
  });
};

export const deleteGuest = async (id: string): Promise<boolean> => {
  const sql = await getDb();
  if (sql) return (await sql`delete from guests where id = ${id}`).count > 0;
  return updateJson<Guest[], boolean>(GUESTS, [], (guests) => {
    const data = guests.filter((guest) => guest.id !== id);
    return { data, result: data.length !== guests.length };
  });
};

export const getSettings = async (): Promise<InviteSettings> => {
  const sql = await getDb();
  let stored: Partial<InviteSettings> = {};
  if (sql) {
    const [row] = await sql<{ value: string }[]>`select value from settings where key = ${SETTINGS_KEY}`;
    if (row) stored = JSON.parse(row.value) as Partial<InviteSettings>;
  } else {
    stored = await readJson<Partial<InviteSettings>>(SETTINGS, {});
  }
  return { template: stored.template ?? DEFAULT_SETTINGS.template };
};

export const saveSettings = async (settings: InviteSettings): Promise<InviteSettings> => {
  const sql = await getDb();
  if (sql) {
    const value = JSON.stringify(settings);
    await sql`insert into settings (key, value) values (${SETTINGS_KEY}, ${value}) on conflict (key) do update set value = excluded.value`;
    return settings;
  }
  return updateJson<InviteSettings, InviteSettings>(SETTINGS, DEFAULT_SETTINGS, () => ({ data: settings, result: settings }));
};
