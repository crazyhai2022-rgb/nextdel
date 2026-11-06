import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { purchaseEventId } from "@/lib/meta";
import { PurchaseEffects } from "@/components/shop/PurchaseEffects";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Payment successful", robots: { index: false } };

export default async function SuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await prisma.order.findUnique({ where: { accessToken: token }, include: { items: true } });
  if (!order) notFound();
  if (order.status !== "PAID") redirect(`/payment/processing?token=${token}`);
  return (
    <div className="container-site flex min-h-[55vh] items-center justify-center py-16">
      <PurchaseEffects orderNumber={order.orderNumber} eventId={purchaseEventId(order.orderNumber)} value={order.total} currency={order.currency} productIds={order.items.map((i) => i.productId ?? i.productSlug)} names={order.items.map((i) => i.productTitle).join(", ")} />
      <div className="card w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose/50 bg-crimson/40 text-rose"><CheckIcon size={28} /></div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Payment successful</h1>
        <p className="mt-2 text-ink-soft">{formatMoney(order.total, order.currency)} paid · Order {order.orderNumber}</p>
        <p className="mt-1 text-sm text-ink-muted">A confirmation has been sent to {order.customerEmail}.</p>
        <Link href={`/thank-you/${order.accessToken}`} className="btn-primary mt-7 h-12 w-full">Access your product</Link>
      </div>
    </div>
  );
}
