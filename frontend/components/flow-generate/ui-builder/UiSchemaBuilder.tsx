'use client';
import { useMemo, useState } from 'react';
import type { JsonSchema7 } from '@jsonforms/core';
import type { PageKind, UiSchemaNode, UiType } from '@/types/flowUi';
import { flowUiStore } from '@/lib/flowUiStore';
import Modal from '@/components/ui/Modal';
import JsonTextEditor from './JsonTextEditor';
import BuilderCanvas from './BuilderCanvas';
import LiveFormPreview from './LiveFormPreview';
import { composePageIntoMainLayout } from './composePreview';

interface UiSchemaBuilderProps {
  name: string;
  uiType: UiType;
  pageKind: PageKind | null;
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  projectId?: string;
  currentUiId?: string;
  onSchemaChange: (schema: JsonSchema7) => void;
  onUiSchemaChange: (uiSchema: UiSchemaNode) => void;
  onDataChange: (data: Record<string, unknown>) => void;
}

type TabKey = 'preview' | 'schema' | 'uischema' | 'data';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'preview', label: 'Preview' },
  { key: 'schema', label: 'Schema' },
  { key: 'uischema', label: 'UISchema' },
  { key: 'data', label: 'Data' },
];

export default function UiSchemaBuilder({ name, uiType, pageKind, schema, uiSchema, data, projectId, currentUiId, onSchemaChange, onUiSchemaChange, onDataChange }: UiSchemaBuilderProps) {
  const [tab, setTab] = useState<TabKey>('preview');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showInMainLayout, setShowInMainLayout] = useState(true);
  // Independent from the page's own `data` — editing the composed preview (which also carries the
  // Main Page's own fields) shouldn't write back into this page's persisted data.
  const [composedData, setComposedData] = useState<Record<string, unknown>>({});

  // Only a Page Content UI can be embedded into a sibling Main Page for preview — a Main Page
  // previewing itself, or a Component, has nothing to compose into.
  const mainPage = useMemo(() => {
    if (!projectId || uiType !== 'Page' || pageKind !== 'Page Content') return null;
    return flowUiStore.getByProjectId(projectId).find(u => u.uiType === 'Page' && u.pageKind === 'Main Page' && u.id !== currentUiId) ?? null;
  }, [projectId, uiType, pageKind, currentUiId]);

  const composed = useMemo(() => {
    if (!mainPage) return null;
    return composePageIntoMainLayout(
      { schema: mainPage.schema, uiSchema: mainPage.uiSchema, data: mainPage.data, name: mainPage.name },
      { schema, uiSchema, data, name }
    );
  }, [mainPage, schema, uiSchema, data, name]);

  function openPreview() {
    if (composed) setComposedData(composed.data);
    setPreviewOpen(true);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-2">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'preview' && (
          <button
            type="button"
            onClick={openPreview}
            className="mr-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Preview
          </button>
        )}
      </div>

      <div className="p-5">
        {tab === 'preview' && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">โครงสร้าง UI Schema</h3>
            <BuilderCanvas schema={schema} uiSchema={uiSchema} projectId={projectId} currentUiId={currentUiId} onSchemaChange={onSchemaChange} onUiSchemaChange={onUiSchemaChange} />
          </div>
        )}

        {tab === 'schema' && (
          <div>
            <p className="text-xs text-slate-400 mb-2">JSON Schema — กำหนดโครงสร้างข้อมูล (properties/types) อ้างอิงจาก jsonforms.io</p>
            <JsonTextEditor value={schema} onChange={onSchemaChange} />
          </div>
        )}

        {tab === 'uischema' && (
          <div>
            <p className="text-xs text-slate-400 mb-2">UI Schema — กำหนด layout และการเรียงลำดับ element ของฟอร์ม (แก้ไขแบบ visual ได้ที่แท็บ Preview)</p>
            <JsonTextEditor value={uiSchema} onChange={onUiSchemaChange} />
          </div>
        )}

        {tab === 'data' && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Data — ค่าปัจจุบันของฟอร์ม (sync กับการกรอกข้อมูลในแท็บ Preview)</p>
            <JsonTextEditor value={data} onChange={onDataChange} />
          </div>
        )}
      </div>

      {previewOpen && (
        <Modal
          title="ตัวอย่างฟอร์ม"
          onClose={() => setPreviewOpen(false)}
          size="lg"
          allowFullscreen
          action={composed && (
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mr-1 cursor-pointer select-none">
              <input type="checkbox" checked={showInMainLayout} onChange={e => setShowInMainLayout(e.target.checked)} />
              แสดงใน Main Template
            </label>
          )}
        >
          {composed && showInMainLayout ? (
            <LiveFormPreview schema={composed.schema} uiSchema={composed.uiSchema} data={composedData} onDataChange={setComposedData} />
          ) : (
            <LiveFormPreview schema={schema} uiSchema={uiSchema} data={data} onDataChange={onDataChange} />
          )}
        </Modal>
      )}
    </div>
  );
}
