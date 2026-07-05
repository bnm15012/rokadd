"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  FileText,
  Calendar,
  Warehouse,
  Package,
  BarChart3,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck,
  FileText,
  Calendar,
  Warehouse,
  Package,
  BarChart3,
};

const quickLinks = [
  { label: "Reconciliation", href: "/dashboard/reconciliation", icon: "ClipboardCheck", color: "bg-indigo-100 text-indigo-700" },
  { label: "Daily Report", href: "/dashboard/report", icon: "FileText", color: "bg-blue-100 text-blue-700" },
  { label: "Monthly Summary", href: "/dashboard/report/monthly", icon: "Calendar", color: "bg-emerald-100 text-emerald-700" },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Warehouse", color: "bg-amber-100 text-amber-700" },
  { label: "Products", href: "/dashboard/products", icon: "Package", color: "bg-purple-100 text-purple-700" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", color: "bg-rose-100 text-rose-700" },
];

export function QuickLinks() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Quick Access
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map((link) => {
          const Icon = ICON_MAP[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all text-center"
            >
              <div className={`rounded-lg p-2.5 ${link.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
