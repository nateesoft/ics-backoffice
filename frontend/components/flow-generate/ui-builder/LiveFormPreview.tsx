'use client';
import { useEffect, useRef, useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import type { JsonSchema7 } from '@jsonforms/core';
import type { FlowUiItem, UiActionStep, UiSchemaNode } from '@/types/flowUi';
import { flowUiStore } from '@/lib/flowUiStore';
import Modal from '@/components/ui/Modal';
import { ActionRunnerContext } from './actionRunner';
import { customRenderers } from './customRenderers';
import { customControlRenderers } from './customControlRenderers';
import './jsonforms-vanilla.css';

const renderers = [...vanillaRenderers, ...customRenderers, ...customControlRenderers];
const TOAST_DURATION_MS = 2500;

interface LiveFormPreviewProps {
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
  // Set when this instance is itself rendered inside a modal opened by an 'openModal' step (see
  // NestedModalPreview below) — lets a 'closeModal' step *inside that modal's own tree* (e.g. its
  // own "Close" button) close the modal it lives in, not just modals it opened itself.
  onRequestClose?: () => void;
}

// A modal opened by an 'openModal' step keeps its own local data state — it's a sandboxed
// preview, not written back to flowUiStore — but is otherwise a fully live nested
// LiveFormPreview, so buttons/dropdowns inside it (e.g. its own "Close" button) work too.
function NestedModalPreview({ item, onClose }: { item: FlowUiItem; onClose: () => void }) {
  const [data, setData] = useState<Record<string, unknown>>(item.data ?? {});
  return (
    <Modal title={item.name} onClose={onClose} size="md">
      <LiveFormPreview schema={item.schema} uiSchema={item.uiSchema} data={data} onDataChange={setData} onRequestClose={onClose} />
    </Modal>
  );
}

export default function LiveFormPreview({ schema, uiSchema, data, onDataChange, onRequestClose }: LiveFormPreviewProps) {
  const hasFields = Boolean(uiSchema.elements?.length);
  const [modalStack, setModalStack] = useState<FlowUiItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  function runSteps(steps: UiActionStep[]) {
    for (const step of steps) {
      if (step.kind === 'callApi') {
        showToast(`Called API: ${step.apiRef ?? '(ยังไม่ได้เลือก API)'}`);
      } else if (step.kind === 'openModal') {
        if (!step.uiRef) continue;
        const target = flowUiStore.getById(step.uiRef);
        if (!target) continue;
        setModalStack(stack => (stack.some(m => m.id === target.id) ? stack : [...stack, target]));
      } else if (step.kind === 'closeModal') {
        // Close a modal *this* instance opened, if any; otherwise this instance is itself a
        // nested modal (see onRequestClose above) — close it.
        if (modalStack.length > 0) {
          setModalStack(stack => stack.slice(0, -1));
        } else {
          onRequestClose?.();
        }
      } else if (step.kind === 'navigate') {
        showToast(`Navigate: ${step.path ?? '(ยังไม่ได้กำหนด path)'}`);
      }
    }
  }

  return (
    <ActionRunnerContext.Provider value={{ runSteps }}>
      <div className="relative jf-vanilla bg-white rounded-lg border border-slate-200 p-4 min-h-[52px]">
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
          <p className="text-xs text-slate-400 text-center py-3">
            ยังไม่มี element — ลาก field มาวางในโครงสร้างด้านซ้ายเพื่อดูตัวอย่างที่นี่
          </p>
        )}

        {toast && (
          <div className="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs shadow-lg z-10">
            {toast}
          </div>
        )}
      </div>

      {modalStack.map((item, i) => (
        <NestedModalPreview
          key={`${item.id}-${i}`}
          item={item}
          onClose={() => setModalStack(stack => stack.slice(0, i))}
        />
      ))}
    </ActionRunnerContext.Provider>
  );
}
