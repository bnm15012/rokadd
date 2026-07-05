"use client";

import * as React from "react";
import type { Role } from "@/generated/prisma/enums";
import type { ShopMemberInfo } from "@/types";

export interface ShopContextValue {
  shopId: number;
  shopName: string;
  shopSlug: string;
  role: Role;
  memberId: number;
  managerId: number | null;
  permissions: ShopMemberInfo["permissions"];
  /** True if the user is an OWNER or SuperAdmin acting as owner */
  isOwner: boolean;
}

const ShopContext = React.createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const ctx = React.useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop must be used inside <ShopProvider>");
  }
  return ctx;
}

export interface ShopProviderProps {
  value: ShopContextValue;
  children: React.ReactNode;
}

export function ShopProvider({ value, children }: ShopProviderProps) {
  return React.createElement(ShopContext.Provider, { value }, children);
}
