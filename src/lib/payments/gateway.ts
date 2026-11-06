import { prisma } from "../db";
import { decryptSecret } from "../crypto";
import { getSetting } from "../settings";

export type GatewayName = "RAZORPAY" | "CASHFREE";
export const GATEWAYS: GatewayName[] = ["RAZORPAY", "CASHFREE"];

export type GatewayConfig = {
  gateway: GatewayName;
  enabled: boolean;
  mode: "TEST" | "LIVE";
  publicKey: string;
  secret: string;
  webhookSecret: string;
  configured: boolean;
};

export async function getGatewayConfig(gateway: GatewayName, mode?: "TEST" | "LIVE"): Promise<GatewayConfig> {
  const row = await prisma.paymentGatewaySetting.findUnique({ where: { gateway } });
  const m = (mode ?? (row?.mode as "TEST" | "LIVE") ?? "TEST") === "LIVE" ? "LIVE" : "TEST";
  const publicKey = (m === "LIVE" ? row?.livePublicKey : row?.testPublicKey) ?? "";
  const secret = decryptSecret(m === "LIVE" ? row?.liveSecretEnc : row?.testSecretEnc) ?? "";
  // Cashfree signs webhooks with the client secret; Razorpay uses a separate webhook secret.
  const webhookSecret =
    decryptSecret(m === "LIVE" ? row?.liveWebhookSecretEnc : row?.testWebhookSecretEnc) ?? (gateway === "CASHFREE" ? secret : "");
  return {
    gateway,
    enabled: Boolean(row?.enabled),
    mode: m,
    publicKey,
    secret,
    webhookSecret,
    configured: Boolean(publicKey && secret),
  };
}

/** The gateway customers see at checkout: selected as active, enabled, and has credentials. */
export async function getActiveGateway(): Promise<GatewayConfig | null> {
  const checkout = await getSetting("checkout");
  // An explicitly selected gateway wins. If none is selected, fall back to the first gateway that is
  // enabled and has credentials, so a missing selection does not switch checkout off.
  const candidates: GatewayName[] = checkout.activeGateway ? [checkout.activeGateway] : GATEWAYS;
  for (const g of candidates) {
    const cfg = await getGatewayConfig(g);
    if (cfg.enabled && cfg.configured) return cfg;
  }
  return null;
}

export async function logGateway(
  orderId: string | null,
  gateway: GatewayName,
  action: string,
  success: boolean,
  status: number | null,
  response: unknown,
) {
  try {
    const text = typeof response === "string" ? response : JSON.stringify(response);
    await prisma.gatewayLog.create({
      data: { orderId, gateway, action, success, status, response: text?.slice(0, 60000) ?? null },
    });
  } catch (e) {
    console.error("[gateway-log]", e);
  }
}
