import "server-only";
import { randomUUID } from "crypto";
import { readJson, updateJson } from "./jsonStore";
import { key, redis } from "./redis";
import type { Attendance } from "./wishValidation";

// Guest wishes, newest first. Redis: a hash of id -> wish plus a sorted set ordered by time;
// locally: data/wishes.json.

export interface Wish {
  id: string;
  name: string;
  message: string;
  attendance?: Attendance;
  createdAt: string;
}

const FILE = "wishes";
const MAX_STORED = 2000;
const HASH = key("wishes");
const INDEX = key("wishes:index");

export const listWishes = async (limit = 200): Promise<Wish[]> => {
  if (redis) {
    const ids = await redis.zrange<string[]>(INDEX, 0, limit - 1, { rev: true });
    if (ids.length === 0) return [];
    const byId = (await redis.hmget<Record<string, Wish>>(HASH, ...ids)) ?? {};
    return ids.map((id) => byId[id]).filter((wish): wish is Wish => Boolean(wish));
  }
  const wishes = await readJson<Wish[]>(FILE, []);
  return wishes.slice(0, limit);
};

export const addWish = async (name: string, message: string, attendance: Attendance): Promise<Wish> => {
  const wish: Wish = { id: randomUUID(), name, message, attendance, createdAt: new Date().toISOString() };
  if (redis) {
    await redis.multi().hset(HASH, { [wish.id]: wish }).zadd(INDEX, { score: Date.now(), member: wish.id }).exec();
    return wish;
  }
  return updateJson<Wish[], Wish>(FILE, [], (wishes) => ({ data: [wish, ...wishes].slice(0, MAX_STORED), result: wish }));
};

export const deleteWish = async (id: string): Promise<boolean> => {
  if (redis) {
    const [removed] = await redis.multi().hdel(HASH, id).zrem(INDEX, id).exec<[number, number]>();
    return removed > 0;
  }
  return updateJson<Wish[], boolean>(FILE, [], (wishes) => {
    const next = wishes.filter((wish) => wish.id !== id);
    return { data: next, result: next.length !== wishes.length };
  });
};
