import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/app/dashboard/components/PaymentStatusBadge";
import { CreditPaymentForm } from "./CreditPaymentForm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params is a Promise in Next.js 15+
  const { id } = await params;
  const customerId = parseInt(id, 10);

  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return <p className="text-red-500">No shop found.</p>;

  const db = tenantPrisma(shopId);

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      creditSales: {
        orderBy: { createdAt: "desc" },
        include: {
          payments: { orderBy: { paidAt: "desc" } },
        },
      },
    },
  });

  if (!customer) notFound();

  const totalCredit = customer.creditSales.reduce(
    (s, c) => s + c.totalAmount,
    0
  );
  const totalPaid = customer.creditSales.reduce((s, c) => s + c.paidAmount, 0);
  const totalOutstanding = totalCredit - totalPaid;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link
          href="/dashboard/customers"
          className="hover:text-indigo-600 hover:underline"
        >
          Customers
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{customer.name}</span>
      </nav>

      {/* Customer info + outstanding card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              {customer.phone && (
                <span>
                  <span className="font-medium text-gray-700">Phone:</span>{" "}
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span>
                  <span className="font-medium text-gray-700">Email:</span>{" "}
                  {customer.email}
                </span>
              )}
              {customer.address && (
                <span>
                  <span className="font-medium text-gray-700">Address:</span>{" "}
                  {customer.address}
                </span>
              )}
            </div>
          </div>

          {/* Outstanding prominently displayed */}
          {totalOutstanding > 0 && (
            <div className="shrink-0 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-center">
              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">
                Outstanding Balance
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Credit
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatCurrency(totalCredit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total Collected
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

      {/* Credit sales (khata ledger) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Credit Ledger (Khata)
        </h2>

        {customer.creditSales.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No credit sales recorded for this customer.
          </div>
        ) : (
          <div className="space-y-4">
            {customer.creditSales.map((sale) => {
              const balance = sale.totalAmount - sale.paidAmount;
              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* Sale header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {sale.saleId
                            ? `Sale Ref: ${String(sale.saleId).slice(-8)}`
                            : "Direct Credit"}
                        </span>
                        <PaymentStatusBadge status={sale.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {sale.dueDate && (
                          <span className="ml-2 text-orange-500">
                            Due:{" "}
                            {new Date(sale.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </p>
                      {sale.note && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sale.note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Collected</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(sale.paidAmount)}
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

                  {/* Payment history */}
                  {sale.payments.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-green-50/50">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Collections
                      </p>
                      <div className="space-y-1">
                        {sale.payments.map((payment) => (
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

                  {/* Collect payment form */}
                  {balance > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <CreditPaymentForm
                        creditSaleId={sale.id}
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
