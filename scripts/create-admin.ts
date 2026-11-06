/**
 * Creates (or resets the password of) an admin user from the terminal.
 *   npm run create-admin
 * Non-interactive: ADMIN_EMAIL=.. ADMIN_NAME=.. ADMIN_PASSWORD=.. npm run create-admin
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = (process.env.ADMIN_EMAIL || (await rl.question("Admin email: "))).trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || (await rl.question("Name: "))).trim() || "Admin";
  const password = process.env.ADMIN_PASSWORD || (await rl.question("Password (min 10 chars, letters + numbers): "));
  rl.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new Error("Password must be 10+ characters with letters and numbers");
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({ where: { email }, data: { passwordHash, active: true } });
    await prisma.adminSession.deleteMany({ where: { adminId: existing.id } });
    console.log(`Password reset for ${email}.`);
  } else {
    await prisma.adminUser.create({ data: { email, name, passwordHash, role: "SUPER_ADMIN" } });
    console.log(`Super admin ${email} created. Sign in at /admin`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
