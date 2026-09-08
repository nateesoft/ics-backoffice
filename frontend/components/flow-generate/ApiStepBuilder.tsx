'use client';
import { useRef, useState } from 'react';
import { ApiStep, StepType, STEP_TYPES, STEP_TEMPLATES, DEFAULT_ERROR_HANDLING } from '@/types/flowApi';

interface ApiStepBuilderProps {
  sampleData: string;
  onSampleDataChange: (value: string) => void;
  steps: ApiStep[];
  onStepsChange: (steps: ApiStep[]) => void;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

const STEP_COLORS: Record<StepType, string> = {
  Filter: 'bg-sky-50 text-sky-700 border-sky-200',
  Validate: 'bg-amber-50 text-amber-700 border-amber-200',
  Create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Update: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delete: 'bg-rose-50 text-rose-700 border-rose-200',
  Export: 'bg-violet-50 text-violet-700 border-violet-200',
};

function newStepId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `step-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function EditableList({ items, onChange, addLabel }: { items: string[]; onChange: (items: string[]) => void; addLabel: string }) {
  return (
    <div className="space-y-1.5">
      {items.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4 shrink-0 text-right">{i + 1}.</span>
          <input
            type="text"
            className={`${inputCls} py-1.5`}
            value={line}
            onChange={e => onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-slate-300 hover:text-red-500 transition shrink-0"
            title="ลบบรรทัด"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium pl-6"
      >
        + {addLabel}
      </button>
    </div>
  );
}

function StepCard({ index, step, onChange, onRemove }: { index: number; step: ApiStep; onChange: (step: ApiStep) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${STEP_COLORS[step.type]}`}>{step.type}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-slate-400 hover:text-red-500 transition">
          ลบ Step
        </button>
      </div>

      <div>
        <label className={labelCls}>Logic</label>
        <EditableList
          items={step.items}
          onChange={items => onChange({ ...step, items })}
          addLabel="เพิ่มบรรทัด"
        />
      </div>

      <div className="border-t border-slate-200 pt-3">
        <label className={`${labelCls} text-red-500`}>Error Handling</label>
        <EditableList
          items={step.errorHandling}
          onChange={errorHandling => onChange({ ...step, errorHandling })}
          addLabel="เพิ่ม Error Handling"
        />
      </div>
    </div>
  );
}

export default function ApiStepBuilder({ sampleData, onSampleDataChange, steps, onStepsChange }: ApiStepBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [newType, setNewType] = useState<StepType>('Filter');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        const parsed = JSON.parse(text);
        onSampleDataChange(JSON.stringify(parsed, null, 2));
        setFileName(file.name);
        setFileError('');
      } catch {
        setFileError('ไฟล์ที่เลือกไม่ใช่ JSON ที่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  }

  function handleAddStep() {
    onStepsChange([
      ...steps,
      {
        id: newStepId(),
        type: newType,
        items: [...STEP_TEMPLATES[newType]],
        errorHandling: [...DEFAULT_ERROR_HANDLING],
      },
    ]);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-slate-700">Step / Logic</h2>
        <p className="text-slate-400 text-xs mt-0.5">กำหนดลำดับการทำงานเมื่อมีการเรียกมายัง API เส้นนี้</p>
      </div>

      <div>
        <label className={labelCls}>Sample Data (JSON)</label>
        <p className="text-xs text-slate-400 mb-2">อัปโหลดไฟล์ JSON ตัวอย่างไว้อ้างอิงก่อนกำหนด Step</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium transition"
          >
            Browse File (JSON)
          </button>
          {fileName && <span className="text-xs text-slate-500 font-mono truncate">{fileName}</span>}
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
        {fileError && (
          <div className="mt-2 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100">{fileError}</div>
        )}
        <textarea
          className={`${inputCls} resize-none font-mono mt-2`}
          rows={5}
          placeholder="ยังไม่มีข้อมูลตัวอย่าง — Browse File หรือพิมพ์ JSON ที่นี่"
          value={sampleData}
          onChange={e => onSampleDataChange(e.target.value)}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className={labelCls}>เพิ่ม Step</label>
        <div className="flex items-center gap-2">
          <select className={inputCls} value={newType} onChange={e => setNewType(e.target.value as StepType)}>
            {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            type="button"
            onClick={handleAddStep}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shrink-0"
          >
            + เพิ่ม Step
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {steps.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">ยังไม่มี Step — เลือกประเภทด้านบนแล้วกด &ldquo;เพิ่ม Step&rdquo;</p>
        ) : (
          steps.map((step, i) => (
            <StepCard
              key={step.id}
              index={i}
              step={step}
              onChange={updated => onStepsChange(steps.map(s => (s.id === step.id ? updated : s)))}
              onRemove={() => onStepsChange(steps.filter(s => s.id !== step.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
