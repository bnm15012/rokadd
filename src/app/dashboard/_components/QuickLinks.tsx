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
  { label: "Reconciliation", href: "/dashboard/reconciliation", icon: "ClipboardCheck", iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600", hoverBorder: "hover:border-indigo-300" },
  { label: "Daily Report", href: "/dashboard/report", icon: "FileText", iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500", hoverBorder: "hover:border-blue-300" },
  { label: "Monthly Summary", href: "/dashboard/report/monthly", icon: "Calendar", iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500", hoverBorder: "hover:border-emerald-300" },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Warehouse", iconBg: "bg-gradient-to-br from-amber-500 to-orange-500", hoverBorder: "hover:border-amber-300" },
  { label: "Products", href: "/dashboard/products", icon: "Package", iconBg: "bg-gradient-to-br from-purple-500 to-pink-500", hoverBorder: "hover:border-purple-300" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", iconBg: "bg-gradient-to-br from-rose-500 to-red-500", hoverBorder: "hover:border-rose-300" },
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
              className={`flex flex-col items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-lg ${link.hoverBorder} transition-all duration-200 text-center group`}
            >
              <div className={`rounded-xl p-2.5 ${link.iconBg} shadow-md group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
