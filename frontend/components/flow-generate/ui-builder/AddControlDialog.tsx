'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { JsonSchema7 } from '@jsonforms/core';

export type ControlPreset = 'field' | 'checkbox' | 'select' | 'radio';

interface AddControlDialogProps {
  schema: JsonSchema7;
  preset?: ControlPreset;
  onCancel: () => void;
  onConfirm: (result: { scope: string; label: string; schema: JsonSchema7; options?: Record<string, unknown> }) => void;
}

const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Checkbox' },
];

const TITLES: Record<ControlPreset, string> = {
  field: 'เพิ่ม Field',
  checkbox: 'เพิ่ม Checkbox',
  select: 'เพิ่ม Select Box',
  radio: 'เพิ่ม Radio',
};

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

function isCompatible(prop: JsonSchema7 | undefined, preset: ControlPreset): boolean {
  if (!prop) return false;
  if (preset === 'checkbox') return prop.type === 'boolean';
  if (preset === 'select' || preset === 'radio') return Array.isArray(prop.enum);
  return true;
}

export default function AddControlDialog({ schema, preset = 'field', onCancel, onConfirm }: AddControlDialogProps) {
  const properties = schema.properties ?? {};
  const propertyKeys = Object.keys(properties).filter(key => isCompatible(properties[key], preset));
  const [mode, setMode] = useState<'existing' | 'new'>(propertyKeys.length > 0 ? 'existing' : 'new');
  const [selectedKey, setSelectedKey] = useState(propertyKeys[0] ?? '');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('string');
  const [newTitle, setNewTitle] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [error, setError] = useState('');

  const needsOptions = preset === 'select' || preset === 'radio';
  const controlOptions = preset === 'radio' ? { format: 'radio' } : undefined;

  function handleConfirm() {
    if (mode === 'existing') {
      if (!selectedKey) { setError('กรุณาเลือก field'); return; }
      const prop = properties[selectedKey];
      const label = (prop && typeof prop === 'object' && prop.title) ? prop.title : selectedKey;
      onConfirm({ scope: `#/properties/${selectedKey}`, label, schema, options: controlOptions });
      return;
    }

    const name = newName.trim();
    if (!name) { setError('กรุณากรอกชื่อ field'); return; }
    if (properties[name]) { setError('มีชื่อ field นี้อยู่แล้ว'); return; }

    let propSchema: JsonSchema7;
    if (preset === 'checkbox') {
      propSchema = { type: 'boolean', ...(newTitle.trim() ? { title: newTitle.trim() } : {}) };
    } else if (needsOptions) {
      const opts = optionsText.split(',').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) { setError('กรุณากรอกตัวเลือกอย่างน้อย 2 รายการ คั่นด้วย comma'); return; }
      propSchema = { type: 'string', enum: opts, ...(newTitle.trim() ? { title: newTitle.trim() } : {}) };
    } else {
      propSchema = { type: newType, ...(newTitle.trim() ? { title: newTitle.trim() } : {}) };
    }

    const updatedSchema: JsonSchema7 = {
      ...schema,
      type: schema.type ?? 'object',
      properties: { ...properties, [name]: propSchema },
    };
    onConfirm({ scope: `#/properties/${name}`, label: newTitle.trim() || name, schema: updatedSchema, options: controlOptions });
  }

  return (
    <Modal title={TITLES[preset]} onClose={onCancel} size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('existing')}
            disabled={propertyKeys.length === 0}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${mode === 'existing' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            ใช้ field ที่มีอยู่
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${mode === 'new' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            + สร้าง field ใหม่
          </button>
        </div>

        {mode === 'existing' ? (
          <div>
            <label className={labelCls}>Field (schema property)</label>
            <select className={inputCls} value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
              {propertyKeys.map(key => <option key={key} value={key}>{key}</option>)}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>ชื่อ Field (property key)</label>
              <input type="text" className={`${inputCls} font-mono`} value={newName} onChange={e => setNewName(e.target.value)} placeholder="เช่น firstName" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Label</label>
              <input type="text" className={inputCls} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="เช่น First Name" />
            </div>

            {preset === 'field' && (
              <div>
                <label className={labelCls}>ประเภทข้อมูล</label>
                <select className={inputCls} value={newType} onChange={e => setNewType(e.target.value)}>
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}

            {needsOptions && (
              <div>
                <label className={labelCls}>ตัวเลือก (คั่นด้วย comma)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={optionsText}
                  onChange={e => setOptionsText(e.target.value)}
                  placeholder="เช่น Option A, Option B, Option C"
                />
              </div>
            )}
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>}

        <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">ยกเลิก</button>
          <button type="button" onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">เพิ่ม</button>
        </div>
      </div>
    </Modal>
  );
}
