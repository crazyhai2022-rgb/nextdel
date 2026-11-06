import crypto from "node:crypto";
import { safeEqual } from "../crypto";
import { type GatewayConfig, logGateway } from "./gateway";

const API_VERSION = "2023-08-01";

function base(cfg: GatewayConfig) {
  return cfg.mode === "LIVE" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

async function call<T>(cfg: GatewayConfig, method: string, path: string, body: unknown, orderId: string | null, action: string, idem?: string): Promise<T> {
  const res = await fetch(`${base(cfg)}${path}`, {
    method,
    headers: {
      "x-client-id": cfg.publicKey,
      "x-client-secret": cfg.secret,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
      ...(idem ? { "x-idempotency-key": idem } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  await logGateway(orderId, "CASHFREE", action, res.ok, res.status, data);
  if (!res.ok) throw new Error((data as { message?: string })?.message || `Cashfree error ${res.status}`);
  return data as T;
}

export type CfOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id: string;
};

export type CfPayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: "SUCCESS" | "NOT_ATTEMPTED" | "FAILED" | "USER_DROPPED" | "VOID" | "CANCELLED" | "PENDING";
  payment_group?: string;
  payment_message?: string;
};

export function createCashfreeOrder(
  cfg: GatewayConfig,
  args: {
    orderNumber: string;
    amount: number; // paise
    currency: string;
    customer: { id: string; name: string; email: string; phone: string };
    returnUrl: string;
    notifyUrl: string;
    note: string;
  },
  orderId: string,
) {
  return call<CfOrder>(
    cfg,
    "POST",
    "/orders",
    {
      order_id: args.orderNumber,
      order_amount: Number((args.amount / 100).toFixed(2)),
      order_currency: args.currency,
      customer_details: {
        customer_id: args.customer.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50),
        customer_name: args.customer.name.slice(0, 100),
        customer_email: args.customer.email,
        customer_phone: args.customer.phone,
      },
      order_meta: { return_url: args.returnUrl, notify_url: args.notifyUrl },
      order_note: args.note.slice(0, 200),
    },
    orderId,
    "create_order",
    args.orderNumber,
  );
}

export function getCashfreeOrder(cfg: GatewayConfig, orderNumber: string, orderId: string) {
  return call<CfOrder>(cfg, "GET", `/orders/${encodeURIComponent(orderNumber)}`, null, orderId, "fetch_order");
}

export function getCashfreePayments(cfg: GatewayConfig, orderNumber: string, orderId: string) {
  return call<CfPayment[]>(cfg, "GET", `/orders/${encodeURIComponent(orderNumber)}/payments`, null, orderId, "fetch_payments");
}

/** Cashfree webhook: base64(HMAC_SHA256(timestamp + rawBody, clientSecret)) */
export function verifyCashfreeWebhook(rawBody: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!timestamp || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  return safeEqual(expected, signature);
}

export async function testCashfreeCredentials(cfg: GatewayConfig) {
  // Fetching a non-existent order returns 404 for valid credentials, 401 for invalid ones.
  const res = await fetch(`${base(cfg)}/orders/nd_credential_check_${Date.now()}`, {
    headers: { "x-client-id": cfg.publicKey, "x-client-secret": cfg.secret, "x-api-version": API_VERSION },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) return { ok: false, error: `Cashfree rejected the credentials (HTTP ${res.status})` };
  return { ok: true };
}
