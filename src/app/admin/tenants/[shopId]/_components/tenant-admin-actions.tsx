'use client';

import { useState } from 'react';
import { extendSubscription, toggleShopSuspension } from '../_actions/tenant-actions';

interface TenantAdminActionsProps {
  shopId: number;
  isActive: boolean;
  subscriptionId?: number;
  currentPeriodEnd: string | null;
}

export function TenantAdminActions({
  shopId,
  isActive,
  subscriptionId,
  currentPeriodEnd,
}: TenantAdminActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [days, setDays] = useState('30');

  async function handleExtend() {
    if (!subscriptionId) return;
    setLoading('extend');
    setMessage(null);
    const result = await extendSubscription(subscriptionId, parseInt(days, 10));
    setLoading(null);
    setMessage(result.success ? `Extended by ${days} days.` : result.error ?? 'Failed');
  }

  async function handleToggleSuspend() {
    setLoading('suspend');
    setMessage(null);
    const result = await toggleShopSuspension(shopId, !isActive);
    setLoading(null);
    setMessage(result.success ? (isActive ? 'Shop suspended.' : 'Shop unsuspended.') : result.error ?? 'Failed');
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {message && (
        <p className="text-xs text-indigo-600 font-medium">{message}</p>
      )}
      <div className="flex items-center gap-2">
        {subscriptionId && (
          <div className="flex items-center gap-1.5">
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="7">+7 days</option>
              <option value="30">+30 days</option>
              <option value="90">+90 days</option>
              <option value="365">+1 year</option>
            </select>
            <button
              onClick={handleExtend}
              disabled={loading === 'extend'}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {loading === 'extend' ? 'Extending…' : 'Extend'}
            </button>
          </div>
        )}
        <button
          onClick={handleToggleSuspend}
          disabled={loading === 'suspend'}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
            isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          {loading === 'suspend' ? 'Working…' : isActive ? 'Suspend Shop' : 'Unsuspend Shop'}
        </button>
      </div>
      {currentPeriodEnd && (
        <p className="text-xs text-slate-400">
          Sub expires:{' '}
          {new Date(currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}
