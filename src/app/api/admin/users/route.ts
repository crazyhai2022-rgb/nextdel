import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, getAdmin, hashPassword, requireAdmin, validatePasswordStrength, verifyPassword } from "@/lib/auth";
import { assertSameOrigin, clientIp, handleError, json, jsonError } from "@/lib/http";
import { sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "users");
    const b = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), password: z.string().max(200), role: z.enum(["SUPER_ADMIN", "ADMIN", "SUPPORT"]) }).parse(await req.json());
    const weak = validatePasswordStrength(b.password);
    if (weak) return jsonError(weak, 422);
    if (await prisma.adminUser.findUnique({ where: { email: b.email } })) return jsonError("An admin with this email already exists", 409);
    const u = await prisma.adminUser.create({ data: { name: b.name, email: b.email, role: b.role, passwordHash: await hashPassword(b.password) } });
    await audit(admin.id, "admin_created", { entity: "admin", entityId: u.id, details: { email: b.email, role: b.role }, ip: clientIp(req) });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(req, "users");
    const b = z.object({ id: z.string(), active: z.boolean() }).parse(await req.json());
    if (b.id === admin.id) return jsonError("You can't disable yourself", 400);
    await prisma.adminUser.update({ where: { id: b.id }, data: { active: b.active } });
    if (!b.active) await prisma.adminSession.deleteMany({ where: { adminId: b.id } });
    await audit(admin.id, b.active ? "admin_enabled" : "admin_disabled", { entity: "admin", entityId: b.id, ip: clientIp(req) });
    return json({ ok: true, message: b.active ? "Enabled" : "Disabled" });
  } catch (e) {
    return handleError(e);
  }
}

/** Change own password (any role). */
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const me = await getAdmin();
    if (!me) return jsonError("Not signed in", 401);
    const b = z.object({ current: z.string().max(200), next: z.string().max(200) }).parse(await req.json());
    const user = await prisma.adminUser.findUnique({ where: { id: me.id } });
    if (!user || !(await verifyPassword(b.current, user.passwordHash))) return jsonError("Current password is incorrect", 400);
    const weak = validatePasswordStrength(b.next);
    if (weak) return jsonError(weak, 422);
    await prisma.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(b.next) } });
    const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
    await prisma.adminSession.deleteMany({ where: { adminId: me.id, tokenHash: { not: sha256(token) } } });
    await audit(me.id, "password_changed", { entity: "admin", entityId: me.id, ip: clientIp(req) });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
