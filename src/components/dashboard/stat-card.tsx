import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  /** Percentage change e.g. 12.5 means +12.5%, -5 means -5% */
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums truncate">
              {value}
            </p>
            {(description || trend !== undefined) && (
              <div className="mt-2 flex items-center gap-2">
                {trend !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-semibold",
                      isPositiveTrend && "text-green-600",
                      isNegativeTrend && "text-red-600"
                    )}
                  >
                    {isPositiveTrend ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositiveTrend ? "+" : ""}
                    {trend.toFixed(1)}%
                  </span>
                )}
                {description && (
                  <span className="text-xs text-slate-400">{description}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
