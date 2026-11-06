import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { AdminRole, AdminUser } from "@prisma/client";
import { prisma } from "./db";
import { randomToken, sha256 } from "./crypto";
import { HttpError, assertSameOrigin } from "./http";
import { isProd } from "./env";

export const ADMIN_COOKIE = "nd_admin";
const SESSION_DAYS = 7;

export type SessionAdmin = Pick<AdminUser, "id" | "email" | "name" | "role">;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain letters and numbers.";
  return null;
}

export async function createSession(adminId: string, ip: string | null, ua: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await prisma.adminSession.create({
    data: { tokenHash: sha256(token), adminId, ip, userAgent: ua?.slice(0, 255) ?? null, expiresAt },
  });
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(ADMIN_COOKIE);
}

export async function getAdmin(): Promise<SessionAdmin | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { admin: { select: { id: true, email: true, name: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.admin.active) return null;
  const { active: _a, ...admin } = session.admin;
  return admin;
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["dashboard", "orders", "customers", "abandoned", "products", "pages", "emails", "inquiries", "settings", "audit"],
  SUPPORT: ["dashboard", "orders", "customers", "abandoned", "emails", "inquiries"],
};

export function can(role: AdminRole, perm: string) {
  const p = ROLE_PERMISSIONS[role];
  return p.includes("*") || p.includes(perm);
}

/** For API route handlers: verifies session, permission and (for mutations) same-origin. */
export async function requireAdmin(req: Request, perm: string): Promise<SessionAdmin> {
  if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
  const admin = await getAdmin();
  if (!admin) throw new HttpError(401, "Not signed in");
  if (!can(admin.role, perm)) throw new HttpError(403, "You don't have permission for this action");
  return admin;
}
