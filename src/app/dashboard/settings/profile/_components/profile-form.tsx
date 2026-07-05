"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "../actions";

export default function ProfileForm({
  defaultName,
  defaultEmail,
  joinedAt,
}: {
  defaultName: string;
  defaultEmail: string;
  joinedAt: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    undefined
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
      <p className="mt-1 text-sm text-slate-500">
        Member since {new Date(joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
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

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            defaultValue={defaultName}
            required
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
          <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="profile-email"
            name="email"
            type="email"
            defaultValue={defaultEmail}
            required
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
