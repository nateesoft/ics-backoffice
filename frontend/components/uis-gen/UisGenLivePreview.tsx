'use client';
// Renders a page/content/modal node's schema+uiSchema+data as a real, interactive form — reuses
// flow-generate's JSONForms renderer set (customRenderers/customControlRenderers) and
// ActionRunnerContext as-is (both are generic, no flow-generate project coupling), but provides
// its own runSteps: 'navigate' calls back out to the host (real route change in the Preview page,
// or a toast during in-designer preview), 'openModal'/'showAlert' resolve against this project's
// own sitemap nodes instead of flow-generate's flowUiStore.
import { useEffect, useRef, useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import type { UisGenActionStep, UisGenAlertNodeData, UisGenCondition, UisGenModalNodeData } from '@/types/uisGen';
import Modal from '@/components/ui/Modal';
import AlertBox from './AlertBox';
import { ActionRunnerContext } from '@/components/flow-generate/ui-builder/actionRunner';
import { customRenderers } from '@/components/flow-generate/ui-builder/customRenderers';
import { customControlRenderers } from '@/components/flow-generate/ui-builder/customControlRenderers';
import '@/components/flow-generate/ui-builder/jsonforms-vanilla.css';

const renderers = [...vanillaRenderers, ...customRenderers, ...customControlRenderers];
const TOAST_DURATION_MS = 2500;

interface ApiResponse {
  status: number;
  body: unknown;
}

// Required-field check against the current schema/data — deliberately not a full JSON-Schema
// validator (no ajv dependency needed): a "validate payload" step in a low-code action sequence
// almost always means "did the user fill in the required fields", computed fresh at the moment
// the step runs (unlike JsonForms' own onChange-reported errors, which stay stale/empty until the
// user has touched at least one field).
function validatePayload(schema: JsonSchema7, data: Record<string, unknown>): string[] {
  const required = schema.required ?? [];
  const errors: string[] = [];
  for (const key of required) {
    const value = data[key];
    if (value === undefined || value === null || value === '') {
      const title = (schema.properties?.[key] as JsonSchema7 | undefined)?.title ?? key;
      errors.push(`${title} is required`);
    }
  }
  return errors;
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function evaluateCheckResponse(step: UisGenActionStep, response: ApiResponse | null): boolean {
  if (!response) return false;
  if ((step.checkTarget ?? 'status') === 'status') {
    return response.status >= 200 && response.status < 300;
  }
  const value = getByPath(response.body, step.checkPath ?? '');
  const operator = step.checkOperator ?? 'equals';
  if (operator === 'exists') return value !== undefined && value !== null;
  const matches = String(value) === (step.checkValue ?? '');
  return operator === 'notEquals' ? !matches : matches;
}

// condition step: 'data' reads from the current form data, 'response' reads from the most recent
// callApi step's response body earlier in this same run (null if none ran yet — no branch with a
// 'response' condition can match in that case, same as checkResponse's own behavior).
function evaluateCondition(condition: UisGenCondition, data: Record<string, unknown>, response: ApiResponse | null): boolean {
  const source = condition.source === 'response' ? (response?.body ?? null) : data;
  const value = getByPath(source, condition.path);
  switch (condition.operator) {
    case 'exists': return value !== undefined && value !== null;
    case 'notExists': return value === undefined || value === null;
    case 'greaterThan': return Number(value) > Number(condition.value ?? 0);
    case 'lessThan': return Number(value) < Number(condition.value ?? 0);
    case 'contains': return String(value ?? '').includes(condition.value ?? '');
    case 'notEquals': return String(value) !== (condition.value ?? '');
    default: return String(value) === (condition.value ?? '');
  }
}

// Loosened from UisGenSitemapNode: callers (SitemapCanvas's live xyflow node state) carry extra
// UI-only fields (e.g. onRemove) alongside the persisted data — this component only ever reads
// id/type/data, so a structurally wider shape avoids a pointless strip-and-recast at every call site.
export interface LivePreviewNodeRef {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface UisGenLivePreviewProps {
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
  nodes: LivePreviewNodeRef[];
  onNavigate?: (path: string) => void;
  onRequestClose?: () => void;
  // What a 'reset' button restores `data` to (the node's own designed sample data, distinct from
  // the live `data` the Preview page is tracking per-node). Falls back to this instance's
  // first-render `data` when the caller doesn't have a separate default to offer (design-time tabs).
  initialData?: Record<string, unknown>;
}

function NestedModalPreview({
  node, nodes, onNavigate, onClose,
}: {
  node: LivePreviewNodeRef;
  nodes: LivePreviewNodeRef[];
  onNavigate?: (path: string) => void;
  onClose: () => void;
}) {
  const modalData = node.data as unknown as UisGenModalNodeData;
  const [data, setData] = useState<Record<string, unknown>>(modalData.data ?? {});
  return (
    <Modal title={modalData.name || 'Modal'} onClose={onClose} size="md">
      <UisGenLivePreview
        schema={modalData.schema}
        uiSchema={modalData.uiSchema}
        data={data}
        onDataChange={setData}
        nodes={nodes}
        onNavigate={onNavigate}
        onRequestClose={onClose}
      />
    </Modal>
  );
}

export default function UisGenLivePreview({ schema, uiSchema, data, onDataChange, nodes, onNavigate, onRequestClose, initialData }: UisGenLivePreviewProps) {
  const hasFields = Boolean(uiSchema.elements?.length);
  const [modalStack, setModalStack] = useState<LivePreviewNodeRef[]>([]);
  const [activeAlert, setActiveAlert] = useState<LivePreviewNodeRef | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountDataRef = useRef(data);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  async function runCallApi(step: UisGenActionStep): Promise<ApiResponse | null> {
    if (!step.apiUrl) return null;
    const method = step.apiMethod ?? 'GET';
    const hasBody = Boolean(step.apiSendData) && method !== 'GET';
    showToast(`Calling ${method} ${step.apiUrl}…`);
    try {
      const res = await fetch(step.apiUrl, {
        method,
        credentials: 'same-origin',
        headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
        body: hasBody ? JSON.stringify(data) : undefined,
      });
      let body: unknown = null;
      try { body = await res.clone().json(); } catch { /* non-JSON response body — leave null */ }
      showToast(res.ok ? `API OK — ${res.status}` : `API Error — ${res.status}`);
      return { status: res.status, body };
    } catch (err) {
      showToast(`API Error — ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  // Steps run in order, awaiting each callApi before the next step so 'checkResponse'/'condition'
  // can inspect it. 'validate'/'checkResponse' HALT the remaining steps in *this* sequence on
  // failure (e.g. so a Login button's Call API + Check Response steps don't proceed to Navigate on
  // a failed login) — every other step kind just skips itself (via `continue`) when its own config
  // is incomplete. 'condition' recurses into whichever branch (or else) matches; a halt inside a
  // branch propagates out and stops the parent sequence too, same as a halt at the top level.
  async function runStepList(steps: UisGenActionStep[], lastResponse: ApiResponse | null): Promise<{ lastResponse: ApiResponse | null; halted: boolean }> {
    for (const step of steps) {
      if (step.kind === 'condition') {
        const matched = (step.branches ?? []).find(b => evaluateCondition(b.condition, data, lastResponse));
        const branchSteps = matched ? matched.steps : (step.elseSteps ?? []);
        if (branchSteps.length > 0) {
          const result = await runStepList(branchSteps, lastResponse);
          lastResponse = result.lastResponse;
          if (result.halted) return { lastResponse, halted: true };
        }
      } else if (step.kind === 'validate') {
        const errors = validatePayload(schema, data);
        if (errors.length > 0) {
          showToast(`Validation failed: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ''}`);
          return { lastResponse, halted: true };
        }
      } else if (step.kind === 'callApi') {
        lastResponse = await runCallApi(step);
      } else if (step.kind === 'checkResponse') {
        if (!evaluateCheckResponse(step, lastResponse)) {
          showToast('Check response failed — หยุดการทำงาน');
          return { lastResponse, halted: true };
        }
      } else if (step.kind === 'navigate') {
        if (!step.path) continue;
        if (onNavigate) onNavigate(step.path);
        else showToast(`Navigate: ${step.path}`);
      } else if (step.kind === 'openModal') {
        const target = step.targetId ? nodes.find(n => n.id === step.targetId && n.type === 'modal') : undefined;
        if (!target) continue;
        setModalStack(stack => (stack.some(m => m.id === target.id) ? stack : [...stack, target]));
      } else if (step.kind === 'showAlert') {
        const target = step.targetId ? nodes.find(n => n.id === step.targetId && n.type === 'alert') : undefined;
        if (target) setActiveAlert(target);
      } else if (step.kind === 'closeModal') {
        if (modalStack.length > 0) setModalStack(stack => stack.slice(0, -1));
        else onRequestClose?.();
      }
    }
    return { lastResponse, halted: false };
  }

  async function handleRunSteps(rawSteps: unknown) {
    await runStepList(rawSteps as UisGenActionStep[], null);
  }

  function resetForm() {
    onDataChange(initialData ?? mountDataRef.current);
  }

  return (
    <ActionRunnerContext.Provider value={{ runSteps: handleRunSteps, hideStepBadge: true, resetForm }}>
      <div className="relative jf-vanilla bg-white rounded-lg min-h-[52px]">
        {hasFields ? (
          <JsonForms
            schema={schema}
            uischema={uiSchema}
            data={data}
            renderers={renderers}
            cells={vanillaCells}
            onChange={({ data: newData }) => onDataChange(newData)}
          />
        ) : (
          <p className="text-xs text-slate-400 text-center py-3">ยังไม่มี element ในหน้านี้</p>
        )}

        {toast && (
          <div className="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs shadow-lg z-10">
            {toast}
          </div>
        )}
      </div>

      {modalStack.map((node, i) => (
        <NestedModalPreview
          key={`${node.id}-${i}`}
          node={node}
          nodes={nodes}
          onNavigate={onNavigate}
          onClose={() => setModalStack(stack => stack.slice(0, i))}
        />
      ))}

      {activeAlert && (
        <AlertBox
          alertType={(activeAlert.data as unknown as UisGenAlertNodeData).alertType}
          title={(activeAlert.data as unknown as UisGenAlertNodeData).title}
          message={(activeAlert.data as unknown as UisGenAlertNodeData).message}
          onClose={() => setActiveAlert(null)}
        />
      )}
    </ActionRunnerContext.Provider>
  );
}
