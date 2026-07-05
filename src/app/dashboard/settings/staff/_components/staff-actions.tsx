'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { Settings, UserX, UserCheck, MoreHorizontal } from 'lucide-react';
import { deactivateMember, reactivateMember } from '@/actions/staff';

interface StaffActionsProps {
  memberId: number;
  memberName: string;
  isActive: boolean;
  isSelf: boolean;
  canEdit: boolean;
  isOwnerEditor: boolean;
}

export function StaffActions({
  memberId,
  memberName,
  isActive,
  isSelf,
  canEdit,
  isOwnerEditor,
}: StaffActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  async function handleToggleActive() {
    setLoading(true);
    setError(null);
    const result = isActive
      ? await deactivateMember(memberId)
      : await reactivateMember(memberId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Action failed');
    }
    setOpen(false);
  }

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Position dropdown below the button, aligned to right edge
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192px = w-48
      });
    }
    setOpen((p) => !p);
  }

  if (!canEdit) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        aria-label="Member actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1"
            style={menuPos ? { top: menuPos.top, left: menuPos.left } : undefined}
          >
            {error && (
              <p className="px-3 py-1.5 text-xs text-red-600">{error}</p>
            )}
            <Link
              href={`/dashboard/settings/staff/${memberId}/permissions`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Edit Permissions
            </Link>
            {!isSelf && (
              <button
                onClick={handleToggleActive}
                disabled={loading}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-slate-50 disabled:opacity-50 ${
                  isActive ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {isActive ? (
                  <UserX className="h-4 w-4" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {loading ? 'Working…' : isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
