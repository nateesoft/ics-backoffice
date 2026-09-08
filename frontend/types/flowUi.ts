import type { JsonSchema7 } from '@jsonforms/core';

export type UiType = 'Page' | 'Component';
export type PageKind = 'Main Page' | 'Page Content';

export const UI_TYPES: UiType[] = ['Page', 'Component'];
export const PAGE_KINDS: PageKind[] = ['Main Page', 'Page Content'];
export const PRESET_ROLES = ['User', 'Admin', 'Manager'];

// Plain, JSON-serializable UI Schema node used by the drag-and-drop builder
// (frontend/components/flow-generate/ui-builder). Deliberately simpler than
// @jsonforms/core's UISchemaElement union so tree operations stay type-safe;
// it is structurally compatible with UISchemaElement wherever JsonForms needs one.
export interface UiSchemaNode {
  type: string;
  elements?: UiSchemaNode[];
  scope?: string;
  label?: string;
  text?: string;
  options?: Record<string, unknown>;
}

// A single step in a Button/Control action sequence — e.g. "open the Logout Confirm modal, then
// close it" or "call the Logout API, then navigate to /login". `apiRef`/`uiRef`/`path` are only
// ever read for the step kind that uses them.
export type UiActionStepKind = 'callApi' | 'openModal' | 'closeModal' | 'navigate';

export interface UiActionStep {
  id: string;
  kind: UiActionStepKind;
  apiRef?: string; // callApi -> FlowApiItem.name, "${ApiName}" convention (same as legacy options.action)
  uiRef?: string;  // openModal -> FlowUiItem.id
  path?: string;   // navigate -> uiPath
}

export const UI_ACTION_STEP_KINDS: UiActionStepKind[] = ['callApi', 'openModal', 'closeModal', 'navigate'];

export const DEFAULT_JSON_SCHEMA: JsonSchema7 = { type: 'object', properties: {} };
export const DEFAULT_UI_SCHEMA: UiSchemaNode = { type: 'VerticalLayout', elements: [] };
export const DEFAULT_FORM_DATA: Record<string, unknown> = {};

export interface FlowUiItem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  uiType: UiType;
  pageKind: PageKind | null;
  uiPath: string | null;
  roles: string[];
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
