// Backend-local mirror of frontend/types/uisGen.ts's UisGenActionStep — only the fields
// ManifestService actually reads. Kept separate rather than shared across the frontend/backend
// boundary (they're independent deployables); the sitemap's uiSchema tree is opaque jsonb here,
// so this is a read-shape, not a source of truth.
export type UisGenApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface UisGenConditionBranch {
  steps: UisGenActionStep[];
}

export interface UisGenActionStep {
  kind: 'condition' | 'validate' | 'callApi' | 'checkResponse' | 'navigate' | 'openModal' | 'showAlert' | 'closeModal';
  apiMethod?: UisGenApiMethod;
  apiUrl?: string;
  branches?: UisGenConditionBranch[];
  elseSteps?: UisGenActionStep[];
}
