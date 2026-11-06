import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { signDownload } from "@/lib/crypto";
import { getSettings } from "@/lib/settings";
import { purchaseEventId } from "@/lib/meta";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { PaymentPoller } from "@/components/shop/PaymentPoller";
import { PurchaseEffects } from "@/components/shop/PurchaseEffects";
import { CopyButton } from "@/components/shop/CopyButton";
import { CheckIcon, DownloadIcon, LinkIcon, MailIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`;
}

export default async function ThankYouPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 20) notFound();
  const order = await prisma.order.findUnique({ where: { accessToken: token }, include: { items: true } });
  if (!order) notFound();

  if (order.status === "PENDING" || order.status === "PAYMENT_INITIATED") {
    return <div className="container-site flex min-h-[55vh] items-center justify-center py-16"><PaymentPoller token={token} /></div>;
  }
  if (order.status !== "PAID") {
    return (
      <div className="container-site flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Order {order.orderNumber}</h1>
        <p className="mt-3 text-ink-soft">Status: {ORDER_STATUS_LABEL[order.status]}. Product access is available only for successful payments.</p>
        <Link href="/contact-us" className="btn-outline mt-6">Contact support</Link>
      </div>
    );
  }

  if (!order.firstAccessedAt) await prisma.order.update({ where: { id: order.id }, data: { firstAccessedAt: new Date() } });

  const productIds = order.items.map((i) => i.productId).filter(Boolean) as string[];
  const [products, { general, support }] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, downloads: { orderBy: { sortOrder: "asc" } }, accessLinks: { orderBy: { sortOrder: "asc" } }, accessInstructions: true },
    }),
    getSettings("general", "support"),
  ]);
  const expires = Math.floor(Date.now() / 1000) + 24 * 3600; // links valid 24h; page always regenerates fresh ones

  return (
    <div className="container-site py-10 sm:py-14">
      <PurchaseEffects orderNumber={order.orderNumber} eventId={purchaseEventId(order.orderNumber)} value={order.total} currency={order.currency} productIds={order.items.map((i) => i.productId ?? i.productSlug)} names={order.items.map((i) => i.productTitle).join(", ")} />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose/50 bg-crimson/40 text-rose"><CheckIcon size={28} /></div>
          <h1 className="mt-5 text-[26px] font-semibold text-ink sm:text-3xl">Thank You for Your Purchase!</h1>
          <p className="mt-2 text-ink-soft">Your payment was successful, {order.customerName.split(" ")[0]}.</p>
        </div>

        <dl className="card mt-8 grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
          <div><dt className="text-ink-muted">Order ID</dt><dd className="mt-0.5 font-medium text-ink">{order.orderNumber}</dd></div>
          <div><dt className="text-ink-muted">Name</dt><dd className="mt-0.5 truncate font-medium text-ink">{order.customerName}</dd></div>
          <div><dt className="text-ink-muted">Amount</dt><dd className="mt-0.5 font-medium text-ink">{formatMoney(order.total, order.currency)}</dd></div>
          <div><dt className="text-ink-muted">Payment</dt><dd className="mt-0.5 font-medium text-emerald-300">Successful</dd></div>
        </dl>

        <div className="mt-8 space-y-6">
          {order.items.map((item) => {
            const p = products.find((x) => x.id === item.productId);
            return (
              <section key={item.id} className="card p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-ink">{item.productTitle}</h2>
                {!p && <p className="mt-3 text-sm text-ink-soft">This product's files are being updated. Please contact support and we'll send your access right away.</p>}
                {p && p.downloads.length > 0 && (
                  <div className="mt-5">
                    <h3 className="heading-spaced mb-3 text-[11px]">Download</h3>
                    <ul className="space-y-2">
                      {p.downloads.map((d) => (
                        <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-line bg-black/20 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="min-w-0 text-sm">
                            <span className="block truncate text-ink">{d.fileName}</span>
                            <span className="text-ink-muted">{fmtSize(d.size)}</span>
                          </span>
                          <a href={`/api/download?o=${order.id}&d=${d.id}&e=${expires}&s=${signDownload(order.id, d.id, expires)}`} className="btn-primary btn-sm shrink-0" rel="nofollow">
                            <DownloadIcon size={16} /> Download {d.mimeType === "application/pdf" ? "PDF" : "file"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p && p.accessLinks.length > 0 && (
                  <div className="mt-5">
                    <h3 className="heading-spaced mb-3 text-[11px]">Your Access Link</h3>
                    <ul className="space-y-2">
                      {p.accessLinks.map((l) => (
                        <li key={l.id} className="rounded-xl border border-line bg-black/20 p-3.5">
                          <div className="text-sm font-medium text-ink">{l.label}</div>
                          <div className="mt-1 break-all text-xs text-ink-muted">{l.url}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm"><LinkIcon size={16} /> Join / Open</a>
                            <CopyButton text={l.url} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p?.accessInstructions && <div className="rich mt-5 border-t border-line pt-4 text-sm" dangerouslySetInnerHTML={{ __html: p.accessInstructions }} />}
              </section>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-line p-5 text-sm text-ink-soft">
          <p className="flex items-start gap-2"><MailIcon size={17} className="mt-0.5 shrink-0" /> A copy of this page was emailed to <strong className="text-ink">{order.customerEmail}</strong>. Bookmark this page — download links refresh every time you open it.</p>
          <p className="mt-3">Need help? Email <a className="text-rose underline" href={`mailto:${general.supportEmail}`}>{general.supportEmail}</a>{support.telegramSupportUrl && <> or <a className="text-rose underline" href={support.telegramSupportUrl} target="_blank" rel="noopener noreferrer">message us on Telegram</a></>} with your order ID.</p>
        </div>
      </div>
    </div>
  );
}
