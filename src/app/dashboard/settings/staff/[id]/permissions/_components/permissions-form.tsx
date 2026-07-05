'use client';

import { useActionState } from 'react';
import { updateMemberPermissions } from '@/actions/staff';
import type { ActionState, PermissionKey, MemberPermission } from '@/types';

interface PermissionDef {
  key: PermissionKey;
  label: string;
  group?: string;
}

interface PermissionsFormProps {
  memberId: string;
  screenPermissions: PermissionDef[];
  dataPermissions: PermissionDef[];
  allowedKeys: PermissionKey[];
  currentPerms: MemberPermission | null;
}

// Group screen permissions by their "group" field
function groupBy<T extends { group?: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const g = item.group ?? 'Other';
    const arr = map.get(g) ?? [];
    arr.push(item);
    map.set(g, arr);
  }
  return map;
}

export function PermissionsForm({
  memberId,
  screenPermissions,
  dataPermissions,
  allowedKeys,
  currentPerms,
}: PermissionsFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateMemberPermissions,
    { success: false }
  );

  const grouped = groupBy(screenPermissions);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="memberId" value={memberId} />

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && state.data?.message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.data.message}
        </div>
      )}

      {/* Screen Access */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Screen Access</h2>
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([group, perms]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {group}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {perms.map(({ key, label }) => {
                  const isAllowed = allowedKeys.includes(key);
                  const defaultChecked = !!currentPerms?.[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 ${isAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                    >
                      <input
                        type="checkbox"
                        name={key}
                        defaultChecked={defaultChecked}
                        disabled={!isAllowed}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-slate-600">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Visibility */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Data Visibility</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dataPermissions.map(({ key, label }) => {
            const isAllowed = allowedKeys.includes(key);
            const defaultChecked = !!currentPerms?.[key];
            return (
              <label
                key={key}
                className={`flex items-center gap-2 ${isAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
              >
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={defaultChecked}
                  disabled={!isAllowed}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-sm text-slate-600">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/dashboard/settings/staff"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          {pending ? 'Saving…' : 'Save Permissions'}
        </button>
      </div>
    </form>
  );
}
