import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export async function audit(
  adminId: string | null,
  action: string,
  opts: { entity?: string; entityId?: string; details?: Prisma.InputJsonValue; ip?: string | null } = {},
) {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, entity: opts.entity, entityId: opts.entityId, details: opts.details, ip: opts.ip ?? null },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
