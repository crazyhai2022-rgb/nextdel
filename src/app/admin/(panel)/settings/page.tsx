import Link from "next/link";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { getMarketing, getSettings, getSocialLinks } from "@/lib/settings";
import { storageUsage, UPLOAD_LIMITS } from "@/lib/storage";
import { siteUrl } from "@/lib/env";
import { FilterTabs, PageHeader, Panel } from "@/components/admin/ui";
import { EmailForm, GeneralForm, PaymentsForm, SiteForm, TrackingForm } from "@/components/admin/SettingsForms";

export const metadata = { title: "Settings" };

const TABS = [
  { key: "general", label: "General & Branding" },
  { key: "payments", label: "Payment Gateways" },
  { key: "email", label: "Email (SMTP)" },
  { key: "tracking", label: "Meta Pixel & CAPI" },
  { key: "site", label: "Social, Footer, Support & SEO" },
  { key: "legal", label: "Legal Pages" },
  { key: "storage", label: "File Storage" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await guardPage("settings");
  const requested = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === requested)?.key ?? "general";
  const s = await getSettings("general", "branding", "homepage", "checkout", "email", "footer", "support", "seo");

  let content: React.ReactNode = null;
  if (tab === "general") content = <GeneralForm general={s.general} branding={s.branding} homepage={s.homepage} />;
  if (tab === "payments") {
    const rows = await prisma.paymentGatewaySetting.findMany();
    const state = (g: "RAZORPAY" | "CASHFREE") => {
      const r = rows.find((x) => x.gateway === g);
      return {
        enabled: !!r?.enabled, mode: (r?.mode === "LIVE" ? "LIVE" : "TEST") as "TEST" | "LIVE", testPublicKey: r?.testPublicKey ?? "", livePublicKey: r?.livePublicKey ?? "",
        has: { testSecret: !!r?.testSecretEnc, liveSecret: !!r?.liveSecretEnc, testWebhookSecret: !!r?.testWebhookSecretEnc, liveWebhookSecret: !!r?.liveWebhookSecretEnc },
      };
    };
    content = <PaymentsForm active={s.checkout.activeGateway} gateways={{ RAZORPAY: state("RAZORPAY"), CASHFREE: state("CASHFREE") }} siteUrl={siteUrl()} checkout={s.checkout} />;
  }
  if (tab === "email") {
    const { passwordEnc, ...rest } = s.email;
    content = <EmailForm initial={rest} hasPassword={!!passwordEnc} />;
  }
  if (tab === "tracking") {
    const m = await getMarketing();
    content = <TrackingForm hasToken={!!m.capiTokenEnc} siteUrl={siteUrl()} initial={{ pixelEnabled: m.pixelEnabled, pixelId: m.pixelId ?? "", capiEnabled: m.capiEnabled, testEventCode: m.testEventCode ?? "", requireConsent: m.requireConsent, events: (m.events as Record<string, boolean>) ?? {}, verificationStatus: m.verificationStatus }} />;
  }
  if (tab === "site") {
    const social = await getSocialLinks(false);
    content = <SiteForm social={social.map((x) => ({ platform: x.platform, label: x.label, url: x.url, enabled: x.enabled }))} footer={s.footer} support={s.support} seo={s.seo} />;
  }
  if (tab === "legal") {
    const pages = await prisma.page.findMany({ where: { slug: { in: ["privacy-policy", "terms-and-conditions", "refund-policy"] } } });
    content = (
      <Panel title="Privacy & legal pages">
        <p className="mb-4 text-sm text-ink-soft">Legal pages are edited in the CMS. Have them reviewed by a legal professional — the default text is only a starting template.</p>
        <ul className="divide-y divide-line">
          {pages.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{p.title} <span className="text-xs text-ink-muted">/{p.slug} · {p.published ? "published" : "unpublished"}</span></span>
              <Link href={`/admin/pages/${p.slug}`} className="btn-outline btn-sm">Edit</Link>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }
  if (tab === "storage") {
    const u = await storageUsage();
    const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
    content = (
      <Panel title="File storage">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-ink-muted">Storage directory (STORAGE_DIR)</dt><dd className="break-all text-right text-ink">{u.dir}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Public files (images, videos)</dt><dd className="text-ink">{u.public.files} files · {mb(u.public.bytes)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Private files (product downloads)</dt><dd className="text-ink">{u.private.files} files · {mb(u.private.bytes)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Upload limits</dt><dd className="text-ink">Images {mb(UPLOAD_LIMITS.image)} · Video {mb(UPLOAD_LIMITS.video)} · PDF {mb(UPLOAD_LIMITS.pdf)} · ZIP {mb(UPLOAD_LIMITS.document)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-ink-muted">Private files are never publicly accessible — they&apos;re served only through signed, 24-hour download links for paid orders. On Hostinger, set STORAGE_DIR to a folder outside the app directory (e.g. /home/USER/nextdel-storage) so redeploys never delete uploads, and include it in your backups.</p>
      </Panel>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <FilterTabs active={tab} tabs={TABS.map((t) => ({ ...t, href: `/admin/settings?tab=${t.key}` }))} />
      {content}
    </div>
  );
}
