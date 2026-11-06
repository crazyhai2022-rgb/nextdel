import crypto from "node:crypto";
import { safeEqual } from "../crypto";
import { type GatewayConfig, logGateway } from "./gateway";

const API = "https://api.razorpay.com/v1";

function authHeader(cfg: GatewayConfig) {
  return "Basic " + Buffer.from(`${cfg.publicKey}:${cfg.secret}`).toString("base64");
}

async function call<T>(cfg: GatewayConfig, method: string, path: string, body: unknown, orderId: string | null, action: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: authHeader(cfg), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  await logGateway(orderId, "RAZORPAY", action, res.ok, res.status, data);
  if (!res.ok) {
    const msg = (data as { error?: { description?: string } })?.error?.description || `Razorpay error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export type RzpOrder = { id: string; amount: number; currency: string; status: string; receipt: string };
export type RzpPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  error_description?: string | null;
  captured?: boolean;
};

export function createRazorpayOrder(
  cfg: GatewayConfig,
  args: { amount: number; currency: string; receipt: string; notes: Record<string, string> },
  orderId: string,
) {
  return call<RzpOrder>(cfg, "POST", "/orders", { ...args, payment_capture: 1 }, orderId, "create_order");
}

export async function fetchOrderPayments(cfg: GatewayConfig, rzpOrderId: string, orderId: string) {
  const r = await call<{ items: RzpPayment[] }>(cfg, "GET", `/orders/${encodeURIComponent(rzpOrderId)}/payments`, null, orderId, "fetch_order_payments");
  return r.items ?? [];
}

export function fetchPayment(cfg: GatewayConfig, paymentId: string, orderId: string) {
  return call<RzpPayment>(cfg, "GET", `/payments/${encodeURIComponent(paymentId)}`, null, orderId, "fetch_payment");
}

export function capturePayment(cfg: GatewayConfig, paymentId: string, amount: number, currency: string, orderId: string) {
  return call<RzpPayment>(cfg, "POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency }, orderId, "capture_payment");
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyCheckoutSignature(rzpOrderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(`${rzpOrderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature || "");
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret) */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null, webhookSecret: string) {
  if (!signature || !webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export async function testRazorpayCredentials(cfg: GatewayConfig) {
  const res = await fetch(`${API}/orders?count=1`, { headers: { Authorization: authHeader(cfg) }, cache: "no-store" });
  return res.ok ? { ok: true } : { ok: false, error: `Razorpay rejected the credentials (HTTP ${res.status})` };
}
