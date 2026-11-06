import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="heading-spaced mb-8 border-b border-line pb-4 text-[15px] sm:text-base">Your Cart</h1>
      <CartView />
    </div>
  );
}
