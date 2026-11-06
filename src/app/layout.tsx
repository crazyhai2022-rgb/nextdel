import type { Metadata, Viewport } from "next";
import { Inter, Jost } from "next/font/google";
import "./globals.css";
import { getSettings, hexToRgbTriplet } from "@/lib/settings";
import { siteUrl } from "@/lib/env";
import { CartProvider } from "@/components/shop/CartProvider";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-display", display: "swap" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, general } = await getSettings("seo", "general");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo.defaultTitle, template: seo.titleTemplate || `%s | ${general.siteName}` },
    description: seo.description,
    keywords: seo.keywords || undefined,
    applicationName: general.siteName,
    icons: general.faviconUrl ? { icon: general.faviconUrl } : undefined,
    robots: seo.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: general.siteName,
      title: seo.defaultTitle,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#150709", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { branding } = await getSettings("branding");
  const vars = `:root{--brand:${hexToRgbTriplet(branding.primaryColor, "107 30 35")};--brand-fg:${hexToRgbTriplet(branding.primaryTextColor, "255 255 255")};--accent-label:${/^#[0-9a-f]{6}$/i.test(branding.accentLabelColor) ? branding.accentLabelColor : "#e8a9a2"}}${/^#[0-9a-f]{6}$/i.test(branding.backgroundColor) ? `body{background-color:${branding.backgroundColor}}` : ""}`;
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: vars }} />
      </head>
      <body className="min-h-screen font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
