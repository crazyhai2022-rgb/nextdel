import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { cleanHtml, plainText } from "@/lib/sanitize";
import { audit } from "@/lib/audit";

const schema = z.object({ title: z.string().trim().min(1).max(200), content: z.string().max(500000), seoTitle: z.string().max(200), seoDescription: z.string().max(500), published: z.boolean() });

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const admin = await requireAdmin(req, "pages");
    const { slug } = await params;
    const b = schema.parse(await req.json());
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) return jsonError("Page not found", 404);
    await prisma.page.update({ where: { slug }, data: { title: plainText(b.title, 200), content: cleanHtml(b.content), seoTitle: plainText(b.seoTitle, 200) || null, seoDescription: plainText(b.seoDescription, 500) || null, published: b.published } });
    await audit(admin.id, "page_updated", { entity: "page", entityId: slug, details: { published: b.published }, ip: clientIp(req) });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
