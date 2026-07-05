import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getVisibleNavItems } from "@/lib/permissions";
import { DashboardShell } from "./dashboard-shell";
import type { SessionUser, ShopMemberInfo } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const raw = session.user as any;
  // JWT may serialize numbers as strings; ensure all IDs are numbers
  const user: SessionUser = {
    ...raw,
    id: Number(raw.id),
    shopMembers: (raw.shopMembers || []).map((m: any) => ({
      ...m,
      id: Number(m.id),
      shopId: Number(m.shopId),
      managerId: m.managerId != null ? Number(m.managerId) : null,
    })),
  };

  // SuperAdmins with no shop memberships go to super-admin area
  if (user.isSuperAdmin && user.shopMembers.length === 0) {
    redirect("/admin");
  }

  // Regular users with no shop memberships need to set up a shop first
  if (!user.isSuperAdmin && user.shopMembers.length === 0) {
    redirect("/setup");
  }

  // Use the first active shop membership (single-shop context for now)
  const member: ShopMemberInfo = user.shopMembers[0];

  const navItems = getVisibleNavItems(
    member.role,
    member.permissions as Record<string, boolean> | null
  );

  return (
    <DashboardShell
      navItems={navItems}
      role={member.role}
      userName={user.name}
      shopId={member.shopId}
      shopName={member.shopName}
      shopSlug={member.shopSlug}
      memberId={member.id}
      managerId={member.managerId}
      permissions={member.permissions}
    >
      {children}
    </DashboardShell>
  );
}
