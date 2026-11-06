import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { plainText } from "@/lib/sanitize";
import { getSetting } from "@/lib/settings";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(191),
  subject: z.string().trim().max(200).optional(),
  orderNumber: z.string().trim().max(32).optional(),
  message: z.string().trim().min(10, "Message is too short").max(5000),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  try {
    const support = await getSetting("support");
    if (!support.contactFormEnabled) return jsonError("Contact form is disabled", 403);
    const ip = clientIp(req);
    rateLimit(`contact:${ip}`, 5, 10 * 60_000);
    const b = schema.parse(await req.json());
    if (b.website) return json({ ok: true });
    await prisma.contactInquiry.create({
      data: { name: plainText(b.name, 120), email: b.email, subject: plainText(b.subject, 200) || null, orderNumber: plainText(b.orderNumber, 32) || null, message: plainText(b.message, 5000), ip },
    });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
