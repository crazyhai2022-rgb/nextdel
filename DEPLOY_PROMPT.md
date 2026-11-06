# NEXTDEL — Hostinger deploy prompt for Claude in Chrome

**How to use (kaise use karein):**
1. Open hPanel (https://hpanel.hostinger.com) in Chrome and log in yourself.
2. Keep these files ready on your computer: `hostinger-secrets.txt`, plus `nextdel-hostinger.zip` (it contains `database/hostinger-database.sql` and is the backup upload option). Code on GitHub: https://github.com/crazyhai2022-rgb/nextdel
3. Open the Claude in Chrome extension, copy everything below the line, and paste it in.
4. Whenever Claude asks for a password, secret, or file upload, do that step yourself, then tell Claude "done".

---

You are helping me deploy my website **NEXTDEL** (a Next.js 15 + Prisma + MySQL app) on my **Hostinger Business/Cloud hosting** using the hPanel website in this browser. I am already logged in to hPanel. Work step by step and take a screenshot after each major step so I can follow along.

## Important rules
- **Do not type any password, secret key, token or database password yourself.** When a field needs one, stop, tell me exactly which field to fill and what to paste (from my `hostinger-secrets.txt` file), and wait for me to say "done".
- **Do not upload files yourself.** When a file upload is needed, tell me which button to click and which file to choose, and wait for "done".
- Do not buy anything, change my plan, delete any existing website, database, email or domain, or change DNS without asking me first.
- Hostinger's menus change sometimes. If a menu name below doesn't exist, find the closest equivalent and tell me what you chose.
- If something fails, read the error, explain it to me in simple words, and suggest the fix before doing anything else.
- At the end, give me a short summary of everything that was done and anything still pending.

## My details (fill before pasting)
- Domain: `__________________` (example: nextdel.in)
- Hostinger plan: Business / Cloud (supports Node.js web apps)

## Step 1 — Check Node.js support
1. In hPanel, open **Websites** and check whether my plan offers **Node.js Web App** (sometimes under "Add website → Node.js" or "Advanced → Node.js").
2. If Node.js apps are not available on my plan, **stop** and tell me. Don't change anything.

## Step 2 — Create the MySQL database
1. Go to **Websites → (my domain) → Databases → MySQL Databases** (or **Databases → Management**).
2. Create a new database:
   - Database name: `nextdel` (Hostinger adds a prefix like `u123456789_`)
   - Username: `nextdel` (also gets the prefix)
   - Password: **ask me to type a strong password myself** and save it in my secrets file.
3. After it's created, tell me the **full database name**, **full username** and **MySQL host** shown in hPanel (often `localhost`, sometimes an address like `srv123.hstgr.io`). Don't show the password.
4. Help me build the `DATABASE_URL` line in this format (I'll put the password in myself):
   `mysql://FULL_USERNAME:MY_PASSWORD@MYSQL_HOST:3306/FULL_DATABASE_NAME`

## Step 3 — Import the database tables
1. Next to the new database, click **Enter phpMyAdmin** (or **Manage → phpMyAdmin**).
2. In phpMyAdmin, select the new database in the left sidebar. It should be empty.
3. Open the **Import** tab. Ask me to choose the file **`database/hostinger-database.sql`** (it's inside the extracted zip. If I haven't extracted it, ask me to extract `nextdel-hostinger.zip` on my computer first).
4. Click **Import / Go** and wait.
5. Confirm success: the left sidebar should show about **26 tables** (including `Product`, `Order`, `Page`, `AdminUser`). Click the `Page` table → **Browse** and check that it has 6 rows (privacy-policy, terms-and-conditions, refund-policy, about-us, contact-us, faq).
6. Import this file only **once**. If it says tables already exist, stop and tell me.

## Step 4 — Create the Node.js web app
1. Go to **Websites → Add website → Node.js Web App** (or the Node.js section for my domain).
2. Source — use **GitHub** if available (recommended, because future updates auto-deploy):
   - Choose **Import from GitHub / Connect GitHub**, and let me approve the GitHub authorization myself.
   - Repository: **`crazyhai2022-rgb/nextdel`** (public), branch **`main`**.
   - If GitHub import isn't offered, choose **Upload files / ZIP upload** instead and ask me to upload **`nextdel-hostinger.zip`**. `package.json` is at the root of the zip.
3. Use these settings (adapt names to what Hostinger shows):
   - Framework/preset: **Next.js** (or "Other / Custom" if Next.js isn't listed)
   - Node.js version: **20.x** (or 22.x)
   - Root / app directory: the folder that contains `package.json`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Start command: `npm start`
   - Output directory (if asked): `.next`
4. Domain: connect it to my domain (or a subdomain if I tell you).

## Step 5 — Environment variables
In the Node.js app's **Environment variables** section, add these keys. **Tell me to paste each value myself** from `hostinger-secrets.txt`, one by one:

| Key | Value |
|---|---|
| `DATABASE_URL` | the line we built in Step 2, with my real password |
| `SITE_URL` | `https://MY-DOMAIN` (no trailing slash) |
| `APP_SECRET` | from secrets file |
| `ADMIN_SETUP_TOKEN` | from secrets file (temporary) |
| `CRON_SECRET` | from secrets file |
| `STORAGE_DIR` | `/home/MY_HOSTINGER_USERNAME/nextdel-storage`. Help me find my username (hPanel → Files → File Manager shows the `/home/u123456789/` path). |
| `NODE_ENV` | `production` (only if Hostinger doesn't set it automatically) |

Then **save** and **deploy / build** the app.

## Step 6 — Create the storage folder
1. Open **Files → File Manager**.
2. At my home directory (`/home/u…/`, the same level as `domains`, not inside `public_html`), create a folder named **`nextdel-storage`**.
3. Inside it, create two folders: **`public`** and **`private`**.

## Step 7 — Build and start
1. Start the build/deploy and watch the build log.
2. If the build fails, open the log, copy the last ~30 lines of the error, explain it to me, and suggest a fix. Common causes:
   - Wrong Node version → switch to 20.x
   - `DATABASE_URL` missing or malformed → check Step 5
   - "Prisma engine" errors → make sure the install command is `npm install` (it runs `prisma generate` automatically)
3. When the app shows **Running**, open `https://MY-DOMAIN` in a new tab and take a screenshot. I should see the NEXTDEL store in a dark crimson theme, with "New products are coming soon" since there are no products yet.

## Step 8 — SSL
1. Go to **Security → SSL** (or the domain's SSL section) and make sure SSL is **active** for my domain. Install the free SSL if it isn't.
2. Confirm that `https://MY-DOMAIN` loads with a padlock.

## Step 9 — Create my admin account
1. Open `https://MY-DOMAIN/admin/setup`.
2. Ask me to fill in the **Setup token** (the `ADMIN_SETUP_TOKEN` value), my **name**, **admin email** and a **strong password** myself, and submit.
3. After it redirects to the admin dashboard, go back to the Node.js app → Environment variables, **delete `ADMIN_SETUP_TOKEN`**, save, and redeploy/restart.
4. Check that `https://MY-DOMAIN/admin/setup` now shows a 404 page.

## Step 10 — Cron job (verifies missed payments every 15 minutes)
1. Go to **Advanced → Cron Jobs**.
2. Create a custom cron job running **every 15 minutes** (`*/15 * * * *`) with this command. Ask me to paste my real `CRON_SECRET` in place of `MY_CRON_SECRET`:
   ```
   curl -s "https://MY-DOMAIN/api/cron/reconcile?key=MY_CRON_SECRET" > /dev/null
   ```

## Step 11 — Email mailbox for sending order emails
1. Go to **Emails** and check whether I already have a mailbox like `support@MY-DOMAIN`. If not, help me create one (I'll set the password myself).
2. Note the SMTP settings Hostinger shows (usually host `smtp.hostinger.com`, port `465`, SSL).
3. Then open `https://MY-DOMAIN/admin/settings?tab=email` and guide me to fill them in. **I'll type the mailbox password myself.** Click **Save changes**, then **Send test** to my personal email.

## Step 12 — Final checks
Open and screenshot each of these:
- `https://MY-DOMAIN/` (home)
- `https://MY-DOMAIN/privacy-policy`
- `https://MY-DOMAIN/refund-policy`
- `https://MY-DOMAIN/contact-us`
- `https://MY-DOMAIN/admin` (dashboard after login)
- `https://MY-DOMAIN/robots.txt` and `https://MY-DOMAIN/sitemap.xml`

Then give me a summary table: step → done / pending / problem.

## After deployment (I'll do these in the admin panel, guide me only if I ask)
- Settings → General & Branding: upload the NEXTDEL logo and favicon, set the support email
- Settings → Payment Gateways: Razorpay / Cashfree keys and webhooks (webhook URLs are shown on that page)
- Settings → Meta Pixel & CAPI
- Pages (CMS): review the legal pages
- Products → Add product
