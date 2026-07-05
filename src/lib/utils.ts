import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountInPaise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

export function formatStock(totalPieces: number, piecesPerCarton: number): string {
  if (piecesPerCarton <= 1) return `${totalPieces} Pieces`;
  const cartons = Math.floor(totalPieces / piecesPerCarton);
  const remaining = totalPieces % piecesPerCarton;
  const parts: string[] = [];
  if (cartons > 0) parts.push(`${cartons} Carton${cartons !== 1 ? "s" : ""}`);
  if (remaining > 0) parts.push(`${remaining} Piece${remaining !== 1 ? "s" : ""}`);
  return parts.join(", ") || "0 Pieces";
}

export function toTotalPieces(cartons: number, pieces: number, piecesPerCarton: number): number {
  return cartons * piecesPerCarton + pieces;
}

export function calculateLineTotal(
  cartonsQty: number,
  piecesQty: number,
  pricePerCarton: number,
  pricePerPiece: number
): number {
  return cartonsQty * pricePerCarton + piecesQty * pricePerPiece;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateInvoiceNo(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${r}`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
