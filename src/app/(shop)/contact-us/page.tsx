import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/shop/ContactForm";
import { MailIcon, SocialIcon } from "@/components/icons";

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: "contact-us" } });
  return { title: page?.seoTitle || "Contact Us", description: page?.seoDescription || undefined, alternates: { canonical: "/contact-us" } };
}

export default async function ContactPage() {
  const [page, { general, support }] = await Promise.all([prisma.page.findUnique({ where: { slug: "contact-us" } }), getSettings("general", "support")]);
  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="heading-spaced border-b border-line pb-4 text-[15px] sm:text-base">{page?.title || "Contact Us"}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          {page?.published && page.content && <div className="rich" dangerouslySetInnerHTML={{ __html: page.content }} />}
          <div className="mt-8 space-y-3">
            <a href={`mailto:${general.supportEmail}`} className="card flex items-center gap-3 p-4 hover:border-rose/40">
              <MailIcon /> <span><span className="block text-sm text-ink-muted">Email</span><span className="text-ink">{general.supportEmail}</span></span>
            </a>
            {support.telegramSupportUrl && (
              <a href={support.telegramSupportUrl} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-4 hover:border-rose/40">
                <SocialIcon platform="telegram" size={20} /> <span><span className="block text-sm text-ink-muted">Telegram support</span><span className="text-ink">Message us</span></span>
              </a>
            )}
            {support.whatsappUrl && (
              <a href={support.whatsappUrl} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-4 hover:border-rose/40">
                <SocialIcon platform="whatsapp" size={20} /> <span><span className="block text-sm text-ink-muted">WhatsApp</span><span className="text-ink">Chat with us</span></span>
              </a>
            )}
            {support.supportHours && <p className="text-sm text-ink-muted">Support hours: {support.supportHours}</p>}
            {support.supportNote && <p className="text-sm text-ink-soft">{support.supportNote} <Link href="/order-lookup" className="text-rose underline">Order lookup →</Link></p>}
            <p className="text-sm text-ink-muted">Have a question? See our <Link href="/faq" className="text-rose underline">FAQ</Link>.</p>
          </div>
        </div>
        {support.contactFormEnabled && (
          <div className="card h-fit p-5 sm:p-6">
            <h2 className="heading-spaced mb-5 text-[12px]">Send us a message</h2>
            <ContactForm />
          </div>
        )}
      </div>
    </div>
  );
}
