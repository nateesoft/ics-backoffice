'use client';
// Shared between customRenderers.tsx (Button), customControlRenderers.tsx (Enum/dropdown) and
// LiveFormPreview.tsx (the actual runner) — kept in its own file to avoid a circular import
// between the two renderer modules and the preview that provides the context.
import { createContext, useContext } from 'react';
import type { UiActionStep } from '@/types/flowUi';

export interface ActionRunner {
  runSteps: (steps: UiActionStep[]) => void;
  // UIs Gen's Preview is a navigable end-user-facing view (unlike flow-generate's design-time
  // preview), so the "N step(s)" / api-ref debug caption under action buttons should stay hidden there.
  hideStepBadge?: boolean;
  // Restores the form's data back to whatever it was designed with (a Button of type 'reset').
  resetForm?: () => void;
}

export const ActionRunnerContext = createContext<ActionRunner | null>(null);

export function useActionRunner(): ActionRunner | null {
  return useContext(ActionRunnerContext);
}
