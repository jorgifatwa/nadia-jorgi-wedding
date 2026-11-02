import { isAdminConfigured, isAdminRequest } from "@/lib/adminAuth";
import { storageMode } from "@/lib/redis";

export async function GET() {
  return Response.json({ authenticated: await isAdminRequest(), configured: isAdminConfigured(), storage: storageMode() });
}
