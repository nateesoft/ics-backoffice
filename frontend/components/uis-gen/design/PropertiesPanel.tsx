'use client';
// Forked from components/flow-generate/ui-builder/PropertiesPanel.tsx: same Control/Group/Label/
// Button/layout/style editing, minus the Main-Page "Content Slot" toggle (UIs Gen's content
// region is plain React chrome — see ShellFrame.tsx — not something marked inside a page's own
// design), and the Button action editor always runs in "Step Sequence" mode against this
// project's own sitemap targets (no "Single API Call" mode — UIs Gen has no APIs Gen wiring).
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import type { UisGenActionStep } from '@/types/uisGen';
import ActionStepsEditor, { ActionTarget } from './ActionStepsEditor';

interface PropertiesPanelProps {
  schema: JsonSchema7;
  node: UiSchemaNode;
  targets: ActionTarget[];
  onSchemaChange: (schema: JsonSchema7) => void;
  onUpdateNode: (updater: (node: UiSchemaNode) => void) => void;
}

const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white";
const labelCls = "block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const sectionHeadingCls = "text-[10px] font-semibold text-slate-400 uppercase tracking-wide";

const FLEX_CONTAINER_TYPES = ['Group', 'HorizontalLayout', 'VerticalLayout', 'Card', 'Paper', 'Box'];
const DEFAULT_DIRECTION: Record<string, 'row' | 'column'> = {
  HorizontalLayout: 'row',
  VerticalLayout: 'column',
  Group: 'column',
  Card: 'column',
  Paper: 'column',
  Box: 'column',
};

function propKeyFromScope(scope?: string): string | undefined {
  return scope?.startsWith('#/properties/') ? scope.slice('#/properties/'.length) : undefined;
}

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

function parseCssText(text: string): Record<string, string> | undefined {
  const entries = text.split(';').map(s => s.trim()).filter(Boolean).map((pair): [string, string] | null => {
    const idx = pair.indexOf(':');
    if (idx === -1) return null;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!key || !value) return null;
    return [kebabToCamel(key), value];
  }).filter((e): e is [string, string] => e !== null);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function styleObjectToCssText(style: unknown): string {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style as Record<string, string>).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n');
}

export default function PropertiesPanel({ schema, node, targets, onSchemaChange, onUpdateNode }: PropertiesPanelProps) {
  const propKey = node.type === 'Control' ? propKeyFromScope(node.scope) : undefined;
  const prop = propKey ? schema.properties?.[propKey] : undefined;
  const isEnum = Boolean(prop && Array.isArray(prop.enum));
  const isBoolean = prop?.type === 'boolean';
  const isArray = prop?.type === 'array';
  const isPlainStringInput = prop?.type === 'string' && !isEnum && prop?.format !== 'date' && !node.options?.multi;
  const required = Boolean(propKey && (schema.required ?? []).includes(propKey));
  const isFlexContainer = FLEX_CONTAINER_TYPES.includes(node.type);

  function updateProp(patch: Partial<JsonSchema7>) {
    if (!propKey) return;
    onSchemaChange({
      ...schema,
      properties: { ...schema.properties, [propKey]: { ...schema.properties?.[propKey], ...patch } },
    });
  }

  function toggleRequired() {
    if (!propKey) return;
    const current = schema.required ?? [];
    const next = required ? current.filter(k => k !== propKey) : [...current, propKey];
    onSchemaChange({ ...schema, required: next });
  }

  function updateOption(key: string, value: unknown) {
    onUpdateNode(n => { n.options = { ...n.options, [key]: value }; });
  }

  return (
    <div className="space-y-4">
      {node.type === 'Control' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Label</label>
            <input type="text" className={inputCls} value={node.label ?? ''} onChange={e => onUpdateNode(n => { n.label = e.target.value; })} />
          </div>
          <div>
            <label className={labelCls}>Scope</label>
            <input type="text" disabled className={`${inputCls} font-mono bg-slate-50 text-slate-400`} value={node.scope ?? ''} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={prop?.description ?? ''}
              onChange={e => updateProp({ description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={required} onChange={toggleRequired} />
            จำเป็นต้องกรอก (required)
          </label>

          {isEnum && (
            <>
              <div>
                <label className={labelCls}>ตัวเลือก (คั่นด้วย comma)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={(prop?.enum ?? []).join(', ')}
                  onChange={e => updateProp({ enum: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <label className={labelCls}>แสดงเป็น</label>
                <select
                  className={inputCls}
                  value={node.options?.format === 'radio' ? 'radio' : 'select'}
                  onChange={e => onUpdateNode(n => { n.options = { ...n.options, format: e.target.value === 'radio' ? 'radio' : undefined }; })}
                >
                  <option value="select">Select Box</option>
                  <option value="radio">Radio</option>
                </select>
              </div>
            </>
          )}

          {isPlainStringInput && (
            <div>
              <label className={labelCls}>Type</label>
              <select
                className={inputCls}
                value={(node.options?.inputType as string) ?? 'text'}
                onChange={e => updateOption('inputType', e.target.value === 'text' ? undefined : e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="password">Password</option>
              </select>
            </div>
          )}

          {isBoolean && (
            <p className="text-[11px] text-slate-400">แสดงเป็น checkbox โดยอัตโนมัติ (type: boolean)</p>
          )}
          {isArray && (
            <p className="text-[11px] text-slate-400">แสดงเป็นตาราง — แก้ไข column ได้จากแท็บ Schema</p>
          )}
        </div>
      )}

      {(node.type === 'Group' || node.type === 'Card' || node.type === 'Paper' || node.type === 'Box') && (
        <div>
          <label className={labelCls}>{node.type} Label</label>
          <input type="text" className={inputCls} value={node.label ?? ''} onChange={e => onUpdateNode(n => { n.label = e.target.value; })} />
        </div>
      )}

      {node.type === 'Label' && (
        <div>
          <label className={labelCls}>Text</label>
          <input type="text" className={inputCls} value={node.text ?? ''} onChange={e => onUpdateNode(n => { n.text = e.target.value; })} />
        </div>
      )}

      {node.type === 'InitialLoad' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            ทำงานอัตโนมัติครั้งเดียวตอนหน้านี้โหลดเสร็จ (ไม่ต้องกดปุ่ม) — ใช้สำหรับดึงข้อมูลเริ่มต้นให้หน้านี้
          </p>
          <ActionStepsEditor
            steps={(node.options?.actionSteps as UisGenActionStep[]) ?? []}
            targets={targets}
            onChange={steps => onUpdateNode(n => { n.options = { ...n.options, actionSteps: steps }; })}
          />
        </div>
      )}

      {node.type === 'Button' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Text</label>
            <input type="text" className={inputCls} value={node.text ?? ''} onChange={e => onUpdateNode(n => { n.text = e.target.value; })} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select
              className={inputCls}
              value={(node.options?.type as string) ?? 'button'}
              onChange={e => onUpdateNode(n => {
                const nextType = e.target.value === 'button' ? undefined : e.target.value;
                n.options = { ...n.options, type: nextType, ...(nextType === 'action' ? { actionMode: 'steps' } : {}) };
              })}
            >
              <option value="button">Button</option>
              <option value="file">File</option>
              <option value="action">Action</option>
              <option value="reset">Reset</option>
            </select>
          </div>

          {node.options?.type === 'action' && (
            <ActionStepsEditor
              steps={(node.options?.actionSteps as UisGenActionStep[]) ?? []}
              targets={targets}
              onChange={steps => onUpdateNode(n => { n.options = { ...n.options, actionMode: 'steps', actionSteps: steps }; })}
            />
          )}

          <div>
            <label className={labelCls}>Style</label>
            <select
              className={inputCls}
              value={node.options?.variant === 'secondary' ? 'secondary' : 'primary'}
              onChange={e => onUpdateNode(n => { n.options = { ...n.options, variant: e.target.value }; })}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        </div>
      )}

      {node.type === 'Categorization' && (
        <p className="text-xs text-slate-400">จัดการแท็บได้จากผัง builder โดยตรง (แก้ชื่อ/เพิ่ม/ลบแท็บ)</p>
      )}

      {node.type === 'Grid' && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <p className={sectionHeadingCls}>Grid Layout</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Columns</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={(node.options?.columns as number) ?? 2}
                onChange={e => updateOption('columns', Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div>
              <label className={labelCls}>Rows</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={(node.options?.rows as number) ?? ''}
                onChange={e => updateOption('rows', e.target.value ? Math.max(1, Number(e.target.value)) : undefined)}
                placeholder="อัตโนมัติ"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>ระยะห่างระหว่าง element (Gap, px)</label>
            <input
              type="number"
              className={inputCls}
              value={(node.options?.gap as number) ?? ''}
              onChange={e => updateOption('gap', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ค่าเริ่มต้นจากธีม"
            />
          </div>
        </div>
      )}

      {isFlexContainer && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <p className={sectionHeadingCls}>Layout</p>
          <div>
            <label className={labelCls}>ทิศทาง (Direction)</label>
            <select
              className={inputCls}
              value={(node.options?.flexDirection as string) ?? DEFAULT_DIRECTION[node.type]}
              onChange={e => updateOption('flexDirection', e.target.value)}
            >
              <option value="row">แนวนอน (Row)</option>
              <option value="column">แนวตั้ง (Column)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>จัดตำแหน่งตามขวาง (Align items)</label>
            <select
              className={inputCls}
              value={(node.options?.alignItems as string) ?? ''}
              onChange={e => updateOption('alignItems', e.target.value || undefined)}
            >
              <option value="">ค่าเริ่มต้น</option>
              <option value="flex-start">บน / ซ้าย (Start)</option>
              <option value="center">กึ่งกลาง (Middle)</option>
              <option value="flex-end">ล่าง / ขวา (End)</option>
              <option value="stretch">ยืดเต็ม (Stretch)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>จัดระยะตามแนวหลัก (Justify content)</label>
            <select
              className={inputCls}
              value={(node.options?.justifyContent as string) ?? ''}
              onChange={e => updateOption('justifyContent', e.target.value || undefined)}
            >
              <option value="">ค่าเริ่มต้น</option>
              <option value="flex-start">ชิดต้น (Start)</option>
              <option value="center">กึ่งกลาง (Center)</option>
              <option value="flex-end">ชิดท้าย (End)</option>
              <option value="space-between">เว้นระยะเท่ากัน (Space Between)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>ระยะห่างระหว่าง element (Gap, px)</label>
            <input
              type="number"
              className={inputCls}
              value={(node.options?.gap as number) ?? ''}
              onChange={e => updateOption('gap', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ค่าเริ่มต้นจากธีม"
            />
          </div>
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-slate-100">
        <p className={sectionHeadingCls}>Custom Style</p>
        <div>
          <label className={labelCls}>CSS Class</label>
          <input
            type="text"
            className={`${inputCls} font-mono`}
            value={(node.options?.className as string) ?? ''}
            onChange={e => updateOption('className', e.target.value || undefined)}
            placeholder="เช่น my-custom-class"
          />
        </div>
        <div>
          <label className={labelCls}>Inline Style (CSS)</label>
          <textarea
            className={`${inputCls} font-mono resize-none`}
            rows={3}
            defaultValue={styleObjectToCssText(node.options?.style)}
            onBlur={e => updateOption('style', parseCssText(e.target.value))}
            placeholder={'color: #4f46e5;\nfont-weight: bold;'}
          />
        </div>
      </div>
    </div>
  );
}
