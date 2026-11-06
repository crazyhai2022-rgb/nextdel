import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { EmailComposer } from "@/components/admin/EmailComposer";

export const metadata = { title: "Inquiry" };

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  await guardPage("inquiries");
  const { id } = await params;
  const inq = await prisma.contactInquiry.findUnique({ where: { id } });
  if (!inq) notFound();
  const [customer, order] = await Promise.all([
    prisma.customer.findUnique({ where: { email: inq.email } }),
    inq.orderNumber ? prisma.order.findUnique({ where: { orderNumber: inq.orderNumber.toUpperCase() } }) : null,
  ]);
  return (
    <div>
      <Link href="/admin/inquiries" className="text-sm text-ink-muted hover:text-ink">← Inquiries</Link>
      <PageHeader
        title={inq.subject || "Inquiry"}
        description={`From ${inq.name} <${inq.email}> · ${fmtDate(inq.createdAt)} · status: ${inq.status.replace("_", " ").toLowerCase()}`}
        actions={
          <>
            {inq.status !== "IN_PROGRESS" && <ActionButton url={`/api/admin/inquiries/${inq.id}`} method="PATCH" body={{ status: "IN_PROGRESS" }} label="Mark in progress" />}
            {inq.status !== "RESOLVED" && <ActionButton url={`/api/admin/inquiries/${inq.id}`} method="PATCH" body={{ status: "RESOLVED" }} label="Mark resolved" className="btn-primary btn-sm" />}
            {inq.status === "RESOLVED" && <ActionButton url={`/api/admin/inquiries/${inq.id}`} method="PATCH" body={{ status: "NEW" }} label="Reopen" />}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Message"><p className="whitespace-pre-wrap text-sm leading-6 text-ink-soft">{inq.message}</p></Panel>
          <Panel title="Context">
            <ul className="space-y-1 text-sm text-ink-soft">
              <li>Customer record: {customer ? <Link href={`/admin/customers/${customer.id}`} className="text-rose hover:underline">{customer.name}</Link> : "none"}</li>
              <li>Order: {order ? <Link href={`/admin/orders/${order.id}`} className="text-rose hover:underline">{order.orderNumber} ({order.status})</Link> : inq.orderNumber ?? "not provided"}</li>
              {inq.repliedAt && <li>Last replied: {fmtDate(inq.repliedAt)}</li>}
            </ul>
          </Panel>
        </div>
        <Panel title="Reply by email" className="h-fit">
          <EmailComposer to={inq.email} inquiryId={inq.id} defaultSubject={`Re: ${inq.subject || "Your message"}`} defaultMessage={`Hi ${inq.name.split(" ")[0]},\n\n`} />
        </Panel>
      </div>
    </div>
  );
}
