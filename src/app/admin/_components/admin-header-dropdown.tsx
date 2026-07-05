'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserCircle, LogOut, Shield } from 'lucide-react';
import { SignOutModal } from '@/components/sign-out-modal';

interface AdminHeaderDropdownProps {
  adminName: string;
  adminEmail: string;
}

export function AdminHeaderDropdown({ adminName, adminEmail }: AdminHeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = adminName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition"
      >
        <span className="text-xs text-slate-500 hidden sm:block">{adminEmail}</span>
        <span className="inline-flex items-center rounded-full bg-indigo-900/60 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-700/50">
          Super Admin
        </span>
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-slate-200 bg-white shadow-xl py-1 animate-in fade-in slide-in-from-top-1">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{adminName}</p>
            <p className="text-xs text-slate-500 truncate">{adminEmail}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              <Shield className="h-3 w-3" />
              Super Admin
            </span>
          </div>

          <div className="py-1">
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <UserCircle className="h-4 w-4 text-slate-400" />
              My Profile
            </Link>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setSignOutOpen(true); }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-4 w-4 text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </div>
  );
}
