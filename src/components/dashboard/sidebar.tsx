"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Receipt,
  ClipboardCheck,
  FileText,
  Users,
  BarChart3,
  Settings,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/types/nav";
import type { Role } from "@/generated/prisma/enums";

// Map icon name strings (from ALL_NAV_ITEMS) to lucide-react components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Receipt,
  ClipboardCheck,
  FileText,
  Users,
  BarChart3,
  Settings,
};

export interface SidebarProps {
  navItems: NavItem[];
  role: Role;
  userName: string;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  navItems,
  shopName,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / App name */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700/60 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                Rokadd
              </p>
              <p className="text-xs text-slate-400 truncate leading-tight">
                {shopName}
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5" role="list">
            {navItems.map((item) => {
              const IconComponent = ICON_MAP[item.icon];
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white"
                        )}
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </aside>
    </>
  );
}
