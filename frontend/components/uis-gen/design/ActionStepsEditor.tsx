'use client';
// Forked from components/flow-generate/ui-builder/ActionStepsEditor.tsx: same StepRow shape, but
// 'openModal'/'showAlert' targets are picked from this project's own sitemap modal/alert nodes
// via a plain <select> instead of flow-generate's flowUiStore-backed UiPickerModal. 'condition'
// steps nest full step sequences per branch — implemented by having ActionStepsEditor render
// itself recursively for each branch's `steps` and for `elseSteps`, unrestricted nesting depth.
import {
  UISGEN_API_METHODS, UISGEN_CHECK_OPERATORS, UISGEN_CHECK_TARGETS,
  UISGEN_CONDITION_OPERATORS, UISGEN_CONDITION_SOURCES,
  UisGenActionStep, UisGenActionStepKind, UisGenApiMethod, UisGenCheckOperator, UisGenCheckTarget,
  UisGenCondition, UisGenConditionBranch, UisGenConditionOperator, UisGenConditionSource,
} from '@/types/uisGen';

export interface ActionTarget {
  id: string;
  name: string;
  kind: 'modal' | 'alert';
}

interface ActionStepsEditorProps {
  steps: UisGenActionStep[];
  targets: ActionTarget[];
  onChange: (steps: UisGenActionStep[]) => void;
}

const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white";
// Same styling as inputCls but without `w-full` — for elements that need a fixed width (e.g. the
// HTTP method <select> next to the URL input). Combining inputCls's `w-full` with a `w-24`
// override doesn't work: both set `width`, and `w-full` wins the cascade regardless of class
// order in the string, so the element stays full-width and squeezes its flex sibling to nothing.
const fixedWidthInputCls = "px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white";
const labelCls = "block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";

const KIND_LABELS: Record<UisGenActionStepKind, string> = {
  condition: 'If / Else If / Else',
  validate: 'Validate Payload',
  callApi: 'Call API',
  checkResponse: 'Check Response',
  navigate: 'Navigate',
  openModal: 'Open Modal',
  showAlert: 'Show Alert',
  closeModal: 'Close Modal',
};

const CONDITION_OPERATOR_LABELS: Record<UisGenConditionOperator, string> = {
  equals: 'Equals',
  notEquals: 'Not Equals',
  exists: 'Exists',
  notExists: 'Not Exists',
  greaterThan: 'Greater Than',
  lessThan: 'Less Than',
  contains: 'Contains',
};

function newStepId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `action-step-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultCondition(): UisGenCondition {
  return { source: 'data', path: '', operator: 'equals', value: '' };
}

function defaultBranch(): UisGenConditionBranch {
  return { id: newStepId(), condition: defaultCondition(), steps: [] };
}

function ConditionEditor({ condition, onChange }: { condition: UisGenCondition; onChange: (condition: UisGenCondition) => void }) {
  const needsValue = condition.operator !== 'exists' && condition.operator !== 'notExists';
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <select
        className={inputCls}
        value={condition.source}
        onChange={e => onChange({ ...condition, source: e.target.value as UisGenConditionSource })}
      >
        {UISGEN_CONDITION_SOURCES.map(s => <option key={s} value={s}>{s === 'data' ? 'Form Data' : 'Last API Response'}</option>)}
      </select>
      <input
        type="text"
        className={`${inputCls} font-mono`}
        value={condition.path}
        onChange={e => onChange({ ...condition, path: e.target.value })}
        placeholder="เช่น quantity หรือ data.success"
      />
      <select
        className={inputCls}
        value={condition.operator}
        onChange={e => onChange({ ...condition, operator: e.target.value as UisGenConditionOperator })}
      >
        {UISGEN_CONDITION_OPERATORS.map(op => <option key={op} value={op}>{CONDITION_OPERATOR_LABELS[op]}</option>)}
      </select>
      {needsValue ? (
        <input
          type="text"
          className={inputCls}
          value={condition.value ?? ''}
          onChange={e => onChange({ ...condition, value: e.target.value })}
          placeholder="ค่าที่เปรียบเทียบ"
        />
      ) : <div />}
    </div>
  );
}

function BranchEditor({
  label, branch, targets, onChange, onRemove,
}: {
  label: string;
  branch: UisGenConditionBranch;
  targets: ActionTarget[];
  onChange: (branch: UisGenConditionBranch) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">{label}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 px-1 text-xs" title="ลบ Else If">✕</button>
        )}
      </div>
      <ConditionEditor condition={branch.condition} onChange={condition => onChange({ ...branch, condition })} />
      <div className="pl-2 border-l-2 border-indigo-200">
        <ActionStepsEditor steps={branch.steps} targets={targets} onChange={stepsNext => onChange({ ...branch, steps: stepsNext })} />
      </div>
    </div>
  );
}

function StepRow({
  index, total, step, targets, onChange, onRemove, onMove,
}: {
  index: number;
  total: number;
  step: UisGenActionStep;
  targets: ActionTarget[];
  onChange: (step: UisGenActionStep) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const modalTargets = targets.filter(t => t.kind === 'modal');
  const alertTargets = targets.filter(t => t.kind === 'alert');
  const pickable = step.kind === 'openModal' ? modalTargets : step.kind === 'showAlert' ? alertTargets : [];

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono shrink-0">#{index + 1}</span>
        <select
          className={`${inputCls} flex-1`}
          value={step.kind}
          onChange={e => onChange({ ...step, kind: e.target.value as UisGenActionStepKind })}
        >
          {(Object.keys(KIND_LABELS) as UisGenActionStepKind[]).map(k => (
            <option key={k} value={k}>{KIND_LABELS[k]}</option>
          ))}
        </select>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 px-1 text-xs" title="เลื่อนขึ้น">▲</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 px-1 text-xs" title="เลื่อนลง">▼</button>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 px-1 text-xs" title="ลบ Step">✕</button>
      </div>

      {step.kind === 'condition' && (
        <div className="space-y-2">
          {(step.branches ?? []).map((branch, i) => (
            <BranchEditor
              key={branch.id}
              label={i === 0 ? 'If' : 'Else If'}
              branch={branch}
              targets={targets}
              onChange={updated => onChange({ ...step, branches: (step.branches ?? []).map(b => (b.id === updated.id ? updated : b)) })}
              onRemove={i === 0 ? undefined : () => onChange({ ...step, branches: (step.branches ?? []).filter(b => b.id !== branch.id) })}
            />
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...step, branches: [...(step.branches ?? []), defaultBranch()] })}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
          >
            + Add Else If
          </button>
          <div className="rounded-lg border border-slate-200 bg-slate-100/60 p-2.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Else</span>
            <div className="pl-2 border-l-2 border-slate-300">
              <ActionStepsEditor
                steps={step.elseSteps ?? []}
                targets={targets}
                onChange={elseSteps => onChange({ ...step, elseSteps })}
              />
            </div>
          </div>
        </div>
      )}

      {step.kind === 'validate' && (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          ตรวจสอบว่าฟิลด์ที่กำหนดเป็น required ในฟอร์มปัจจุบันถูกกรอกครบหรือไม่ — ถ้าไม่ผ่าน จะหยุด Step ถัดไปทั้งหมด
        </p>
      )}

      {step.kind === 'checkResponse' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>ตรวจสอบจาก</label>
            <select
              className={inputCls}
              value={step.checkTarget ?? 'status'}
              onChange={e => onChange({ ...step, checkTarget: e.target.value as UisGenCheckTarget })}
            >
              {UISGEN_CHECK_TARGETS.map(t => <option key={t} value={t}>{t === 'status' ? 'HTTP Status (2xx)' : 'Response Body'}</option>)}
            </select>
          </div>
          {(step.checkTarget ?? 'status') === 'body' && (
            <>
              <div>
                <label className={labelCls}>Path (เช่น data.success)</label>
                <input
                  type="text"
                  className={`${inputCls} font-mono`}
                  value={step.checkPath ?? ''}
                  onChange={e => onChange({ ...step, checkPath: e.target.value || undefined })}
                  placeholder="data.success"
                />
              </div>
              <div>
                <label className={labelCls}>เงื่อนไข</label>
                <select
                  className={inputCls}
                  value={step.checkOperator ?? 'equals'}
                  onChange={e => onChange({ ...step, checkOperator: e.target.value as UisGenCheckOperator })}
                >
                  {UISGEN_CHECK_OPERATORS.map(op => (
                    <option key={op} value={op}>{op === 'equals' ? 'Equals' : op === 'notEquals' ? 'Not Equals' : 'Exists'}</option>
                  ))}
                </select>
              </div>
              {(step.checkOperator ?? 'equals') !== 'exists' && (
                <div>
                  <label className={labelCls}>ค่าที่ต้องการ</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={step.checkValue ?? ''}
                    onChange={e => onChange({ ...step, checkValue: e.target.value || undefined })}
                    placeholder="true"
                  />
                </div>
              )}
            </>
          )}
          <p className="text-[11px] text-slate-400">ตรวจจาก response ของ Step &ldquo;Call API&rdquo; ล่าสุดก่อนหน้านี้ — ถ้าไม่ผ่าน จะหยุด Step ถัดไปทั้งหมด</p>
        </div>
      )}

      {step.kind === 'callApi' && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <select
              className={`${fixedWidthInputCls} w-24 flex-shrink-0`}
              value={step.apiMethod ?? 'GET'}
              onChange={e => onChange({ ...step, apiMethod: e.target.value as UisGenApiMethod })}
            >
              {UISGEN_API_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              type="text"
              className={`${inputCls} font-mono flex-1`}
              value={step.apiUrl ?? ''}
              onChange={e => onChange({ ...step, apiUrl: e.target.value || undefined })}
              placeholder="/ics-backoffice/api/v1/products หรือ https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={step.apiSendData ?? false}
              onChange={e => onChange({ ...step, apiSendData: e.target.checked })}
            />
            ส่งข้อมูลฟอร์มปัจจุบันเป็น request body
          </label>
        </div>
      )}

      {step.kind === 'navigate' && (
        <div>
          <label className={labelCls}>Route Path</label>
          <input
            type="text"
            className={`${inputCls} font-mono`}
            value={step.path ?? ''}
            onChange={e => onChange({ ...step, path: e.target.value || undefined })}
            placeholder="/login"
          />
        </div>
      )}

      {(step.kind === 'openModal' || step.kind === 'showAlert') && (
        <div>
          <label className={labelCls}>{step.kind === 'openModal' ? 'Modal' : 'Alert'}</label>
          <select
            className={inputCls}
            value={step.targetId ?? ''}
            onChange={e => onChange({ ...step, targetId: e.target.value || undefined })}
          >
            <option value="">ยังไม่ได้เลือก</option>
            {pickable.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {pickable.length === 0 && (
            <p className="text-[11px] text-slate-400 mt-1">
              ยังไม่มี {step.kind === 'openModal' ? 'Modal' : 'Alert'} node ใน Sitemap — เพิ่มได้จาก Canvas
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActionStepsEditor({ steps, targets, onChange }: ActionStepsEditorProps) {
  function addStep() {
    onChange([...steps, { id: newStepId(), kind: 'navigate' }]);
  }

  function updateStep(id: string, updated: UisGenActionStep) {
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

  // A freshly-added 'condition' step needs at least its "If" branch to be usable.
  function updateStepWithDefaults(id: string, updated: UisGenActionStep) {
    if (updated.kind === 'condition' && !updated.branches) {
      updated = { ...updated, branches: [defaultBranch()] };
    }
    updateStep(id, updated);
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
            targets={targets}
            onChange={updated => updateStepWithDefaults(step.id, updated)}
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
