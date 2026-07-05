import { auth } from "./auth";
import { prisma } from "./prisma";
import type { PermissionKey, SessionUser } from "@/types";
export { ALL_NAV_ITEMS, getVisibleNavItems } from "@/types/nav";
export type { NavItem } from "@/types/nav";

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const raw = session.user as any;
  // JWT may serialize numbers as strings; ensure all IDs are numbers
  return {
    ...raw,
    id: Number(raw.id),
    shopMembers: (raw.shopMembers || []).map((m: any) => ({
      ...m,
      id: Number(m.id),
      shopId: Number(m.shopId),
      managerId: m.managerId != null ? Number(m.managerId) : null,
    })),
  } as SessionUser;
}

export async function getPermissions(shopId: number) {
  const user = await getSessionUser();
  if (user.isSuperAdmin) {
    return {
      userId: user.id,
      shopId,
      role: "OWNER" as const,
      memberId: 0,
      managerId: null,
      isOwner: true,
      isSuperAdmin: true,
      permissions: null,
    };
  }

  const member = await prisma.shopMember.findUnique({
    where: { userId_shopId: { userId: user.id, shopId } },
    include: { permissions: true },
  });

  if (!member || !member.isActive) throw new Error("Not a member of this shop");

  return {
    userId: user.id,
    shopId,
    role: member.role,
    memberId: member.id,
    managerId: member.managerId,
    isOwner: member.role === "OWNER",
    isSuperAdmin: false,
    permissions: member.permissions,
  };
}

export async function requirePermission(shopId: number, permission: PermissionKey) {
  const ctx = await getPermissions(shopId);
  if (ctx.isOwner || ctx.isSuperAdmin) return ctx;
  if (!ctx.permissions || !ctx.permissions[permission]) {
    throw new Error(`Permission denied: ${permission}`);
  }
  return ctx;
}
