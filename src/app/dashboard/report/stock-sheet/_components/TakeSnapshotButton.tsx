'use client';

import { useActionState } from 'react';
import { Camera, Loader2, CheckCircle } from 'lucide-react';
import { takeStockSnapshot } from '@/actions/snapshots';
import type { ActionState } from '@/types';

const initialState: ActionState = { success: false };

export function TakeSnapshotButton() {
  const [state, formAction, pending] = useActionState(takeStockSnapshot, initialState);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {pending ? 'Saving...' : 'Take Snapshot'}
      </button>
      {state.success && state.data && (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          {state.data.count} products saved
        </span>
      )}
      {state.error && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}
