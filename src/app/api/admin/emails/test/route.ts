import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleError, json, jsonError } from "@/lib/http";
import { customEmail, sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "settings");
    const { to } = z.object({ to: z.string().email() }).parse(await req.json());
    const mail = await customEmail("SMTP test email", "This is a test email from your store admin panel.\n\nIf you're reading this, your SMTP settings work.");
    const r = await sendEmail({ to, subject: mail.subject, html: mail.html, type: "TEST", sentById: admin.id });
    return r.ok ? json({ ok: true, message: `Test email accepted by the SMTP server for ${to}` }) : jsonError(r.error || "Failed", 502);
  } catch (e) {
    return handleError(e);
  }
}
