import { prisma } from "./db";
import { decryptSecret, sha256 } from "./crypto";
import { getMarketing } from "./settings";
import { siteUrl } from "./env";

const GRAPH = "https://graph.facebook.com/v21.0";

export function purchaseEventId(orderNumber: string) {
  return `purchase_${orderNumber}`;
}

/** Server-side Purchase event (Conversions API). Shares event_id with the browser pixel for deduplication. */
export async function sendPurchaseEvent(orderId: string) {
  const m = await getMarketing();
  const token = decryptSecret(m.capiTokenEnc);
  if (!m.capiEnabled || !m.pixelId || !token) return { skipped: true };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status !== "PAID" || order.purchaseEventSentAt) return { skipped: true };

  const [fn, ...rest] = order.customerName.trim().toLowerCase().split(/\s+/);
  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor((order.paidAt ?? new Date()).getTime() / 1000),
        event_id: purchaseEventId(order.orderNumber),
        action_source: "website",
        event_source_url: order.sourceUrl || `${siteUrl()}/checkout`,
        user_data: {
          em: [sha256(order.customerEmail.trim().toLowerCase())],
          ...(fn ? { fn: [sha256(fn)] } : {}),
          ...(rest.length ? { ln: [sha256(rest.join(" "))] } : {}),
          ...(order.clientIp ? { client_ip_address: order.clientIp } : {}),
          ...(order.userAgent ? { client_user_agent: order.userAgent } : {}),
          ...(order.fbp ? { fbp: order.fbp } : {}),
          ...(order.fbc ? { fbc: order.fbc } : {}),
          external_id: [sha256(order.customerId)],
        },
        custom_data: {
          currency: order.currency,
          value: order.total / 100,
          order_id: order.orderNumber,
          content_type: "product",
          content_ids: order.items.map((i) => i.productId ?? i.productSlug),
          content_name: order.items.map((i) => i.productTitle).join(", "),
          contents: order.items.map((i) => ({ id: i.productId ?? i.productSlug, quantity: i.quantity, item_price: i.unitPrice / 100 })),
          num_items: order.items.length,
        },
      },
    ],
    ...(m.testEventCode ? { test_event_code: m.testEventCode } : {}),
  };
  const res = await fetch(`${GRAPH}/${m.pixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    await prisma.order.update({ where: { id: orderId }, data: { purchaseEventSentAt: new Date() } });
    return { ok: true };
  }
  const err = await res.text();
  console.error("[capi] purchase failed", res.status, err.slice(0, 500));
  return { ok: false, error: err.slice(0, 500) };
}

export async function verifyPixel(pixelId: string, token: string | null) {
  if (!/^\d{6,20}$/.test(pixelId)) return "Invalid Pixel ID format (should be numeric).";
  if (!token) return "Pixel ID format valid. Add a Conversions API token to verify against Meta.";
  const res = await fetch(`${GRAPH}/${pixelId}?fields=name,last_fired_time&access_token=${encodeURIComponent(token)}`);
  const data = (await res.json().catch(() => ({}))) as { name?: string; last_fired_time?: string; error?: { message?: string } };
  if (!res.ok) return `Meta returned an error: ${data.error?.message ?? res.status}`;
  return `Verified with Meta: "${data.name ?? pixelId}"${data.last_fired_time ? ` · last fired ${data.last_fired_time}` : " · no events received yet"}`;
}
