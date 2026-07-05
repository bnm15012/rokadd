"use client";

import * as React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ShopProvider, type ShopContextValue } from "@/hooks/use-shop";
import type { NavItem } from "@/types/nav";
import type { Role } from "@/generated/prisma/enums";
import type { ShopMemberInfo } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: Role;
  userName: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  memberId: string;
  managerId: string | null;
  permissions: ShopMemberInfo["permissions"];
}

export function DashboardShell({
  children,
  navItems,
  role,
  userName,
  shopId,
  shopName,
  shopSlug,
  memberId,
  managerId,
  permissions,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const shopCtx: ShopContextValue = {
    shopId,
    shopName,
    shopSlug,
    role,
    memberId,
    managerId,
    permissions,
    isOwner: role === "OWNER",
  };

  return (
    <ShopProvider value={shopCtx}>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar
          navItems={navItems}
          role={role}
          userName={userName}
          shopName={shopName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header
            userName={userName}
            shopName={shopName}
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/80">
            {children}
          </main>
        </div>
      </div>
    </ShopProvider>
  );
}
