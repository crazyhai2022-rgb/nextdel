# NEXTDEL — Digital Products Store

Production-ready digital products e-commerce platform: storefront, cart, checkout, Razorpay + Cashfree payments with server-side verification and webhooks, secure PDF / access-link delivery, email automation, abandoned checkout tracking, Meta Pixel + Conversions API, and a full admin dashboard with CMS.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma · MySQL / MariaDB · Nodemailer (SMTP)
**Theme:** "Crimson Velvet" (#2C0F12 → #6B1E23). Colours are editable in Admin → Settings → General & Branding.

---

## 1. Requirements

- **Node.js 22.12+** (see `.nvmrc`; `package.json` `engines` enforces it). Node 18/20 are not supported.
- MySQL 8 / MariaDB 10.6+ (Hostinger MySQL works as-is)
- An SMTP mailbox (Hostinger Email works: `smtp.hostinger.com`, port 465)
- Razorpay and/or Cashfree merchant account

## 2. Local development

```bash
npm install
cp .env.example .env        # then edit .env
npx prisma migrate deploy   # creates all tables
npm run db:seed             # default CMS pages + settings (no products)
npm run create-admin        # first super admin
npm run dev                 # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin`

## 3. Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql://USER:PASSWORD@HOST:3306/DBNAME` — URL-encode special characters in the password (`@`→`%40`, `#`→`%23`). |
| `SITE_URL` | ✅ | Public URL, no trailing slash, e.g. `https://nextdel.in`. Used for emails, webhooks, sitemap. |
| `APP_SECRET` | ✅ | 64+ random characters. Encrypts saved gateway/SMTP/Meta secrets and signs download links. **Never change after go-live** (saved secrets would become unreadable). Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `STORAGE_DIR` | ✅ in production | Absolute folder for uploads, **outside the app folder**, e.g. `/home/<hostinger-user>/nextdel-storage`. |
| `ADMIN_SETUP_TOKEN` | optional | Enables the one-time `/admin/setup` page (only works while no admin exists). Remove after use. |
| `CRON_SECRET` | recommended | Protects `/api/cron/reconcile`. |
| `TOKIO_WORKER_THREADS` | Hostinger | `1`. Caps Next.js/SWC native threads during the build. `npm run build` defaults it to `1` if unset. |
| `RAYON_NUM_THREADS` | Hostinger | `1`. Same reason as above. |

When the server starts it checks these variables and logs a clear `[nextdel] ENV ERROR: …` line for anything missing or still a placeholder (for example `DB_USER` in `DATABASE_URL`, or `YOUR_HOSTINGER_USER` in `STORAGE_DIR`). It also logs `Database connection OK.` or `Database connection FAILED: …`. Secret values are never printed.

All payment, email and tracking credentials are entered in the **admin panel**, stored encrypted (AES-256-GCM) and never sent to the browser.

## 4. Deploying on Hostinger (Business / Cloud — Node.js Web App)

### 4.1 Create the MySQL database
1. hPanel → **Databases → MySQL Databases** → create database + user (e.g. `u123456789_nextdel`).
2. Note the host (usually `localhost` on the same account), database name, user and password.
3. Create the tables, using **either**:
   - **phpMyAdmin:** open the database → *Import* → upload `prisma/migrations/0001_init/migration.sql`, **or**
   - **SSH:** `npx prisma migrate deploy` (after step 4.3).

### 4.2 Create the Node.js app
1. hPanel → **Websites → Add website → Node.js Web App** (or *Advanced → Node.js* on your site).
2. Deploy from **GitHub** (branch `main`, auto-deploys on every push) or upload a ZIP of this folder (exclude `node_modules`, `.next`, `.env`, `storage`).
3. Settings:
   - Node version: **22.x** (required; Node 18 fails with `ERR_REQUIRE_ESM`)
   - Install command: `npm ci` (or `npm install`)
   - Build command: `npm run build`
   - Start command: `npm start`
   - Output: Next.js **standalone** (`.next/standalone/server.js`). `npm run build` copies the static assets into it, and `npm start` runs it, so either Hostinger's standalone detection or `npm start` works.
4. Add these **environment variables** in the app's *Environment variables* panel (real values only; never commit them):

   | Variable | Example format |
   |---|---|
   | `DATABASE_URL` | `mysql://u111111111_nextdel:PASSWORD@localhost:3306/u111111111_nextdel` (use the user, database and host shown in hPanel → Databases; URL-encode special characters in the password: `@`→`%40`, `#`→`%23`, `/`→`%2F`, `:`→`%3A`, `?`→`%3F`, `&`→`%26`) |
   | `SITE_URL` | `https://nextdel.store` (with `https://`, no trailing slash) |
   | `APP_SECRET` | 64+ random characters (never change after go-live) |
   | `STORAGE_DIR` | `/home/u111111111/nextdel-storage` (your real home path from File Manager; outside the app folder) |
   | `ADMIN_SETUP_TOKEN` | random value; delete after creating the first admin |
   | `CRON_SECRET` | random value, used in the cron URL |
   | `TOKIO_WORKER_THREADS` | `1` |
   | `RAYON_NUM_THREADS` | `1` |

5. Low-resource build: shared plans limit how many threads one account can start ("OS can't spawn worker thread: Resource temporarily unavailable"). The build is already tuned for this: one CPU worker, no worker threads, no separate webpack worker, static generation concurrency 1, and native thread pools capped by `scripts/build.mjs`. Lint and type checks are skipped inside the build; they run with `npm run check` and in GitHub Actions on every push/PR.

**After a redeploy, check:** the runtime log shows `Environment check passed.` and `Database connection OK.`; the home page loads; `/privacy-policy` shows the seeded page; `/admin/login` loads. If the home page says "The store is temporarily unavailable", the log line above it names the cause.

### 4.3 First-time setup (SSH — hPanel → Advanced → SSH Access)
```bash
cd ~/domains/YOUR-DOMAIN/nodejs   # your app folder
mkdir -p ~/nextdel-storage         # matches STORAGE_DIR
npx prisma migrate deploy          # skip if you imported the SQL in phpMyAdmin
npm run db:seed
npm run create-admin
```
**No SSH?** Set `ADMIN_SETUP_TOKEN` to a random value, open `https://YOUR-DOMAIN/admin/setup`, create the admin, then delete the variable. Run the seed by importing the SQL file — the app then works with default settings; legal pages are created by `db:seed`. Without SSH, run the seed once from your computer by pointing `DATABASE_URL` at Hostinger's *remote MySQL* (hPanel → Databases → Remote MySQL → allow your IP).

### 4.4 Cron job (recommended)
hPanel → **Advanced → Cron Jobs** → every 15 minutes:
```bash
curl -s "https://YOUR-DOMAIN/api/cron/reconcile?key=YOUR_CRON_SECRET" > /dev/null
```
It re-checks unpaid orders with the gateway (fulfils any payment whose webhook was missed), expires stale orders, and sends "payment failed" emails.

### 4.5 SSL & domain
Enable SSL in hPanel → **Security → SSL**, then set `SITE_URL` to the `https://` address.

### 4.6 Backups
Back up **both** the MySQL database and `STORAGE_DIR` (it holds product PDFs and images).

## 5. Admin configuration checklist

Sign in at `/admin`, then:

1. **Settings → General & Branding** — upload the NEXTDEL logo and favicon, and set the support email. Colours default to Crimson Velvet.
2. **Settings → Email (SMTP)** — Hostinger: host `smtp.hostinger.com`, port `465`, SSL on, username/password of your mailbox, sender = same mailbox. Click **Send test**.
3. **Settings → Payment Gateways** (see §6), then select the **Active checkout gateway**.
4. **Settings → Meta Pixel & CAPI** (see §7).
5. **Settings → Social, Footer, Support & SEO** — footer links, social links, Telegram support link.
6. **Pages (CMS)** — review and edit Privacy Policy, Terms, Refund Policy, About, FAQ, Contact. The seeded legal text is a template; have it reviewed by a professional.
7. **Products → Add product** — 16:9 thumbnail (1280×720), prices, description, PDF and/or access link, Telegram demo, then set Status → Published.

## 6. Payment gateways

### Razorpay
1. Dashboard → **Account & Settings → API Keys** → generate Test (later Live) keys.
2. Admin → Settings → Payment Gateways → Razorpay: enter **Key ID** + **Key Secret** for Test (and/or Live), and enable it.
3. Dashboard → **Settings → Webhooks → Add**:
   - URL: `https://YOUR-DOMAIN/api/webhooks/razorpay`
   - Secret: any strong string → enter the same value as **Webhook secret** in admin
   - Events: `payment.captured`, `payment.failed`, `order.paid`
4. Ensure **auto-capture** is on (Settings → Payment Capture). The app also captures authorised payments itself.
5. Click **Test saved credentials** and select Razorpay as active.

### Cashfree
1. Merchant Dashboard → **Developers → API Keys** → copy **App ID (Client ID)** and **Secret Key** (Sandbox / Production).
2. Admin → Payment Gateways → Cashfree: enter them, enable, choose mode.
3. Dashboard → **Developers → Webhooks** → add `https://YOUR-DOMAIN/api/webhooks/cashfree` (Payment webhooks, API version 2023-08-01). Signature uses your Client Secret automatically.
4. Whitelist your domain in Cashfree (required for production checkout).
5. Note: Cashfree requires a customer **mobile number**, so the checkout shows a phone field only while Cashfree is active.

### How payment verification works
- The backend creates the order and calculates the amount from database prices (the browser's prices are ignored).
- An order becomes **PAID** only when the gateway confirms it server-side: a signed webhook, a signature-verified Razorpay callback plus a re-fetch of the payment, or a status poll through the gateway API. Returning to the success URL alone never marks an order paid.
- Amount and currency must match the order exactly, otherwise the order is flagged for manual review.
- Fulfilment is atomic and idempotent: duplicate webhooks and callbacks deliver once.
- Every gateway call and webhook is logged and visible on the order page.

Switching the active gateway affects **new** checkouts only.

## 7. Meta Pixel & Conversions API
1. Events Manager → copy the **Pixel ID** → Admin → Settings → Meta Pixel & CAPI → enable it.
2. Optional CAPI: Events Manager → Settings → **Generate access token** → paste it and enable CAPI. Use a *Test event code* while testing.
3. Events: PageView, ViewContent (product page), AddToCart, InitiateCheckout (checkout page), AddPaymentInfo (Pay click), Purchase (success/thank-you page, verified orders only).
4. Purchase uses the event ID `purchase_<ORDERID>` in both the browser and CAPI, so Meta deduplicates them. The browser event fires once per order.
5. With "Require cookie consent" on (the default), the Pixel loads only after the visitor clicks Accept.

## 8. Digital delivery & security
- Product files are stored in `STORAGE_DIR/private` and are **never** publicly served.
- The thank-you page URL uses a random 256-bit token, not the order ID. It generates **signed download links valid for 24 hours**, freshly on every visit.
- Downloads re-check that the order is still PAID. Refunded orders lose access.
- Access links are shown only on the thank-you page and in the delivery email, never on the public product page.
- **Order Lookup** (`/order-lookup`) lets customers re-send their access email to the address on file. It never reveals whether an email has orders.

Other protections: bcrypt password hashing, DB-backed sessions (httpOnly, SameSite=Strict, Secure cookies), role-based access (Super Admin / Admin / Support), same-origin CSRF checks on all admin mutations, rate limiting (login, checkout, contact, lookup, downloads), zod validation on every input, HTML sanitisation of CMS/product content, magic-byte file-type validation, spreadsheet formula-injection-safe CSV export, an audit log, and security headers. Prisma uses parameterised queries throughout.

> The rate limiter is in-memory, which is right for Hostinger's single Node process. If you scale to multiple instances, move it to Redis.

## 9. Workflows

| Workflow | Where |
|---|---|
| Purchase | Product → Buy Now / Add to Cart → Checkout (name + email) → gateway → verified → email + thank-you page |
| Abandoned payment | Admin → **Abandoned Checkouts** — stages: cart → checkout started → details entered → pending → payment initiated → paid / failed / cancelled / expired |
| Resend product | Admin → Customers or Emails search → open order → **Resend Product Email** |
| Gateway switching | Admin → Settings → Payment Gateways → Active checkout gateway |
| Missed webhook | Order page → **Check status with gateway**, or the cron/reconcile job |
| Refund | Refund in the gateway dashboard → order page → **Mark refunded** (revokes access) |

## 10. Project structure
```
prisma/schema.prisma            database schema (MySQL)
prisma/migrations/0001_init     SQL for phpMyAdmin import / migrate deploy
prisma/seed.ts                  default pages & settings
scripts/create-admin.ts         create/reset admin from terminal
src/app/(shop)/                 storefront pages
src/app/admin/                  admin dashboard
src/app/api/                    APIs (checkout, payments, webhooks, admin)
src/lib/payments/               Razorpay, Cashfree, fulfilment & reconciliation
src/lib/                        auth, crypto, email, storage, settings, meta
src/components/                 shop + admin UI
```

## 11. Useful commands
```bash
npm run build          # production build (runs prisma generate)
npm start              # start production server (PORT env respected)
npm run typecheck      # TypeScript check
npm run lint           # ESLint
npm run check          # typecheck + lint (run before pushing)
npm run db:migrate     # apply migrations
npm run db:seed        # (re)seed defaults — never overwrites existing content
npm run create-admin   # create admin or reset a password
```
