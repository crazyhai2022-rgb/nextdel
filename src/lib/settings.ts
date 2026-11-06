import { prisma } from "./db";
import { decryptSecret } from "./crypto";

export type GeneralSettings = {
  siteName: string;
  companyName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  supportEmail: string;
  currency: string;
  timezone: string;
};

export type BrandingSettings = {
  primaryColor: string; // hex
  primaryTextColor: string; // hex
  accentLabelColor: string;
  backgroundColor: string;
};

export type EmailSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordEnc: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  sendPendingEmail: boolean;
  sendFailedEmail: boolean;
};

export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type FooterSettings = {
  about: string;
  contactEmail: string;
  address: string;
  showAddress: boolean;
  copyright: string;
  columns: FooterColumn[];
  disclaimer: string;
};

export type SeoSettings = {
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  ogImage: string;
  keywords: string;
  allowIndexing: boolean;
};

export type SupportSettings = {
  telegramSupportUrl: string;
  whatsappUrl: string;
  supportHours: string;
  contactFormEnabled: boolean;
  supportNote: string;
};

export type HomepageSettings = {
  heading: string;
  subheading: string;
  showIntro: boolean;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  sort: "featured" | "latest" | "price_asc" | "price_desc";
};

export type CheckoutSettings = {
  activeGateway: "RAZORPAY" | "CASHFREE" | "";
  pendingExpiryHours: number;
  secureNote: string;
  requireAgeConfirmation: boolean;
  ageConfirmationText: string;
};

export type SettingsMap = {
  general: GeneralSettings;
  branding: BrandingSettings;
  email: EmailSettings;
  footer: FooterSettings;
  seo: SeoSettings;
  support: SupportSettings;
  homepage: HomepageSettings;
  checkout: CheckoutSettings;
};

export const DEFAULT_SETTINGS: SettingsMap = {
  general: {
    siteName: "NEXTDEL",
    companyName: "NEXTDEL",
    tagline: "Digital learning resources",
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    supportEmail: "support@example.com",
    currency: "INR",
    timezone: "Asia/Kolkata",
  },
  branding: {
    primaryColor: "#6B1E23",
    primaryTextColor: "#ffffff",
    accentLabelColor: "#e8a9a2",
    backgroundColor: "#150709",
  },
  email: {
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    username: "",
    passwordEnc: "",
    fromName: "NEXTDEL",
    fromEmail: "",
    replyTo: "",
    sendPendingEmail: false,
    sendFailedEmail: true,
  },
  footer: {
    about: "NEXTDEL offers downloadable digital learning resources with instant, lifetime access.",
    contactEmail: "support@example.com",
    address: "",
    showAddress: false,
    copyright: "© {year} NEXTDEL. All rights reserved.",
    disclaimer: "",
    columns: [
      { title: "Company", links: [{ label: "About Us", href: "/about-us" }, { label: "Contact Us", href: "/contact-us" }] },
      {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms & Conditions", href: "/terms-and-conditions" },
          { label: "Refund Policy", href: "/refund-policy" },
        ],
      },
      { title: "Support", links: [{ label: "FAQ", href: "/faq" }, { label: "Customer Support", href: "/order-lookup" }] },
    ],
  },
  seo: {
    defaultTitle: "NEXTDEL — Digital Learning Resources",
    titleTemplate: "%s | NEXTDEL",
    description: "Downloadable digital educational products with instant lifetime access.",
    ogImage: "",
    keywords: "",
    allowIndexing: true,
  },
  support: {
    telegramSupportUrl: "",
    whatsappUrl: "",
    supportHours: "Mon–Sat, 10:00–19:00 IST",
    contactFormEnabled: true,
    supportNote: "Didn't receive your product? Use Order Lookup to resend your access email instantly.",
  },
  homepage: {
    heading: "All Products",
    subheading: "",
    showIntro: false,
    announcementEnabled: false,
    announcementText: "",
    announcementLink: "",
    sort: "featured",
  },
  checkout: {
    activeGateway: "",
    pendingExpiryHours: 24,
    secureNote: "Payments are processed securely by our payment partner. We never see or store your card details.",
    requireAgeConfirmation: false,
    ageConfirmationText: "I confirm that I am 18 years of age or older.",
  },
};

type Key = keyof SettingsMap;

let cache: { at: number; data: Partial<SettingsMap> } | null = null;
const TTL = 15_000;

async function loadAll(): Promise<Partial<SettingsMap>> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const rows = await prisma.siteSetting.findMany();
  const data: Partial<SettingsMap> = {};
  for (const r of rows) {
    try {
      (data as Record<string, unknown>)[r.key] = JSON.parse(r.value);
    } catch {}
  }
  cache = { at: Date.now(), data };
  return data;
}

export function invalidateSettings() {
  cache = null;
}

export async function getSetting<K extends Key>(key: K): Promise<SettingsMap[K]> {
  const all = await loadAll();
  return { ...DEFAULT_SETTINGS[key], ...(all[key] ?? {}) } as SettingsMap[K];
}

export async function getSettings<K extends Key>(...keys: K[]): Promise<Pick<SettingsMap, K>> {
  const all = await loadAll();
  const out = {} as Pick<SettingsMap, K>;
  for (const k of keys) (out as Record<string, unknown>)[k] = { ...DEFAULT_SETTINGS[k], ...(all[k] ?? {}) };
  return out;
}

export async function saveSetting<K extends Key>(key: K, value: SettingsMap[K]) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
  invalidateSettings();
}

export async function getSmtpConfig() {
  const s = await getSetting("email");
  return { ...s, password: decryptSecret(s.passwordEnc) ?? "" };
}

export async function getSocialLinks(enabledOnly = true) {
  return prisma.socialLink.findMany({
    where: enabledOnly ? { enabled: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getMarketing() {
  return (
    (await prisma.marketingSetting.findUnique({ where: { id: 1 } })) ?? {
      id: 1,
      pixelEnabled: false,
      pixelId: null,
      capiEnabled: false,
      capiTokenEnc: null,
      testEventCode: null,
      requireConsent: true,
      events: null,
      verificationStatus: null,
      lastVerifiedAt: null,
      updatedAt: new Date(),
    }
  );
}

export type PixelEvents = {
  PageView: boolean;
  ViewContent: boolean;
  AddToCart: boolean;
  InitiateCheckout: boolean;
  AddPaymentInfo: boolean;
  Purchase: boolean;
};

export const DEFAULT_PIXEL_EVENTS: PixelEvents = {
  PageView: true,
  ViewContent: true,
  AddToCart: true,
  InitiateCheckout: true,
  AddPaymentInfo: true,
  Purchase: true,
};

/** Public (safe-to-expose) tracking config for the storefront. */
export async function getPublicTracking() {
  const m = await getMarketing();
  const events = { ...DEFAULT_PIXEL_EVENTS, ...((m.events as Partial<PixelEvents> | null) ?? {}) };
  return {
    enabled: Boolean(m.pixelEnabled && m.pixelId && /^\d{6,20}$/.test(m.pixelId)),
    pixelId: m.pixelId ?? "",
    requireConsent: m.requireConsent,
    events,
  };
}

export function hexToRgbTriplet(hex: string, fallback = "17 17 19"): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
