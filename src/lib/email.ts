import nodemailer from "nodemailer";
import { prisma } from "./db";
import { getSetting, getSmtpConfig } from "./settings";
import { siteUrl } from "./env";
import { escapeHtml } from "./sanitize";
import { formatMoney } from "./money";

export type EmailType =
  | "ORDER_CONFIRMATION"
  | "RESEND_DELIVERY"
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "CUSTOM"
  | "INQUIRY_REPLY"
  | "ABANDONED_FOLLOWUP"
  | "TEST";

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailType;
  orderId?: string | null;
  sentById?: string | null;
};

export type SendResult = { ok: boolean; logId: string; error?: string };

/**
 * Sends via SMTP and logs the attempt. "ACCEPTED" means the SMTP server accepted the
 * message for delivery — it does NOT guarantee it reached the inbox.
 */
export async function sendEmail(input: SendInput): Promise<SendResult> {
  const log = await prisma.emailLog.create({
    data: {
      recipient: input.to,
      subject: input.subject.slice(0, 300),
      type: input.type,
      orderId: input.orderId ?? null,
      sentById: input.sentById ?? null,
      status: "QUEUED",
    },
  });
  try {
    const smtp = await getSmtpConfig();
    if (!smtp.host || !smtp.username || !smtp.password || !smtp.fromEmail) {
      throw new Error("SMTP is not configured (Admin → Settings → Email).");
    }
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 465,
      secure: Boolean(smtp.secure),
      auth: { user: smtp.username, pass: smtp.password },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
    const info = await transporter.sendMail({
      from: { name: smtp.fromName || "NEXTDEL", address: smtp.fromEmail },
      to: input.to,
      replyTo: smtp.replyTo || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToText(input.html),
    });
    const accepted = (info.accepted ?? []).length > 0;
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: accepted ? "ACCEPTED" : "FAILED",
        messageId: info.messageId?.slice(0, 255) ?? null,
        error: accepted ? null : `Rejected: ${JSON.stringify(info.rejected ?? [])}`,
      },
    });
    return accepted ? { ok: true, logId: log.id } : { ok: false, logId: log.id, error: "Recipient rejected by SMTP server" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.emailLog.update({ where: { id: log.id }, data: { status: "FAILED", error: msg.slice(0, 2000) } });
    return { ok: false, logId: log.id, error: msg };
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d|li)>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ───────────── Templates ─────────────

async function layout(title: string, bodyHtml: string) {
  const [general, branding] = await Promise.all([getSetting("general"), getSetting("branding")]);
  const brand = escapeHtml(general.siteName || "NEXTDEL");
  const logo = general.logoUrl
    ? `<img src="${escapeHtml(general.logoUrl.startsWith("http") ? general.logoUrl : siteUrl() + general.logoUrl)}" alt="${brand}" height="28" style="height:28px;display:block">`
    : `<span style="font-size:18px;font-weight:700;letter-spacing:.08em;color:#111">${brand}</span>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e4e4e7">${logo}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a">
Need help? Reply to this email or write to <a href="mailto:${escapeHtml(general.supportEmail)}" style="color:${escapeHtml(branding.primaryColor)}">${escapeHtml(general.supportEmail)}</a>.<br>
${escapeHtml(general.companyName)} · <a href="${siteUrl()}" style="color:#71717a">${siteUrl().replace(/^https?:\/\//, "")}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string, color: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${escapeHtml(color)};color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:15px">${escapeHtml(label)}</a>`;
}

type OrderForEmail = {
  id: string;
  orderNumber: string;
  accessToken: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  transactionId: string | null;
  items: { productTitle: string; unitPrice: number; productId: string | null }[];
};

export async function deliveryEmail(order: OrderForEmail) {
  const branding = await getSetting("branding");
  const accessUrl = `${siteUrl()}/thank-you/${order.accessToken}`;
  const productIds = order.items.map((i) => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, accessLinks: { orderBy: { sortOrder: "asc" } }, _count: { select: { downloads: true } } },
  });
  const rows = order.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5">${escapeHtml(i.productTitle)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #f4f4f5">${formatMoney(i.unitPrice, order.currency)}</td></tr>`)
    .join("");
  const linkBlocks = products
    .flatMap((p) =>
      p.accessLinks.map(
        (l) => `<p style="margin:6px 0"><strong>${escapeHtml(p.title)}</strong> — <a href="${escapeHtml(l.url)}" style="color:${escapeHtml(branding.primaryColor)}">${escapeHtml(l.label)}</a></p>`,
      ),
    )
    .join("");
  const hasDownloads = products.some((p) => p._count.downloads > 0);

  const body = `
<h1 style="font-size:20px;margin:0 0 8px">Thank you for your purchase, ${escapeHtml(order.customerName.split(" ")[0])}!</h1>
<p style="margin:0 0 16px;color:#3f3f46">Your payment was successful. Your product${order.items.length > 1 ? "s are" : " is"} ready.</p>
<table role="presentation" width="100%" style="font-size:14px;margin:0 0 16px">
<tr><td style="color:#71717a">Order ID</td><td align="right"><strong>${escapeHtml(order.orderNumber)}</strong></td></tr>
${order.transactionId ? `<tr><td style="color:#71717a">Transaction ID</td><td align="right">${escapeHtml(order.transactionId)}</td></tr>` : ""}
<tr><td style="color:#71717a">Payment</td><td align="right" style="color:#15803d"><strong>Confirmed</strong></td></tr>
</table>
<table role="presentation" width="100%" style="font-size:14px;margin:0 0 8px">${rows}
<tr><td style="padding:10px 0"><strong>Amount paid</strong></td><td align="right" style="padding:10px 0"><strong>${formatMoney(order.total, order.currency)}</strong></td></tr></table>
<p style="margin:20px 0">${button(accessUrl, hasDownloads ? "Download / Access your product" : "Access your product", branding.primaryColor)}</p>
${linkBlocks ? `<div style="margin:16px 0;padding:14px 16px;background:#fafafa;border:1px solid #e4e4e7;border-radius:6px"><p style="margin:0 0 6px;font-weight:600">Your access link${products.length > 1 ? "s" : ""}</p>${linkBlocks}</div>` : ""}
<p style="font-size:13px;color:#71717a">Keep this email — the button above always opens your secure order page, where fresh download links are generated for you.</p>`;
  return {
    subject: `Your order ${order.orderNumber} is confirmed — access inside`,
    html: await layout("Order confirmed", body),
  };
}

export async function pendingEmail(order: { orderNumber: string; customerName: string; accessToken: string }) {
  const branding = await getSetting("branding");
  const body = `<h1 style="font-size:20px;margin:0 0 8px">We're confirming your payment</h1>
<p>Hi ${escapeHtml(order.customerName.split(" ")[0])}, your order <strong>${escapeHtml(order.orderNumber)}</strong> is awaiting payment confirmation from our payment partner. You'll receive your product as soon as it's confirmed.</p>
<p style="margin:20px 0">${button(`${siteUrl()}/thank-you/${order.accessToken}`, "Check order status", branding.primaryColor)}</p>`;
  return { subject: `Order ${order.orderNumber}: payment pending`, html: await layout("Payment pending", body) };
}

export async function failedEmail(order: { orderNumber: string; customerName: string; items: { productSlug: string }[] }) {
  const branding = await getSetting("branding");
  const retry = order.items[0] ? `${siteUrl()}/product/${order.items[0].productSlug}` : siteUrl();
  const body = `<h1 style="font-size:20px;margin:0 0 8px">Your payment didn't go through</h1>
<p>Hi ${escapeHtml(order.customerName.split(" ")[0])}, the payment for order <strong>${escapeHtml(order.orderNumber)}</strong> was not completed. No product has been delivered. If money was debited, it is usually reversed automatically by your bank — contact us with your order ID if it isn't.</p>
<p style="margin:20px 0">${button(retry, "Try again", branding.primaryColor)}</p>`;
  return { subject: `Order ${order.orderNumber}: payment not completed`, html: await layout("Payment failed", body) };
}

export async function customEmail(subject: string, message: string) {
  const html = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`)
    .join("");
  return { subject, html: await layout(subject, html) };
}
