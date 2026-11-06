import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { MetaPixel } from "@/components/shop/MetaPixel";
import { getPublicTracking } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const tracking = await getPublicTracking();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MetaPixel {...tracking} />
    </div>
  );
}
