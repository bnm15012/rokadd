"use client";

import { useActionState, useRef } from "react";
import { changeAdminPasswordAction, type PasswordState } from "../actions";

export default function AdminPasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    changeAdminPasswordAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Update your password to keep your account secure.
      </p>

      {state?.success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className={[
              "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.currentPassword
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30",
            ].join(" ")}
            placeholder="••••••••"
          />
          {state?.errors?.currentPassword && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.currentPassword[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            className={[
              "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.newPassword
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30",
            ].join(" ")}
            placeholder="••••••••"
          />
          {state?.errors?.newPassword && state.errors.newPassword.length > 0 && (
            <div className="mt-1.5">
              <ul className="list-disc list-inside space-y-0.5">
                {state.errors.newPassword.map((err) => (
                  <li key={err} className="text-xs text-red-600">{err}</li>
                ))}
              </ul>
            </div>
          )}
          {!state?.errors?.newPassword && (
            <p className="mt-1.5 text-xs text-slate-400">
              Min 8 characters, at least one letter and one number.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className={[
              "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.confirmPassword
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30",
            ].join(" ")}
            placeholder="••••••••"
          />
          {state?.errors?.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.confirmPassword[0]}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Changing..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}
