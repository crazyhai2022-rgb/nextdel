import type { Metadata } from "next";
import { PaymentPoller } from "@/components/shop/PaymentPoller";

export const metadata: Metadata = { title: "Processing payment", robots: { index: false } };

export default async function ProcessingPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="container-site flex min-h-[55vh] items-center justify-center py-16">
      {token ? <PaymentPoller token={token} /> : <p className="text-ink-soft">Missing order reference.</p>}
    </div>
  );
}
