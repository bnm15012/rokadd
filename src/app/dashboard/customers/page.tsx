import Link from "next/link";
import { getSessionUser } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AddCustomerForm } from "./AddCustomerForm";
import { Users } from "lucide-react";

export default async function CustomersPage() {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return <p className="text-red-500">No shop found.</p>;

  const db = tenantPrisma(shopId);

  const customers = await db.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      creditSales: {
        select: { totalAmount: true, paidAmount: true },
      },
    },
  });

  return (
    <div>
      {/* Header — sticky */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Customer khata — credit ledger management
            </p>
          </div>
        </div>
        <AddCustomerForm />
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">
            No customers yet.{" "}
            <span className="font-medium text-indigo-600">
              Add your first customer
            </span>{" "}
            to start tracking credit.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Outstanding
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => {
                const totalCredit = customer.creditSales.reduce(
                  (s, c) => s + c.totalAmount,
                  0
                );
                const totalPaid = customer.creditSales.reduce(
                  (s, c) => s + c.paidAmount,
                  0
                );
                const outstanding = totalCredit - totalPaid;

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.phone || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                      {totalCredit > 0
                        ? formatCurrency(totalCredit)
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                      {totalPaid > 0
                        ? formatCurrency(totalPaid)
                        : <span className="text-gray-300">—</span>}
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
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        View khata →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end gap-8 text-sm">
            <span className="text-gray-500">
              {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold text-red-600">
              Total outstanding:{" "}
              {formatCurrency(
                customers.reduce(
                  (s, c) =>
                    s +
                    c.creditSales.reduce(
                      (cs, cr) => cs + cr.totalAmount - cr.paidAmount,
                      0
                    ),
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
