import "server-only";
import { randomUUID } from "crypto";
import { readJson, updateJson } from "./jsonStore";
import { key, redis } from "./redis";
import type { Attendance } from "./wishValidation";

// Invitation guest list and the WhatsApp message settings. Redis: a hash of id -> guest plus a sorted set in insertion
// order, and a JSON settings value; locally: data/guests.json and data/settings.json.

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
  baseUrl: string;
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
const DEFAULT_SETTINGS: InviteSettings = { template: DEFAULT_TEMPLATE, baseUrl: "" };
const GUEST_HASH = key("guests");
const GUEST_INDEX = key("guests:index");
const SETTINGS_KEY = key("settings");

export const listGuests = async (): Promise<Guest[]> => {
  if (redis) {
    const ids = await redis.zrange<string[]>(GUEST_INDEX, 0, -1);
    if (ids.length === 0) return [];
    const byId = (await redis.hmget<Record<string, Guest>>(GUEST_HASH, ...ids)) ?? {};
    return ids.map((id) => byId[id]).filter((guest): guest is Guest => Boolean(guest));
  }
  return readJson<Guest[]>(GUESTS, []);
};

export const getGuest = async (id: string): Promise<Guest | null> => {
  if (redis) return (await redis.hget<Guest>(GUEST_HASH, id)) ?? null;
  return (await readJson<Guest[]>(GUESTS, [])).find((guest) => guest.id === id) ?? null;
};

export const addGuests = async (entries: { name: string; phone: string | null }[]): Promise<Guest[]> => {
  const now = new Date().toISOString();
  const added: Guest[] = entries.map((entry) => ({ id: randomUUID(), name: entry.name, phone: entry.phone, createdAt: now, sentAt: null }));
  if (redis && added.length > 0) {
    const base = Date.now();
    const [first, ...rest] = added.map((guest, idx) => ({ score: base + idx, member: guest.id }));
    await redis
      .multi()
      .hset(GUEST_HASH, Object.fromEntries(added.map((guest) => [guest.id, guest])))
      .zadd(GUEST_INDEX, first, ...rest)
      .exec();
    return added;
  }
  return updateJson<Guest[], Guest[]>(GUESTS, [], (guests) => ({ data: [...guests, ...added], result: added }));
};

export const updateGuest = async (id: string, changes: Partial<Pick<Guest, "name" | "phone" | "sentAt" | "attendance" | "respondedAt">>): Promise<Guest | null> => {
  if (redis) {
    const current = await redis.hget<Guest>(GUEST_HASH, id);
    if (!current) return null;
    const updated = { ...current, ...changes };
    await redis.hset(GUEST_HASH, { [id]: updated });
    return updated;
  }
  return updateJson<Guest[], Guest | null>(GUESTS, [], (guests) => {
    const current = guests.find((guest) => guest.id === id);
    if (!current) return { data: guests, result: null };
    const updated = { ...current, ...changes };
    return { data: guests.map((guest) => (guest.id === id ? updated : guest)), result: updated };
  });
};

export const deleteGuest = async (id: string): Promise<boolean> => {
  if (redis) {
    const [removed] = await redis.multi().hdel(GUEST_HASH, id).zrem(GUEST_INDEX, id).exec<[number, number]>();
    return removed > 0;
  }
  return updateJson<Guest[], boolean>(GUESTS, [], (guests) => {
    const data = guests.filter((guest) => guest.id !== id);
    return { data, result: data.length !== guests.length };
  });
};

export const getSettings = async (): Promise<InviteSettings> => {
  const stored = redis ? await redis.get<Partial<InviteSettings>>(SETTINGS_KEY) : await readJson<Partial<InviteSettings>>(SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
};

export const saveSettings = async (settings: InviteSettings): Promise<InviteSettings> => {
  if (redis) {
    await redis.set(SETTINGS_KEY, settings);
    return settings;
  }
  return updateJson<InviteSettings, InviteSettings>(SETTINGS, DEFAULT_SETTINGS, () => ({ data: settings, result: settings }));
};
