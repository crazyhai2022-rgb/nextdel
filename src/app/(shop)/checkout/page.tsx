import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getActiveGateway } from "@/lib/payments/gateway";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [{ checkout, general }, gateway] = await Promise.all([getSettings("checkout", "general"), getActiveGateway()]);
  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="heading-spaced mb-8 border-b border-line pb-4 text-[15px] sm:text-base">Checkout</h1>
      <CheckoutForm
        gateway={gateway ? { name: gateway.gateway, mode: gateway.mode } : null}
        currency={general.currency}
        secureNote={checkout.secureNote}
        requireAge={checkout.requireAgeConfirmation}
        ageText={checkout.ageConfirmationText}
      />
    </div>
  );
}
