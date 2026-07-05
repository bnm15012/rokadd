import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/app/dashboard/components/PaymentStatusBadge";
import { VendorPaymentForm } from "./VendorPaymentForm";
import { NewPurchaseLink } from "./NewPurchaseLink";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params is a Promise in Next.js 15+
  const { id } = await params;
  const vendorId = parseInt(id, 10);

  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return <p className="text-red-500">No shop found.</p>;

  const db = tenantPrisma(shopId);

  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          payments: { orderBy: { paidAt: "desc" } },
        },
      },
    },
  });

  if (!vendor) notFound();

  const totalPurchases = vendor.purchases.reduce(
    (s, p) => s + p.totalAmount,
    0
  );
  const totalPaid = vendor.purchases.reduce((s, p) => s + p.paidAmount, 0);
  const totalOutstanding = totalPurchases - totalPaid;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link
          href="/dashboard/vendors"
          className="hover:text-indigo-600 hover:underline"
        >
          Vendors
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{vendor.name}</span>
      </nav>

      {/* Vendor info card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              {vendor.phone && (
                <span>
                  <span className="font-medium text-gray-700">Phone:</span>{" "}
                  {vendor.phone}
                </span>
              )}
              {vendor.email && (
                <span>
                  <span className="font-medium text-gray-700">Email:</span>{" "}
                  {vendor.email}
                </span>
              )}
              {vendor.gstin && (
                <span>
                  <span className="font-medium text-gray-700">GSTIN:</span>{" "}
                  <span className="font-mono">{vendor.gstin}</span>
                </span>
              )}
              {vendor.address && (
                <span>
                  <span className="font-medium text-gray-700">Address:</span>{" "}
                  {vendor.address}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <NewPurchaseLink vendorId={vendorId} />
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Purchased
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatCurrency(totalPurchases)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Paid
            </p>
            <p className="mt-1 text-lg font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Outstanding
            </p>
            <p
              className={`mt-1 text-lg font-bold ${
                totalOutstanding > 0 ? "text-red-600" : "text-gray-400"
              }`}
            >
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>
      </div>

      {/* Purchase history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Purchase History
        </h2>

        {vendor.purchases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No purchases recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {vendor.purchases.map((purchase) => {
              const balance = purchase.totalAmount - purchase.paidAmount;
              return (
                <div
                  key={purchase.id}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* Purchase header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {purchase.billNumber
                              ? `Bill #${purchase.billNumber}`
                              : "No bill number"}
                          </span>
                          <PaymentStatusBadge
                            status={purchase.paymentStatus}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(purchase.purchaseDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(purchase.totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(purchase.paidAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Balance</p>
                        <p
                          className={`font-semibold ${
                            balance > 0 ? "text-red-600" : "text-gray-400"
                          }`}
                        >
                          {formatCurrency(balance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide">
                          <th className="text-left pb-1">Product</th>
                          <th className="text-right pb-1">Cartons</th>
                          <th className="text-right pb-1">Pieces</th>
                          <th className="text-right pb-1">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {purchase.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1 text-gray-800">
                              {item.product.name}
                            </td>
                            <td className="py-1 text-right text-gray-600">
                              {item.cartonsQty}
                            </td>
                            <td className="py-1 text-right text-gray-600">
                              {item.piecesQty}
                            </td>
                            <td className="py-1 text-right font-medium text-gray-900">
                              {formatCurrency(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment history + record payment */}
                  {purchase.payments.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-green-50/50">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Payments Made
                      </p>
                      <div className="space-y-1">
                        {purchase.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {new Date(payment.paidAt).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" }
                              )}{" "}
                              ·{" "}
                              <span className="font-medium text-gray-700">
                                {payment.paymentMode}
                              </span>
                              {payment.note && (
                                <span className="text-gray-400">
                                  {" "}
                                  · {payment.note}
                                </span>
                              )}
                            </span>
                            <span className="font-semibold text-green-700">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Record payment form */}
                  {balance > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <VendorPaymentForm
                        purchaseId={purchase.id}
                        balancePaise={balance}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
