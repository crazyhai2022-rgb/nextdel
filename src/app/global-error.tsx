"use client";

// Last-resort fallback when the root layout itself fails. Uses inline styles because
// the app stylesheet may not be loaded at this point.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#150709", color: "#f3e9e7", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: "0.3em", fontSize: 13, opacity: 0.7, textTransform: "uppercase" }}>NEXTDEL</p>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: "16px 0 8px" }}>We&apos;ll be right back</h1>
          <p style={{ opacity: 0.8, maxWidth: 420 }}>The store is temporarily unavailable. Please try again in a few minutes.</p>
          <button type="button" onClick={reset} style={{ marginTop: 24, padding: "10px 22px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "#6B1E23", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
