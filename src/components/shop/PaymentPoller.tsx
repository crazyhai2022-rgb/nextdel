"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentPoller({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "failed" | "timeout">("checking");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let stopped = false;
    const started = Date.now();
    async function tick() {
      if (stopped) return;
      try {
        const r = await fetch(`/api/payments/status?token=${encodeURIComponent(token)}`, { cache: "no-store" }).then((x) => x.json());
        if (r.status === "PAID") return router.replace(`/payment/success/${token}`);
        if (["FAILED", "CANCELLED", "EXPIRED"].includes(r.status)) {
          setStatus(r.status);
          setState("failed");
          return;
        }
      } catch {}
      if (Date.now() - started > 3 * 60_000) return setState("timeout");
      setTimeout(tick, 3000);
    }
    tick();
    return () => {
      stopped = true;
    };
  }, [token, router]);

  if (state === "failed") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">Payment {status === "CANCELLED" ? "cancelled" : status === "EXPIRED" ? "expired" : "not completed"}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">No product has been delivered and you have not been charged for this attempt. If money was debited, it is normally reversed automatically by your bank.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/checkout" className="btn-primary">Try again</Link>
          <Link href="/contact-us" className="btn-outline">Contact support</Link>
        </div>
      </div>
    );
  }
  if (state === "timeout") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">Still confirming your payment</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">Your bank is taking longer than usual. You don't need to pay again — as soon as the payment is confirmed, we'll email your product automatically.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => location.reload()} className="btn-primary">Check again</button>
          <Link href="/order-lookup" className="btn-outline">Order lookup</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-rose" />
      <h1 className="mt-6 text-2xl font-semibold text-ink">Confirming your payment…</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">Please don't close this page or press back. This usually takes a few seconds.</p>
    </div>
  );
}
