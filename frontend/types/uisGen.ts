import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from './flowUi';

export type NavPosition = 'left' | 'right' | 'top' | 'bottom';
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type AlertType = 'info' | 'confirm' | 'warning' | 'error';

export const NAV_POSITIONS: NavPosition[] = ['left', 'right', 'top', 'bottom'];
export const MODAL_POSITIONS: ModalPosition[] = ['center', 'top', 'bottom', 'left', 'right'];
export const ALERT_TYPES: AlertType[] = ['info', 'confirm', 'warning', 'error'];

export interface UisGenProject {
  id: string;
  name: string;
  templateId: string;
  navPosition: NavPosition;
  themeColor: string;
  // Gates whether the project detail page shows the "Generate" empty-state or the Sitemap
  // Canvas directly — set true the first time the user clicks Generate.
  sitemapGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UisGenNodeType = 'actor' | 'page' | 'content' | 'modal' | 'alert' | 'condition';

export interface UisGenActorNodeData {
  name: string;
  color: string;
}

// A sitemap-level branch point (distinct from the action-step 'condition' kind above, which
// branches inside a single Button's step sequence) — a free-text label plus two named outputs
// ("True"/"False"), same diagramming convention as flow-generate's own Condition node. Purely a
// graph/documentation construct: Preview's route matching doesn't evaluate it automatically.
export interface UisGenConditionNodeData {
  name: string;
  label: string;
}

// Shared shape for 'page' and 'content' nodes — both are routable and independently designed;
// only how they render at preview time differs (page = standalone full-screen, no shell;
// content = composed inside the project's shared shell content region).
export interface UisGenPageLikeNodeData {
  name: string;
  routePath: string;
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
}

export type UisGenPageNodeData = UisGenPageLikeNodeData;
export type UisGenContentNodeData = UisGenPageLikeNodeData;

export interface UisGenModalNodeData {
  name: string;
  modalPosition: ModalPosition;
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
}

export interface UisGenAlertNodeData {
  name: string;
  alertType: AlertType;
  title: string;
  message: string;
}

export type UisGenNodeData =
  | UisGenActorNodeData
  | UisGenPageNodeData
  | UisGenContentNodeData
  | UisGenModalNodeData
  | UisGenAlertNodeData
  | UisGenConditionNodeData;

export interface UisGenSitemapNode {
  id: string;
  type: UisGenNodeType;
  position: { x: number; y: number };
  data: UisGenNodeData;
}

// Every node has 2 target (input) handles — ids 'in1'/'in2' — and 2 source (output) handles —
// ids 'out1'/'out2' — for flexible wiring (see SitemapNodes.tsx). sourceHandle/targetHandle
// record which specific ports an edge connects, so e.g. a Condition node's 'out1' (True) and
// 'out2' (False) can each fan out to a different target even though it's the same source node.
export interface UisGenSitemapEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface UisGenSitemapState {
  nodes: UisGenSitemapNode[];
  edges: UisGenSitemapEdge[];
}

// Action steps configurable on Buttons inside the page/content/modal designer (see
// components/uis-gen/design/ActionStepsEditor.tsx). Kept separate from flow-generate's
// UiActionStep — it's read structurally (not by import) from options.actionSteps by the reused
// customRenderers.tsx Button renderer, so no shared-type coupling is needed.
export type UisGenActionStepKind = 'condition' | 'validate' | 'callApi' | 'checkResponse' | 'navigate' | 'openModal' | 'showAlert' | 'closeModal';
export type UisGenApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const UISGEN_API_METHODS: UisGenApiMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// checkResponse: 'status' checks the last callApi step's HTTP status is 2xx; 'body' compares a
// dot-path into the parsed JSON response body against checkValue via checkOperator.
export type UisGenCheckTarget = 'status' | 'body';
export type UisGenCheckOperator = 'equals' | 'notEquals' | 'exists';
export const UISGEN_CHECK_TARGETS: UisGenCheckTarget[] = ['status', 'body'];
export const UISGEN_CHECK_OPERATORS: UisGenCheckOperator[] = ['equals', 'notEquals', 'exists'];

// condition: an if / else-if / else branch. 'data' reads a dot-path from the current form data;
// 'response' reads it from the most recent Call API step's response body earlier in this run.
export type UisGenConditionSource = 'data' | 'response';
export type UisGenConditionOperator = 'equals' | 'notEquals' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan' | 'contains';
export const UISGEN_CONDITION_SOURCES: UisGenConditionSource[] = ['data', 'response'];
export const UISGEN_CONDITION_OPERATORS: UisGenConditionOperator[] = ['equals', 'notEquals', 'exists', 'notExists', 'greaterThan', 'lessThan', 'contains'];

export interface UisGenCondition {
  source: UisGenConditionSource;
  path: string;
  operator: UisGenConditionOperator;
  value?: string; // unused for exists/notExists
}

export interface UisGenConditionBranch {
  id: string;
  condition: UisGenCondition;
  steps: UisGenActionStep[];
}

export interface UisGenActionStep {
  id: string;
  kind: UisGenActionStepKind;
  path?: string;         // navigate -> route path, e.g. "/product"
  targetId?: string;     // openModal/showAlert -> UisGenSitemapNode id (modal/alert node)
  apiMethod?: UisGenApiMethod; // callApi -> HTTP method, default 'GET'
  apiUrl?: string;             // callApi -> request URL (relative or absolute)
  apiSendData?: boolean;       // callApi -> send the current page/modal's form data as the request body
  checkTarget?: UisGenCheckTarget;     // checkResponse -> defaults to 'status'
  checkPath?: string;                  // checkResponse + target='body' -> e.g. "data.success"
  checkOperator?: UisGenCheckOperator; // checkResponse + target='body' -> defaults to 'equals'
  checkValue?: string;                 // checkResponse + target='body' + operator!='exists'
  // condition -> evaluated in order (if, else-if, else-if, ...); first match's `steps` run.
  // `elseSteps` run when no branch matches. Both are full nested step sequences (can themselves
  // contain 'condition' steps — nesting is unrestricted).
  branches?: UisGenConditionBranch[];
  elseSteps?: UisGenActionStep[];
}

export const DEFAULT_UISGEN_SCHEMA: JsonSchema7 = { type: 'object', properties: {} };
export const DEFAULT_UISGEN_UI_SCHEMA: UiSchemaNode = { type: 'VerticalLayout', elements: [] };
export const DEFAULT_UISGEN_DATA: Record<string, unknown> = {};
