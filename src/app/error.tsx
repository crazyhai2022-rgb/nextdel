"use client";

import Link from "next/link";

// Shown when a page throws on the server (for example the database is unreachable).
// The real error is logged on the server; the browser only gets a digest id.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-site flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="heading-spaced text-sm text-ink-muted">Something went wrong</p>
      <h1 className="mt-4 text-3xl font-semibold text-ink">We couldn&apos;t load this page</h1>
      <p className="mt-3 max-w-md text-ink-soft">This is usually temporary. Please try again in a moment.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Go to home</Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-ink-muted">Reference: {error.digest}</p>}
    </main>
  );
}
