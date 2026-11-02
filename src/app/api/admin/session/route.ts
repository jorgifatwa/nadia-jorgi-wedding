import { isAdminConfigured, isAdminRequest } from "@/lib/adminAuth";

export async function GET() {
  return Response.json({ authenticated: await isAdminRequest(), configured: isAdminConfigured() });
}
