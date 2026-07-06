import Link from "next/link";
import { getSessionUser } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AddVendorForm } from "./AddVendorForm";
import { Truck } from "lucide-react";

export default async function VendorsPage() {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return <p className="text-red-500">No shop found.</p>;

  const db = tenantPrisma(shopId);

  const vendors = await db.vendor.findMany({
    orderBy: { name: "asc" },
    include: {
      purchases: {
        select: { totalAmount: true, paidAmount: true },
      },
    },
  });

  return (
    <div>
      {/* Header — sticky */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage suppliers and track purchase ledgers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vendors/purchases"
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
          <AddVendorForm />
        </div>
      </div>

      {/* Table */}
      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">
            No vendors yet.{" "}
            <span className="font-medium text-indigo-600">
              Add your first vendor
            </span>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  GSTIN
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Outstanding
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => {
                const outstanding = vendor.purchases.reduce(
                  (sum, p) => sum + p.totalAmount - p.paidAmount,
                  0
                );
                return (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/vendors/${vendor.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {vendor.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vendor.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vendor.email || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {vendor.gstin || (
                        <span className="text-gray-300 font-sans">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {outstanding > 0 ? (
                        <span className="font-semibold text-red-600">
                          {formatCurrency(outstanding)}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium text-sm">
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/vendors/${vendor.id}`}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        View ledger →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
