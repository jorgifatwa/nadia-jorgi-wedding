import "server-only";
import { storageMode } from "./redis";

// Wraps a route handler so storage failures reach the client as a JSON message instead of a bare 500
export const withErrors =
  <A extends unknown[]>(handler: (...args: A) => Promise<Response>) =>
  async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(err);
      const error =
        storageMode() === "missing"
          ? "Penyimpanan belum dikonfigurasi: hubungkan Upstash Redis ke project Vercel ini, lalu Redeploy."
          : "Server gagal memproses data, coba lagi sebentar lagi.";
      return Response.json({ error }, { status: 503 });
    }
  };
