'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export interface ExpenseSlice {
  category: string;
  amount: number;
}

interface ExpensePieChartProps {
  data: ExpenseSlice[];
}

const COLORS = [
  '#6366f1',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
  '#ec4899',
  '#84cc16',
  '#14b8a6',
  '#f97316',
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-sm">
        <p className="font-medium text-slate-700">{payload[0].name}</p>
        <p className="text-slate-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        No expense data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="45%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={10}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
