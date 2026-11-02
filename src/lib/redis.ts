import "server-only";
import { Redis } from "@upstash/redis";

// Upstash Redis (Vercel Marketplace) when its env vars are present, otherwise null so local development falls back to
// the JSON files in data/. The Vercel integration provides KV_REST_API_* (or <PREFIX>_KV_REST_API_* when a custom
// prefix was chosen while connecting); a direct Upstash database UPSTASH_REDIS_REST_*.
const findEnv = (suffixes: string[]) => {
  for (const suffix of suffixes) {
    if (process.env[suffix]) return process.env[suffix];
    const prefixed = Object.keys(process.env).find((name) => name.endsWith(`_${suffix}`) && process.env[name]);
    if (prefixed) return process.env[prefixed];
  }
  return undefined;
};

const url = findEnv(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"]);
const token = findEnv(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"]);

export const redis: Redis | null = url && token ? new Redis({ url, token }) : null;

// Where data is saved: Redis, local JSON files, or nowhere (Vercel without Redis, where every write fails)
export const storageMode = (): "redis" | "file" | "missing" => (redis ? "redis" : process.env.VERCEL ? "missing" : "file");

// Namespaced keys so the database can be shared with other projects safely
export const key = (name: string) => `wedding:${name}`;

const memoryHits = new Map<string, number[]>();

// Fixed-window rate limit; returns true when the action is allowed. Shared across serverless instances via Redis.
export const rateLimit = async (id: string, limit: number, windowSeconds: number): Promise<boolean> => {
  if (redis) {
    const counter = key(`ratelimit:${id}`);
    const count = await redis.incr(counter);
    if (count === 1) await redis.expire(counter, windowSeconds);
    return count <= limit;
  }
  const now = Date.now();
  const hits = (memoryHits.get(id) ?? []).filter((t) => now - t < windowSeconds * 1000);
  if (hits.length >= limit) return false;
  memoryHits.set(id, [...hits, now]);
  return true;
};

export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
