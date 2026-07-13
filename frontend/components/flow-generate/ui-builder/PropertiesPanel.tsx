'use client';
import { useState } from 'react';
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiActionStep, UiSchemaNode } from '@/types/flowUi';
import ActionPickerModal from './ActionPickerModal';
import ActionStepsEditor from './ActionStepsEditor';
import { isContainer } from './treeOps';

interface PropertiesPanelProps {
  schema: JsonSchema7;
  node: UiSchemaNode;
  projectId?: string;
  excludeUiId?: string;
  isMainPage?: boolean;
  isContentSlot?: boolean;
  onToggleContentSlot?: (next: boolean) => void;
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

export default function PropertiesPanel({ schema, node, projectId, excludeUiId, isMainPage, isContentSlot, onToggleContentSlot, onSchemaChange, onUpdateNode }: PropertiesPanelProps) {
  const [actionPickerOpen, setActionPickerOpen] = useState(false);
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
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(node.options?.onChangeSteps)}
                    onChange={e => onUpdateNode(n => {
                      n.options = { ...n.options };
                      if (e.target.checked) n.options.onChangeSteps = [];
                      else delete n.options.onChangeSteps;
                    })}
                  />
                  เปิดใช้ Action เมื่อเปลี่ยนค่า (onChange)
                </label>
                {Boolean(node.options?.onChangeSteps) && (
                  <div className="mt-2">
                    <ActionStepsEditor
                      steps={(node.options?.onChangeSteps as UiActionStep[]) ?? []}
                      projectId={projectId}
                      excludeUiId={excludeUiId}
                      onChange={steps => onUpdateNode(n => { n.options = { ...n.options, onChangeSteps: steps }; })}
                    />
                  </div>
                )}
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
              onChange={e => updateOption('type', e.target.value === 'button' ? undefined : e.target.value)}
            >
              <option value="button">Button</option>
              <option value="file">File</option>
              <option value="action">Action</option>
            </select>
          </div>

          {node.options?.type === 'action' && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Action Mode</label>
                <select
                  className={inputCls}
                  value={(node.options?.actionMode as string) === 'steps' ? 'steps' : 'api'}
                  onChange={e => updateOption('actionMode', e.target.value === 'steps' ? 'steps' : undefined)}
                >
                  <option value="api">Single API Call</option>
                  <option value="steps">Step Sequence</option>
                </select>
              </div>

              {node.options?.actionMode === 'steps' ? (
                <ActionStepsEditor
                  steps={(node.options?.actionSteps as UiActionStep[]) ?? []}
                  projectId={projectId}
                  excludeUiId={excludeUiId}
                  onChange={steps => onUpdateNode(n => { n.options = { ...n.options, actionSteps: steps }; })}
                />
              ) : (
                <div>
                  <label className={labelCls}>Action</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      className={`${inputCls} font-mono flex-1`}
                      value={(node.options?.action as string) ?? ''}
                      onChange={e => updateOption('action', e.target.value || undefined)}
                      placeholder="${ServiceName:methodName}"
                    />
                    <button
                      type="button"
                      onClick={() => setActionPickerOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition whitespace-nowrap"
                    >
                      Browse
                    </button>
                  </div>
                  {actionPickerOpen && (
                    <ActionPickerModal
                      projectId={projectId}
                      onClose={() => setActionPickerOpen(false)}
                      onSelect={api => {
                        updateOption('action', `\${${api.name}}`);
                        setActionPickerOpen(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
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

      {isMainPage && isContainer(node) && onToggleContentSlot && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <p className={sectionHeadingCls}>Content Slot</p>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(isContentSlot)}
              onChange={e => onToggleContentSlot(e.target.checked)}
            />
            ใช้เป็นจุดแสดง Content ตาม Route (Content Slot)
          </label>
          <p className="text-[11px] text-slate-400">
            พื้นที่นี้จะถูกแทนที่ด้วย Content ของ Page ที่ route ไปตาม uiPath — เลือกได้ทีละจุดเท่านั้น
          </p>
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
