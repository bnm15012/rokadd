"use client";

import { useActionState } from "react";
import { updateAdminProfileAction, type ProfileState } from "../actions";

interface AdminProfileFormProps {
  name: string;
  email: string;
}

export default function AdminProfileForm({ name, email }: AdminProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateAdminProfileAction,
    undefined
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
      <p className="mt-1 text-sm text-slate-500">Update your name and email address.</p>

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

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={name}
            className={[
              "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.name
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30",
            ].join(" ")}
          />
          {state?.errors?.name && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email}
            className={[
              "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.email
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30",
            ].join(" ")}
          />
          {state?.errors?.email && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
