import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logAdminAccess(
  adminId: number,
  shopId: number,
  action: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      shopId,
      action,
      metadata: metadata ?? undefined,
    },
  });
}
