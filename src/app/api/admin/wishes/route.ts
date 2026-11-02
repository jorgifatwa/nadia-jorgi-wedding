import { isAdminRequest, unauthorized } from "@/lib/adminAuth";
import { deleteWish, listWishes } from "@/lib/wishesStore";
import { withErrors } from "@/lib/apiHandler";

export const GET = withErrors(async () => {
  if (!(await isAdminRequest())) return unauthorized();
  return Response.json({ wishes: await listWishes(Number.MAX_SAFE_INTEGER) });
});

export const DELETE = withErrors(async (request: Request) => {
  if (!(await isAdminRequest())) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID ucapan wajib diisi." }, { status: 400 });
  const deleted = await deleteWish(id);
  return deleted ? Response.json({ ok: true }) : Response.json({ error: "Ucapan tidak ditemukan." }, { status: 404 });
});
