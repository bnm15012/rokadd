"use client";

import Link from "next/link";

interface Props {
  vendorId: string;
}

export function NewPurchaseLink({ vendorId }: Props) {
  return (
    <Link
      href={`/dashboard/vendors/purchases?vendorId=${vendorId}`}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v16m8-8H4"
        />
      </svg>
      New Purchase
    </Link>
  );
}
