'use client';

import { Printer, Download } from 'lucide-react';

interface Product {
  name: string;
  categoryName: string;
}

interface Props {
  products: Product[];
  days: number[];
  /** productIndex -> { day -> stockPieces } */
  grid: Record<number, Record<number, number>>;
  monthLabel: string;
}

export function StockSheetActions({ products, days, grid, monthLabel }: Props) {
  function handlePrint() {
    window.print();
  }

  function handleDownloadCSV() {
    const headers = ['Product', 'Category', ...days.map((d) => String(d))];
    const rows = products.map((p, idx) => {
      const dayValues = days.map((d) => {
        const val = grid[idx]?.[d];
        return val !== undefined ? String(val) : '';
      });
      return [csvEscape(p.name), csvEscape(p.categoryName), ...dayValues];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-sheet-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadCSV}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
