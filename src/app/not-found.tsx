import Link from "next/link";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container-site flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="heading-spaced text-sm text-ink-muted">Error 404</p>
        <h1 className="mt-4 text-3xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 max-w-md text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-primary">Go to home</Link>
          <Link href="/products" className="btn-outline">Browse products</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
