import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/enums";

interface Props {
  status: PaymentStatus;
  size?: "sm" | "md";
}

const config: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PAID: {
    label: "Paid",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  UNPAID: {
    label: "Unpaid",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function PaymentStatusBadge({ status, size = "sm" }: Props) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {label}
    </span>
  );
}
