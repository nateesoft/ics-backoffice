'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { JsonSchema7 } from '@jsonforms/core';

interface AddTableDialogProps {
  schema: JsonSchema7;
  onCancel: () => void;
  onConfirm: (result: { scope: string; label: string; schema: JsonSchema7 }) => void;
}

const COLUMN_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Checkbox' },
];

interface ColumnDraft {
  key: string;
  title: string;
  type: string;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

function isTableProperty(prop: JsonSchema7 | undefined): boolean {
  if (!prop || prop.type !== 'array') return false;
  const items = prop.items;
  return !!items && !Array.isArray(items) && items.type === 'object';
}

export default function AddTableDialog({ schema, onCancel, onConfirm }: AddTableDialogProps) {
  const properties = schema.properties ?? {};
  const propertyKeys = Object.keys(properties).filter(key => isTableProperty(properties[key]));
  const [mode, setMode] = useState<'existing' | 'new'>(propertyKeys.length > 0 ? 'existing' : 'new');
  const [selectedKey, setSelectedKey] = useState(propertyKeys[0] ?? '');
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [columns, setColumns] = useState<ColumnDraft[]>([
    { key: 'name', title: 'Name', type: 'string' },
    { key: 'quantity', title: 'Quantity', type: 'number' },
  ]);
  const [error, setError] = useState('');

  function updateColumn(index: number, patch: Partial<ColumnDraft>) {
    setColumns(cols => cols.map((c, i) => i === index ? { ...c, ...patch } : c));
  }

  function addColumn() {
    setColumns(cols => [...cols, { key: '', title: '', type: 'string' }]);
  }

  function removeColumn(index: number) {
    setColumns(cols => cols.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (mode === 'existing') {
      if (!selectedKey) { setError('กรุณาเลือก field'); return; }
      const prop = properties[selectedKey];
      const label = (prop && typeof prop === 'object' && prop.title) ? prop.title : selectedKey;
      onConfirm({ scope: `#/properties/${selectedKey}`, label, schema });
      return;
    }

    const name = newName.trim();
    if (!name) { setError('กรุณากรอกชื่อ field'); return; }
    if (properties[name]) { setError('มีชื่อ field นี้อยู่แล้ว'); return; }
    const trimmedColumns = columns.map(c => ({ ...c, key: c.key.trim(), title: c.title.trim() }));
    if (trimmedColumns.length === 0 || trimmedColumns.some(c => !c.key)) {
      setError('กรุณากรอกชื่อ column อย่างน้อย 1 รายการ');
      return;
    }

    const itemProperties: Record<string, JsonSchema7> = {};
    for (const col of trimmedColumns) {
      itemProperties[col.key] = { type: col.type, ...(col.title ? { title: col.title } : {}) };
    }

    const updatedSchema: JsonSchema7 = {
      ...schema,
      type: schema.type ?? 'object',
      properties: {
        ...properties,
        [name]: {
          type: 'array',
          ...(newTitle.trim() ? { title: newTitle.trim() } : {}),
          items: { type: 'object', properties: itemProperties },
        },
      },
    };
    onConfirm({ scope: `#/properties/${name}`, label: newTitle.trim() || name, schema: updatedSchema });
  }

  return (
    <Modal title="เพิ่ม Table" onClose={onCancel} size="md">
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
            + สร้าง table ใหม่
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
              <input type="text" className={`${inputCls} font-mono`} value={newName} onChange={e => setNewName(e.target.value)} placeholder="เช่น items" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Label</label>
              <input type="text" className={inputCls} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="เช่น Line Items" />
            </div>

            <div>
              <label className={labelCls}>Columns</label>
              <div className="space-y-2">
                {columns.map((col, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className={`${inputCls} font-mono`}
                      value={col.key}
                      onChange={e => updateColumn(i, { key: e.target.value })}
                      placeholder="key"
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={col.title}
                      onChange={e => updateColumn(i, { title: e.target.value })}
                      placeholder="Label"
                    />
                    <select className={`${inputCls} w-28 flex-shrink-0`} value={col.type} onChange={e => updateColumn(i, { type: e.target.value })}>
                      {COLUMN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeColumn(i)}
                      className="text-slate-400 hover:text-red-600 px-1 text-sm leading-none flex-shrink-0"
                      title="ลบ column"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addColumn}
                className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                + เพิ่ม column
              </button>
            </div>
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
