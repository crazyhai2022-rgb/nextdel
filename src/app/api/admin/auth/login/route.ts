import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { assertSameOrigin, clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(191), password: z.string().min(1).max(200) });
const DUMMY_HASH = "$2b$12$.2JiAsk0MbY/mQ.LFZixPumOLnD1ZyY7.b26hNTJEvlF5eQodcrrG";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = clientIp(req);
    rateLimit(`login-ip:${ip}`, 10, 15 * 60_000);
    const { email, password } = schema.parse(await req.json());
    rateLimit(`login-email:${email}`, 6, 15 * 60_000);
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    const ok = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok || !admin.active) {
      await audit(admin?.id ?? null, "login_failed", { entity: "admin", details: { email }, ip });
      return jsonError("Invalid email or password", 401);
    }
    await createSession(admin.id, ip, req.headers.get("user-agent"));
    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await audit(admin.id, "login", { entity: "admin", entityId: admin.id, ip });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
