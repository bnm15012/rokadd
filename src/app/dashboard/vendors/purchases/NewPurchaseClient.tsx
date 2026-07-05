"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/actions/vendors";
import { formatCurrency } from "@/lib/utils";
import type { ActionState } from "@/types";

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  piecesPerCarton: number;
  costPricePerCarton: number;
}

interface PurchaseItem {
  productId: string;
  cartonsQty: number;
  piecesQty: number;
}

interface Props {
  vendors: Vendor[];
  products: Product[];
  preselectedVendorId: string | null;
}

const initialState: ActionState = { success: false };

export function NewPurchaseClient({
  vendors,
  products,
  preselectedVendorId,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPurchase,
    initialState
  );

  const [items, setItems] = useState<PurchaseItem[]>([
    { productId: "", cartonsQty: 0, piecesQty: 0 },
  ]);

  // Redirect after success
  if (state.success && state.data) {
    const vendorId = vendors.find((v) => v.id)?.id;
    if (vendorId) router.push(`/dashboard/vendors/${vendorId}`);
    else router.push("/dashboard/vendors");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: "", cartonsQty: 0, piecesQty: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  // Calculate running totals
  const runningTotal = items.reduce((total, item) => {
    const product = productMap.get(item.productId);
    if (!product) return total;
    const piecesQtyNum = Number(item.piecesQty) || 0;
    const cartonsQtyNum = Number(item.cartonsQty) || 0;
    const lineTotal =
      cartonsQtyNum * product.costPricePerCarton +
      Math.round(
        (piecesQtyNum * product.costPricePerCarton) / product.piecesPerCarton
      );
    return total + lineTotal;
  }, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Inject items as JSON
    formData.set("items", JSON.stringify(items));
    formAction(formData);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Record a new stock purchase from a vendor
        </p>
      </div>

      {state.error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor + Bill */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Purchase Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                name="vendorId"
                required
                defaultValue={preselectedVendorId ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="" disabled>
                  Select vendor…
                </option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number
              </label>
              <input
                name="billNumber"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="e.g. BILL-2024-001"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              name="note"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Optional note about this purchase"
            />
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const product = productMap.get(item.productId);
              const piecesQtyNum = Number(item.piecesQty) || 0;
              const cartonsQtyNum = Number(item.cartonsQty) || 0;
              const lineTotal = product
                ? cartonsQtyNum * product.costPricePerCarton +
                  Math.round(
                    (piecesQtyNum * product.costPricePerCarton) /
                      product.piecesPerCarton
                  )
                : 0;

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start"
                >
                  {/* Product */}
                  <div className="col-span-5">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Product
                      </label>
                    )}
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="" disabled>
                        Select product…
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.sku ? ` (${p.sku})` : ""}
                        </option>
                      ))}
                    </select>
                    {product && (
                      <p className="text-xs text-gray-400 mt-0.5 pl-0.5">
                        {product.piecesPerCarton} pcs/ctn ·{" "}
                        {formatCurrency(product.costPricePerCarton)}/ctn
                      </p>
                    )}
                  </div>

                  {/* Cartons */}
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Cartons
                      </label>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={item.cartonsQty}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "cartonsQty",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-right focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Pieces */}
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Pieces
                      </label>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={item.piecesQty}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "piecesQty",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-right focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Line total */}
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Total
                      </label>
                    )}
                    <div className="py-2 text-sm font-medium text-right text-gray-900">
                      {product && lineTotal > 0
                        ? formatCurrency(lineTotal)
                        : "—"}
                    </div>
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex items-start">
                    {index === 0 && (
                      <div className="block text-xs mb-1">&nbsp;</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="mt-1.5 text-gray-300 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Running total + submit */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Purchase Amount</p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5">
                {formatCurrency(runningTotal)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || runningTotal === 0}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending ? "Saving…" : "Record Purchase"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
