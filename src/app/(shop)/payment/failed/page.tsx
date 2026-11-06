import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false } };

export default function FailedPage() {
  return (
    <div className="container-site flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">Payment not completed</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">Your payment wasn&apos;t completed, so no product was delivered. You can safely try again.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/checkout" className="btn-primary">Try again</Link>
        <Link href="/contact-us" className="btn-outline">Contact support</Link>
      </div>
    </div>
  );
}
