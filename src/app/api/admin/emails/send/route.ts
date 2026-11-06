import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { customEmail, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const schema = z.object({
  to: z.string().trim().toLowerCase().email().max(191),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
  orderId: z.string().max(40).optional(),
  checkoutId: z.string().max(40).optional(),
  inquiryId: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "emails");
    rateLimit(`admin-email:${admin.id}`, 60, 60 * 60_000);
    const b = schema.parse(await req.json());
    const mail = await customEmail(b.subject, b.message);
    const r = await sendEmail({ to: b.to, subject: mail.subject, html: mail.html, type: b.inquiryId ? "INQUIRY_REPLY" : b.checkoutId ? "ABANDONED_FOLLOWUP" : "CUSTOM", orderId: b.orderId ?? null, sentById: admin.id });
    if (r.ok && b.checkoutId) await prisma.abandonedCheckout.update({ where: { id: b.checkoutId }, data: { contactedAt: new Date() } }).catch(() => {});
    if (r.ok && b.inquiryId) await prisma.contactInquiry.update({ where: { id: b.inquiryId }, data: { repliedAt: new Date(), status: "IN_PROGRESS" } }).catch(() => {});
    await audit(admin.id, "custom_email_sent", { entity: "email", entityId: r.logId, details: { to: b.to, subject: b.subject, ok: r.ok }, ip: clientIp(req) });
    return r.ok ? json({ ok: true }) : jsonError(r.error || "Email failed", 502);
  } catch (e) {
    return handleError(e);
  }
}
