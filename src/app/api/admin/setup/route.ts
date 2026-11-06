import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, validatePasswordStrength } from "@/lib/auth";
import { assertSameOrigin, clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { safeEqual } from "@/lib/crypto";
import { audit } from "@/lib/audit";

const schema = z.object({ token: z.string().min(1), name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), password: z.string().max(200) });

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`setup:${clientIp(req)}`, 5, 15 * 60_000);
    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (!expected || (await prisma.adminUser.count()) > 0) return jsonError("Setup is disabled", 404);
    const b = schema.parse(await req.json());
    if (!safeEqual(b.token, expected)) return jsonError("Invalid setup token", 403);
    const weak = validatePasswordStrength(b.password);
    if (weak) return jsonError(weak, 422);
    const admin = await prisma.adminUser.create({ data: { name: b.name, email: b.email, passwordHash: await hashPassword(b.password), role: "SUPER_ADMIN" } });
    await createSession(admin.id, clientIp(req), req.headers.get("user-agent"));
    await audit(admin.id, "first_admin_created", { entity: "admin", entityId: admin.id });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
