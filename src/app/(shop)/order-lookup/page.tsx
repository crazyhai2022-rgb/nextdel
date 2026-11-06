import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/shop/OrderLookupForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Order Lookup & Support", alternates: { canonical: "/order-lookup" } };

export default async function OrderLookupPage() {
  const { general } = await getSettings("general");
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="heading-spaced border-b border-line pb-4 text-[15px] sm:text-base">Order Lookup</h1>
        <p className="mt-5 text-ink-soft">Didn't receive your product email? Enter the email you used at checkout. If we find a successful order, we'll resend your secure access link to that email.</p>
        <div className="card mt-6 p-5 sm:p-6"><OrderLookupForm /></div>
        <p className="mt-6 text-sm text-ink-muted">Still need help? Write to <a href={`mailto:${general.supportEmail}`} className="text-rose underline">{general.supportEmail}</a> with your order ID and payment reference.</p>
      </div>
    </div>
  );
}
