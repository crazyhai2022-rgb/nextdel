import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { getSetting, saveSetting, invalidateSettings, DEFAULT_PIXEL_EVENTS } from "@/lib/settings";
import { safeUrl } from "@/lib/sanitize";
import { getGatewayConfig, type GatewayName } from "@/lib/payments/gateway";
import { testRazorpayCredentials } from "@/lib/payments/razorpay";
import { testCashfreeCredentials } from "@/lib/payments/cashfree";
import { verifyPixel } from "@/lib/meta";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #6B1E23");
const media = z.string().max(500).refine((u) => u === "" || u.startsWith("/media/") || /^https:\/\//.test(u), "Must be an uploaded file or https URL");
const link = z.string().max(500).refine((u) => u === "" || u.startsWith("/") || !!safeUrl(u, true), "Invalid link");

const schemas = {
  general: z.object({
    siteName: z.string().trim().min(1).max(60), companyName: z.string().trim().max(120), tagline: z.string().max(200),
    logoUrl: media, logoDarkUrl: media, faviconUrl: media, supportEmail: z.string().email(), currency: z.string().regex(/^[A-Z]{3}$/), timezone: z.string().max(60),
  }),
  branding: z.object({ primaryColor: hex, primaryTextColor: hex, accentLabelColor: hex, backgroundColor: hex }),
  homepage: z.object({
    heading: z.string().max(120), subheading: z.string().max(1000), showIntro: z.boolean(), announcementEnabled: z.boolean(),
    announcementText: z.string().max(200), announcementLink: link, sort: z.enum(["featured", "latest", "price_asc", "price_desc"]),
  }),
  checkout: z.object({
    pendingExpiryHours: z.coerce.number().int().min(1).max(720), secureNote: z.string().max(400),
    requireAgeConfirmation: z.boolean(), ageConfirmationText: z.string().max(300),
  }),
  footer: z.object({
    about: z.string().max(1000), contactEmail: z.string().max(191), address: z.string().max(500), showAddress: z.boolean(),
    copyright: z.string().max(200), disclaimer: z.string().max(500),
    columns: z.array(z.object({ title: z.string().trim().min(1).max(60), links: z.array(z.object({ label: z.string().trim().min(1).max(80), href: link })).max(12) })).max(5),
  }),
  seo: z.object({
    defaultTitle: z.string().max(200), titleTemplate: z.string().max(100).refine((s) => s === "" || s.includes("%s"), "Template must contain %s"),
    description: z.string().max(500), ogImage: media, keywords: z.string().max(500), allowIndexing: z.boolean(),
  }),
  support: z.object({ telegramSupportUrl: link, whatsappUrl: link, supportHours: z.string().max(120), contactFormEnabled: z.boolean(), supportNote: z.string().max(400) }),
};

const emailSchema = z.object({
  host: z.string().trim().max(200), port: z.coerce.number().int().min(1).max(65535), secure: z.boolean(), username: z.string().trim().max(200),
  password: z.string().max(500).optional(), fromName: z.string().max(100), fromEmail: z.string().max(191).refine((e) => e === "" || z.string().email().safeParse(e).success, "Invalid sender email"),
  replyTo: z.string().max(191).refine((e) => e === "" || z.string().email().safeParse(e).success, "Invalid reply-to email"), sendPendingEmail: z.boolean(), sendFailedEmail: z.boolean(),
});

const gatewayInput = z.object({
  enabled: z.boolean(), mode: z.enum(["TEST", "LIVE"]),
  testPublicKey: z.string().trim().max(255), livePublicKey: z.string().trim().max(255),
  testSecret: z.string().max(500).optional(), liveSecret: z.string().max(500).optional(),
  testWebhookSecret: z.string().max(500).optional(), liveWebhookSecret: z.string().max(500).optional(),
});
const paymentsSchema = z.object({ activeGateway: z.enum(["RAZORPAY", "CASHFREE", ""]), gateways: z.object({ RAZORPAY: gatewayInput, CASHFREE: gatewayInput }) });

const trackingSchema = z.object({
  pixelEnabled: z.boolean(), pixelId: z.string().trim().max(32).refine((s) => s === "" || /^\d{6,20}$/.test(s), "Pixel ID must be numeric"),
  capiEnabled: z.boolean(), capiToken: z.string().max(1000).optional(), testEventCode: z.string().trim().max(40),
  requireConsent: z.boolean(), events: z.record(z.string(), z.boolean()),
});

const socialSchema = z.object({ links: z.array(z.object({ platform: z.string().max(30), label: z.string().trim().min(1).max(60), url: z.string().trim().max(500), enabled: z.boolean() })).max(20) });

/** Secret field rule: undefined/"" keeps the stored value; "__clear__" removes it. */
function nextSecret(input: string | undefined, current: string | null | undefined) {
  if (input === undefined || input === "") return current ?? null;
  if (input === "__clear__") return null;
  return encryptSecret(input.trim());
}

export async function PUT(req: Request, { params }: { params: Promise<{ section: string }> }) {
  try {
    const admin = await requireAdmin(req, "settings");
    const { section } = await params;
    const body = await req.json();
    const ip = clientIp(req);

    if (section in schemas) {
      const key = section as keyof typeof schemas;
      const data = schemas[key].parse(body);
      // Merge into the stored section: a form only carries its own fields, and a plain replace would
      // wipe the others (for example saving "Checkout" used to delete the active payment gateway).
      const current = await getSetting(key);
      await saveSetting(key, { ...current, ...data } as never);
      await audit(admin.id, "settings_updated", { entity: "settings", entityId: key, ip });
      return json({ ok: true, message: "Saved" });
    }

    if (section === "email") {
      const b = emailSchema.parse(body);
      const cur = await getSetting("email");
      const { password, ...rest } = b;
      await saveSetting("email", { ...rest, passwordEnc: nextSecret(password, cur.passwordEnc) ?? "" });
      await audit(admin.id, "settings_updated", { entity: "settings", entityId: "email", details: { passwordChanged: !!password }, ip });
      return json({ ok: true, message: "Saved" });
    }

    if (section === "payments") {
      const b = paymentsSchema.parse(body);
      for (const g of ["RAZORPAY", "CASHFREE"] as GatewayName[]) {
        const i = b.gateways[g];
        const cur = await prisma.paymentGatewaySetting.findUnique({ where: { gateway: g } });
        const data = {
          enabled: i.enabled, mode: i.mode, testPublicKey: i.testPublicKey || null, livePublicKey: i.livePublicKey || null,
          testSecretEnc: nextSecret(i.testSecret, cur?.testSecretEnc), liveSecretEnc: nextSecret(i.liveSecret, cur?.liveSecretEnc),
          testWebhookSecretEnc: nextSecret(i.testWebhookSecret, cur?.testWebhookSecretEnc), liveWebhookSecretEnc: nextSecret(i.liveWebhookSecret, cur?.liveWebhookSecretEnc),
        };
        await prisma.paymentGatewaySetting.upsert({ where: { gateway: g }, create: { gateway: g, ...data }, update: data });
      }
      if (b.activeGateway) {
        const cfg = await getGatewayConfig(b.activeGateway);
        if (!cfg.enabled) return jsonError(`${b.activeGateway} must be enabled before it can be the active gateway. Other changes were saved.`, 422);
        if (!cfg.configured) return jsonError(`${b.activeGateway} is missing ${cfg.mode.toLowerCase()} credentials. Other changes were saved.`, 422);
      }
      const checkout = await getSetting("checkout");
      await saveSetting("checkout", { ...checkout, activeGateway: b.activeGateway });
      await audit(admin.id, "payment_settings_updated", { entity: "settings", entityId: "payments", details: { active: b.activeGateway, razorpay: { enabled: b.gateways.RAZORPAY.enabled, mode: b.gateways.RAZORPAY.mode }, cashfree: { enabled: b.gateways.CASHFREE.enabled, mode: b.gateways.CASHFREE.mode } }, ip });
      return json({ ok: true, message: b.activeGateway ? `Saved. ${b.activeGateway} is now the active checkout gateway.` : "Saved. No active gateway — checkout is disabled." });
    }

    if (section === "tracking") {
      const b = trackingSchema.parse(body);
      const cur = await prisma.marketingSetting.findUnique({ where: { id: 1 } });
      const data = {
        pixelEnabled: b.pixelEnabled && !!b.pixelId, pixelId: b.pixelId || null, capiEnabled: b.capiEnabled,
        capiTokenEnc: nextSecret(b.capiToken, cur?.capiTokenEnc), testEventCode: b.testEventCode || null, requireConsent: b.requireConsent,
        events: { ...DEFAULT_PIXEL_EVENTS, ...b.events },
      };
      if (data.capiEnabled && (!data.pixelId || !data.capiTokenEnc)) return jsonError("Conversions API needs both a Pixel ID and an access token.", 422);
      await prisma.marketingSetting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
      invalidateSettings();
      await audit(admin.id, "tracking_settings_updated", { entity: "settings", entityId: "tracking", details: { pixel: data.pixelEnabled, capi: data.capiEnabled }, ip });
      return json({ ok: true, message: "Saved" });
    }

    if (section === "social") {
      const b = socialSchema.parse(body);
      for (const l of b.links) if (l.url && !safeUrl(l.url, true)) return jsonError(`Invalid URL for ${l.label}`, 422);
      await prisma.$transaction([prisma.socialLink.deleteMany({}), prisma.socialLink.createMany({ data: b.links.filter((l) => l.url).map((l, i) => ({ ...l, url: safeUrl(l.url, true)!, sortOrder: i })) })]);
      await audit(admin.id, "settings_updated", { entity: "settings", entityId: "social", ip });
      return json({ ok: true, message: "Saved" });
    }

    return jsonError("Unknown settings section", 404);
  } catch (e) {
    return handleError(e);
  }
}

/** Credential / pixel verification actions. */
export async function POST(req: Request, { params }: { params: Promise<{ section: string }> }) {
  try {
    const admin = await requireAdmin(req, "settings");
    const { section } = await params;
    if (section === "payments") {
      const { gateway, mode } = z.object({ gateway: z.enum(["RAZORPAY", "CASHFREE"]), mode: z.enum(["TEST", "LIVE"]) }).parse(await req.json());
      const cfg = await getGatewayConfig(gateway, mode);
      if (!cfg.configured) return jsonError(`Save ${mode.toLowerCase()} credentials first.`, 422);
      const r = gateway === "RAZORPAY" ? await testRazorpayCredentials(cfg) : await testCashfreeCredentials(cfg);
      await audit(admin.id, "gateway_credentials_tested", { entity: "settings", entityId: gateway, details: { mode, ok: r.ok } });
      return r.ok ? json({ ok: true, message: `${gateway} ${mode.toLowerCase()} credentials are valid.` }) : jsonError(r.error ?? "Failed", 400);
    }
    if (section === "tracking") {
      const m = await prisma.marketingSetting.findUnique({ where: { id: 1 } });
      if (!m?.pixelId) return jsonError("Save a Pixel ID first.", 422);
      const status = await verifyPixel(m.pixelId, decryptSecret(m.capiTokenEnc));
      await prisma.marketingSetting.update({ where: { id: 1 }, data: { verificationStatus: status.slice(0, 255), lastVerifiedAt: new Date() } });
      return json({ ok: true, message: status });
    }
    return jsonError("Unknown action", 404);
  } catch (e) {
    return handleError(e);
  }
}
