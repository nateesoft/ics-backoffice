'use client';
// Ordered step-list editor for Button/Control actions — same StepCard/newStepId() shape as
// components/flow-generate/ApiStepBuilder.tsx, adapted for UiActionStep instead of ApiStep.
import { useState } from 'react';
import { FlowApiItem } from '@/types/flowApi';
import { FlowUiItem, UiActionStep, UiActionStepKind } from '@/types/flowUi';
import ActionPickerModal from './ActionPickerModal';
import UiPickerModal from './UiPickerModal';

interface ActionStepsEditorProps {
  steps: UiActionStep[];
  projectId?: string;
  excludeUiId?: string;
  onChange: (steps: UiActionStep[]) => void;
}

const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white";
const labelCls = "block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";

const KIND_LABELS: Record<UiActionStepKind, string> = {
  callApi: 'Call API',
  openModal: 'Open Modal',
  closeModal: 'Close Modal',
  navigate: 'Navigate',
};

function newStepId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `action-step-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function StepRow({
  index, total, step, projectId, excludeUiId, onChange, onRemove, onMove,
}: {
  index: number;
  total: number;
  step: UiActionStep;
  projectId?: string;
  excludeUiId?: string;
  onChange: (step: UiActionStep) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [apiPickerOpen, setApiPickerOpen] = useState(false);
  const [uiPickerOpen, setUiPickerOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono shrink-0">#{index + 1}</span>
        <select
          className={`${inputCls} flex-1`}
          value={step.kind}
          onChange={e => onChange({ ...step, kind: e.target.value as UiActionStepKind })}
        >
          {(Object.keys(KIND_LABELS) as UiActionStepKind[]).map(k => (
            <option key={k} value={k}>{KIND_LABELS[k]}</option>
          ))}
        </select>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 px-1 text-xs" title="เลื่อนขึ้น">▲</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 px-1 text-xs" title="เลื่อนลง">▼</button>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 px-1 text-xs" title="ลบ Step">✕</button>
      </div>

      {step.kind === 'callApi' && (
        <div>
          <label className={labelCls}>API</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              className={`${inputCls} font-mono flex-1`}
              value={step.apiRef ?? ''}
              onChange={e => onChange({ ...step, apiRef: e.target.value || undefined })}
              placeholder="${ApiName}"
            />
            <button type="button" onClick={() => setApiPickerOpen(true)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">Browse</button>
          </div>
          {apiPickerOpen && (
            <ActionPickerModal
              projectId={projectId}
              onClose={() => setApiPickerOpen(false)}
              onSelect={(api: FlowApiItem) => { onChange({ ...step, apiRef: `\${${api.name}}` }); setApiPickerOpen(false); }}
            />
          )}
        </div>
      )}

      {step.kind === 'openModal' && (
        <div>
          <label className={labelCls}>UI / Modal</label>
          <div className="flex gap-1.5">
            <input type="text" disabled className={`${inputCls} flex-1 bg-slate-50 text-slate-500 truncate`} value={step.uiRef ?? 'ยังไม่ได้เลือก'} />
            <button type="button" onClick={() => setUiPickerOpen(true)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">Browse</button>
          </div>
          {uiPickerOpen && (
            <UiPickerModal
              projectId={projectId}
              excludeUiId={excludeUiId}
              onClose={() => setUiPickerOpen(false)}
              onSelect={(ui: FlowUiItem) => { onChange({ ...step, uiRef: ui.id }); setUiPickerOpen(false); }}
            />
          )}
        </div>
      )}

      {step.kind === 'navigate' && (
        <div>
          <label className={labelCls}>Path</label>
          <input
            type="text"
            className={`${inputCls} font-mono`}
            value={step.path ?? ''}
            onChange={e => onChange({ ...step, path: e.target.value || undefined })}
            placeholder="/login"
          />
        </div>
      )}
    </div>
  );
}

export default function ActionStepsEditor({ steps, projectId, excludeUiId, onChange }: ActionStepsEditorProps) {
  function addStep() {
    onChange([...steps, { id: newStepId(), kind: 'callApi' }]);
  }

  function updateStep(id: string, updated: UiActionStep) {
    onChange(steps.map(s => (s.id === id ? updated : s)));
  }

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {steps.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">ยังไม่มี Step — กด &ldquo;+ Add Step&rdquo; เพื่อเพิ่ม</p>
      ) : (
        steps.map((step, i) => (
          <StepRow
            key={step.id}
            index={i}
            total={steps.length}
            step={step}
            projectId={projectId}
            excludeUiId={excludeUiId}
            onChange={updated => updateStep(step.id, updated)}
            onRemove={() => removeStep(step.id)}
            onMove={dir => moveStep(i, dir)}
          />
        ))
      )}
      <button type="button" onClick={addStep} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
        + Add Step
      </button>
    </div>
  );
}
