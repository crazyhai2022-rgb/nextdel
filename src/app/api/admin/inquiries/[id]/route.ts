import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req, "inquiries");
    const { id } = await params;
    const { status } = z.object({ status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]) }).parse(await req.json());
    await prisma.contactInquiry.update({ where: { id }, data: { status } });
    await audit(admin.id, "inquiry_status", { entity: "inquiry", entityId: id, details: { status } });
    return json({ ok: true, message: "Updated" });
  } catch (e) {
    return handleError(e);
  }
}
