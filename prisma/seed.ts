/**
 * Seeds default CMS pages and settings. Safe to run multiple times — never overwrites
 * existing pages or settings. Does NOT create products (add them in the admin panel).
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOTE = `<p class="note"><em>Template — review and edit this page from Admin → Pages before going live. Have legal pages checked by a qualified professional.</em></p>`;

const PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: "about-us",
    title: "About Us",
    content: `<p>NEXTDEL creates and curates downloadable digital products delivered instantly with lifetime access.</p><h2>What we do</h2><p>Every product is built to be practical and easy to follow. After purchase you receive immediate access by email and on your secure order page.</p><h2>Why NEXTDEL</h2><ul><li>Instant digital delivery</li><li>Lifetime access to your purchases</li><li>Secure payments through trusted Indian payment gateways</li><li>Responsive customer support</li></ul>`,
  },
  {
    slug: "contact-us",
    title: "Contact Us",
    content: `<p>Have a question about a product or an order? We're happy to help. Include your order ID for faster support.</p>`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    content: `<h3>How do I receive my product?</h3><p>Immediately after your payment is verified, we email you a link to your secure order page where you can download files and open your access links.</p><h3>I paid but didn't receive an email.</h3><p>Check your spam/promotions folder first. You can also use <a href="/order-lookup">Order Lookup</a> to resend your access email instantly, or contact support with your order ID.</p><h3>Is my payment secure?</h3><p>Yes. Payments are processed by our payment partner (Razorpay or Cashfree). We never see or store your card, UPI PIN or banking details.</p><h3>How long do I have access?</h3><p>Products marked "Lifetime Access" remain available for as long as the product is offered on NEXTDEL.</p><h3>Can I get a refund?</h3><p>Please read our <a href="/refund-policy">Refund Policy</a>.</p>`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `${NOTE}<p>This Privacy Policy explains how NEXTDEL ("we", "us") collects, uses and protects your information when you use our website and purchase our digital products.</p>
<h2>1. Information we collect</h2><ul><li><strong>Details you provide:</strong> your name, email address and (where our payment partner requires it) mobile number when you check out or contact us.</li><li><strong>Order information:</strong> products purchased, amounts, order and transaction IDs, and payment status.</li><li><strong>Technical information:</strong> IP address, browser type, device information and pages visited, collected through cookies and similar technologies.</li></ul>
<h2>2. Email information</h2><p>We use your email address to deliver your purchases, send order confirmations and receipts, respond to support requests and, where you started a checkout, occasionally follow up about an incomplete order. We do not sell your email address.</p>
<h2>3. Payment processing</h2><p>Payments are processed by third-party payment gateways (Razorpay and/or Cashfree Payments). Your card, UPI and banking details are entered directly with the payment gateway and are never stored on our servers. Gateways process your data under their own privacy policies.</p>
<h2>4. Cookies</h2><p>We use essential cookies/local storage to run the website (for example, to remember your cart). With your consent, we also use analytics and advertising cookies. You can accept or decline non-essential cookies through our cookie banner and can clear cookies in your browser at any time.</p>
<h2>5. Analytics and Meta Pixel</h2><p>With your consent we use the Meta Pixel (and may use the Meta Conversions API) to measure the effectiveness of our advertising — for example, when a product is viewed, added to cart or purchased. Information shared with Meta may include hashed (encrypted) email addresses, order values, product identifiers, IP address and browser information.</p>
<h2>6. Data storage and security</h2><p>Your data is stored on secure servers. We use encryption, access controls and other safeguards to protect it. We retain order records as long as needed to provide access to your purchases and to meet legal, tax and accounting obligations.</p>
<h2>7. Third-party services</h2><p>We share data only with service providers that help us operate: payment gateways, email delivery providers, hosting providers and (with consent) Meta. Each processes data only for the services they provide to us.</p>
<h2>8. Your rights</h2><p>Subject to applicable law, you may request access to, correction of or deletion of your personal data, and you may withdraw consent for marketing or tracking at any time. Some order information must be retained for legal reasons.</p>
<h2>9. Contact</h2><p>For privacy questions or requests, contact us via the <a href="/contact-us">Contact Us</a> page.</p>`,
  },
  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    content: `${NOTE}<p>By accessing this website or purchasing from NEXTDEL, you agree to these Terms and Conditions.</p>
<h2>1. Eligibility</h2><p>Some products are intended only for adults. By purchasing, you confirm you are at least 18 years old (or the age of majority in your jurisdiction) and legally permitted to access the content.</p>
<h2>2. Digital products and licence</h2><p>All products are digital. On purchase you receive a personal, non-transferable, non-exclusive licence to access and use the product for your own personal use. You may not resell, share, redistribute, publicly post or reproduce the content.</p>
<h2>3. Pricing and payment</h2><p>Prices are shown in Indian Rupees (INR). Payment is processed securely by our payment partners. An order is confirmed only after payment is verified by the payment gateway.</p>
<h2>4. Delivery</h2><p>Products are delivered digitally by email and through your secure order page after payment verification. Download links are time-limited for security; your order page always generates fresh links.</p>
<h2>5. Refunds</h2><p>Refunds are governed by our <a href="/refund-policy">Refund Policy</a>.</p>
<h2>6. Intellectual property</h2><p>All content, trademarks and materials are owned by NEXTDEL or its licensors and are protected by law.</p>
<h2>7. Limitation of liability</h2><p>Products are provided for informational and personal use. To the extent permitted by law, NEXTDEL is not liable for indirect or consequential losses arising from use of the products.</p>
<h2>8. Changes</h2><p>We may update these terms from time to time. The version published on this page applies to your purchase.</p>
<h2>9. Governing law</h2><p>These terms are governed by the laws of India.</p>`,
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    content: `${NOTE}<p>NEXTDEL sells downloadable digital products and digital access-based products. Because digital products can be downloaded or accessed immediately after purchase, <strong>refunds and returns are generally not offered once an order has been successfully delivered or access has been provided.</strong></p>
<h2>When we will help</h2><p>Nothing in this policy limits any rights or remedies you have under applicable consumer protection law. We will provide a remedy — such as re-delivery, a replacement or a refund — in situations including:</p><ul><li><strong>Duplicate charge:</strong> you were charged more than once for the same order.</li><li><strong>Unauthorised transaction:</strong> a payment was made without your permission.</li><li><strong>Non-delivery:</strong> you paid but did not receive access and we are unable to provide it.</li><li><strong>Technical failure:</strong> the file or access link is defective and we cannot fix it within a reasonable time.</li><li><strong>Other cases</strong> where a remedy is required by law.</li></ul>
<h2>How to request help</h2><p>Contact us through the <a href="/contact-us">Contact Us</a> page within 7 days of purchase with your order ID, the email used at checkout and a description of the issue. Approved refunds are processed to the original payment method; timelines depend on your bank and payment provider.</p>
<h2>Failed or pending payments</h2><p>If money was debited but your order shows as failed, the amount is normally reversed automatically by your bank or payment provider within 5–7 working days. Contact us if it isn't.</p>`,
  },
];

const SOCIAL = [
  { platform: "telegram", label: "Telegram", url: "", enabled: false },
  { platform: "instagram", label: "Instagram", url: "", enabled: false },
  { platform: "youtube", label: "YouTube", url: "", enabled: false },
  { platform: "facebook", label: "Facebook", url: "", enabled: false },
];

async function main() {
  for (const p of PAGES) {
    await prisma.page.upsert({ where: { slug: p.slug }, create: { ...p, published: true }, update: {} });
  }
  for (const g of ["RAZORPAY", "CASHFREE"]) {
    await prisma.paymentGatewaySetting.upsert({ where: { gateway: g }, create: { gateway: g }, update: {} });
  }
  await prisma.marketingSetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  if ((await prisma.socialLink.count()) === 0) {
    // Placeholders are disabled & URL-less; enable them in Admin → Settings once you add URLs.
    await prisma.socialLink.createMany({ data: SOCIAL.filter((s) => s.url).map((s, i) => ({ ...s, sortOrder: i })) });
  }
  console.log(`Seed complete: ${PAGES.length} pages ensured, gateway & marketing settings initialised.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
