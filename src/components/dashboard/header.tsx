"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Store, UserCircle, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_NAV_ITEMS } from "@/types/nav";
import { SignOutModal } from "@/components/sign-out-modal";

export interface HeaderProps {
  userName: string;
  shopName: string;
  onMenuToggle: () => void;
}

/** Derive a human-readable page title from the current pathname */
function usePageTitle(): string {
  const pathname = usePathname();

  // Look for a matching nav item label first
  const match = ALL_NAV_ITEMS.find((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  });
  if (match) return match.label;

  // Fallback: capitalise last segment
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

export function Header({ userName, shopName, onMenuToggle }: HeaderProps) {
  const pageTitle = usePageTitle();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [signOutOpen, setSignOutOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8 text-slate-500 hover:text-slate-900"
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-semibold text-slate-900 truncate">
        {pageTitle}
      </h1>

      {/* Right side: shop name + user */}
      <div className="flex items-center gap-3">
        {/* Shop name pill — visible on sm+ */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
          <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
            {shopName}
          </span>
        </div>

        {/* User avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase select-none cursor-pointer transition hover:ring-2 hover:ring-blue-300"
            title={userName}
            aria-label="User menu"
          >
            {userName.charAt(0)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{shopName}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/dashboard/settings/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  My Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); setSignOutOpen(true); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </header>
  );
}
