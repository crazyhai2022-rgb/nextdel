import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { siteUrl } from "@/lib/env";
import { DELIVERY_STATUS_LABEL, ORDER_STATUS_LABEL, STAGE_LABEL } from "@/lib/orders";
import { Badge, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { EmailComposer } from "@/components/admin/EmailComposer";
import { CopyButton } from "@/components/shop/CopyButton";

export const metadata = { title: "Order" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-ink-muted">{k}</dt><dd className="text-right text-ink">{v ?? "—"}</dd></div>;
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await guardPage("orders");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      emailLogs: { orderBy: { createdAt: "desc" }, include: { sentBy: { select: { name: true } } } },
      gatewayLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      checkout: true,
      downloadLogs: { orderBy: { createdAt: "desc" }, take: 20, include: { download: { select: { fileName: true } } } },
    },
  });
  if (!order) notFound();
  const webhooks = await prisma.paymentWebhook.findMany({ where: { orderNumber: order.orderNumber }, orderBy: { receivedAt: "desc" }, take: 20 });
  const accessUrl = `${siteUrl()}/thank-you/${order.accessToken}`;
  const open = order.status === "PENDING" || order.status === "PAYMENT_INITIATED";

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-ink-muted hover:text-ink">← Orders</Link>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Created ${fmtDate(order.createdAt)}`}
        actions={
          <>
            {order.status === "PAID" && <ActionButton url={`/api/admin/orders/${order.id}`} body={{ action: "resend" }} label="Resend Product Email" className="btn-primary btn-sm" confirm={`Resend the delivery email to ${order.customerEmail}?`} />}
            {order.gateway && order.status !== "REFUNDED" && <ActionButton url={`/api/admin/orders/${order.id}`} body={{ action: "sync" }} label="Check status with gateway" />}
            {order.status === "PAID" && <ActionButton url={`/api/admin/orders/${order.id}`} body={{ action: "refund" }} label="Mark refunded" confirm="Mark this order as refunded? Do this only after processing the refund in your gateway dashboard. Product access will be revoked." />}
            {open && <ActionButton url={`/api/admin/orders/${order.id}`} body={{ action: "cancel" }} label="Cancel order" confirm="Cancel this unpaid order? The gateway is checked first." />}
          </>
        }
      />
      {order.failureReason && <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">{order.failureReason}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Status">
          <dl>
            <Row k="Payment" v={<Badge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />} />
            <Row k="Delivery" v={<Badge status={order.deliveryStatus} label={DELIVERY_STATUS_LABEL[order.deliveryStatus]} />} />
            <Row k="Paid at" v={fmtDate(order.paidAt)} />
            <Row k="Delivered at" v={fmtDate(order.deliveredAt)} />
            <Row k="Customer opened access page" v={fmtDate(order.firstAccessedAt)} />
            {order.refundedAt && <Row k="Refunded at" v={fmtDate(order.refundedAt)} />}
            <Row k="Meta CAPI Purchase sent" v={fmtDate(order.purchaseEventSentAt)} />
          </dl>
        </Panel>
        <Panel title="Customer">
          <dl>
            <Row k="Name" v={order.customerName} />
            <Row k="Email" v={<Link className="hover:underline" href={`/admin/customers/${order.customerId}`}>{order.customerEmail}</Link>} />
            <Row k="Phone" v={order.customerPhone} />
            <Row k="IP" v={order.clientIp} />
          </dl>
          {order.status === "PAID" && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="text-xs text-ink-muted">Customer access page (secure link)</div>
              <div className="mt-1 break-all text-xs text-ink-soft">{accessUrl}</div>
              <div className="mt-2"><CopyButton text={accessUrl} label="Copy access link" /></div>
            </div>
          )}
        </Panel>
        <Panel title="Payment">
          <dl>
            <Row k="Gateway" v={order.gateway ? `${order.gateway} (${order.gatewayMode})` : "—"} />
            <Row k="Gateway order ID" v={<span className="break-all">{order.gatewayOrderId}</span>} />
            <Row k="Transaction ID" v={<span className="break-all">{order.transactionId}</span>} />
            <Row k="Subtotal" v={formatMoney(order.subtotal)} />
            <Row k="Discount" v={formatMoney(order.discount)} />
            <Row k="Final amount" v={<strong>{formatMoney(order.total)}</strong>} />
          </dl>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Purchased products">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="text-ink">{i.productTitle}</span>
                    <span className="block text-xs text-ink-muted">ID: {i.productId ?? "deleted"} {i.productId && <Link href={`/admin/products/${i.productId}`} className="ml-1 text-rose">Edit product</Link>}</span>
                  </span>
                  <span className="whitespace-nowrap text-right">{formatMoney(i.unitPrice)}{i.unitOriginalPrice > i.unitPrice && <span className="block text-xs text-ink-muted line-through">{formatMoney(i.unitOriginalPrice)}</span>}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Payments">
            {order.payments.length ? (
              <ul className="divide-y divide-line text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="break-all text-ink">{p.gatewayPaymentId}<span className="ml-2 text-xs text-ink-muted">{p.method} · via {p.verifiedVia.toLowerCase()}</span></span>
                    <span><Badge status={p.status === "SUCCESS" ? "PAID" : p.status} label={p.status} /> <span className="ml-2">{formatMoney(p.amount)}</span></span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No payment attempts recorded yet.</p>}
          </Panel>
          <Panel title="Gateway logs">
            {order.gatewayLogs.length ? (
              <ul className="space-y-2 text-xs">
                {order.gatewayLogs.map((l) => (
                  <li key={l.id}>
                    <details>
                      <summary className="cursor-pointer text-ink-soft"><span className={l.success ? "text-emerald-300" : "text-red-300"}>{l.success ? "✓" : "✕"}</span> {l.action} · HTTP {l.status} · {fmtDate(l.createdAt)}</summary>
                      <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-ink-muted">{l.response}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No gateway calls logged.</p>}
          </Panel>
          <Panel title="Webhooks received">
            {webhooks.length ? (
              <ul className="space-y-2 text-xs">
                {webhooks.map((w) => (
                  <li key={w.id}>
                    <details>
                      <summary className="cursor-pointer text-ink-soft">{w.eventType ?? "event"} · signature {w.signatureValid ? "valid" : "INVALID"} · {w.processed ? "processed" : "not processed"} · {fmtDate(w.receivedAt)}</summary>
                      {w.error && <p className="mt-1 text-red-300">{w.error}</p>}
                      <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-ink-muted">{w.payload}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No webhooks received for this order.</p>}
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Email customer">
            <EmailComposer to={order.customerEmail} orderId={order.id} defaultSubject={`Regarding your order ${order.orderNumber}`} />
          </Panel>
          <Panel title="Email history">
            {order.emailLogs.length ? (
              <ul className="divide-y divide-line text-sm">
                {order.emailLogs.map((e) => (
                  <li key={e.id} className="py-2">
                    <div className="flex justify-between gap-2"><span className="truncate text-ink">{e.subject}</span><Badge tone={e.status === "ACCEPTED" ? "green" : e.status === "FAILED" ? "red" : "amber"} label={e.status === "ACCEPTED" ? "Accepted" : e.status.toLowerCase()} /></div>
                    <div className="text-xs text-ink-muted">{e.type.replace(/_/g, " ").toLowerCase()} · {fmtDate(e.createdAt)}{e.sentBy ? ` · by ${e.sentBy.name}` : ""}</div>
                    {e.error && <div className="mt-1 text-xs text-red-300">{e.error}</div>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No emails sent yet.</p>}
            <p className="mt-3 text-[11px] text-ink-muted">&quot;Accepted&quot; = the mail server accepted the message for delivery; inbox delivery cannot be guaranteed.</p>
          </Panel>
          {order.checkout && (
            <Panel title="Checkout funnel">
              <dl>
                <Row k="Last stage" v={STAGE_LABEL[order.checkout.stage]} />
                <Row k="Last event" v={order.checkout.lastEvent} />
                <Row k="Started" v={fmtDate(order.checkout.createdAt)} />
              </dl>
            </Panel>
          )}
          <Panel title="Downloads">
            {order.downloadLogs.length ? (
              <ul className="text-xs text-ink-soft">{order.downloadLogs.map((d) => <li key={d.id} className="py-1">{d.download.fileName} · {fmtDate(d.createdAt)} · {d.ip}</li>)}</ul>
            ) : <p className="text-sm text-ink-muted">No downloads yet.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
