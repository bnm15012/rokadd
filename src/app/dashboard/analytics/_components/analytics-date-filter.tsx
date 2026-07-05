'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface AnalyticsDateFilterProps {
  currentRange: string;
  from?: string;
  to?: string;
}

export function AnalyticsDateFilter({ currentRange, from, to }: AnalyticsDateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [customFrom, setCustomFrom] = useState(from ?? '');
  const [customTo, setCustomTo] = useState(to ?? '');
  const [showCustom, setShowCustom] = useState(currentRange === 'custom');

  function applyPreset(range: string) {
    setShowCustom(false);
    router.push(`${pathname}?range=${range}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    router.push(`${pathname}?range=custom&from=${customFrom}&to=${customTo}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['7d', '30d'] as const).map((r) => (
        <button
          key={r}
          onClick={() => applyPreset(r)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            currentRange === r && !showCustom
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
        </button>
      ))}

      <button
        onClick={() => setShowCustom((p) => !p)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          showCustom
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
