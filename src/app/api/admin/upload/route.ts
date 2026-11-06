import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { saveUpload } from "@/lib/storage";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** public → images/videos served at /media/...  ·  private → product files (PDF/ZIP), never publicly reachable */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "products");
    const fd = await req.formData();
    const file = fd.get("file");
    const visibility = fd.get("visibility") === "private" ? "private" : "public";
    if (!(file instanceof File)) return jsonError("No file uploaded", 400);
    const saved = await saveUpload(file, visibility, visibility === "private" ? ["pdf", "document"] : ["image", "video"]);
    await audit(admin.id, "file_uploaded", { entity: "file", entityId: saved.key, details: { visibility, size: saved.size, name: saved.originalName }, ip: clientIp(req) });
    return json({ ok: true, file: saved });
  } catch (e) {
    return handleError(e);
  }
}
