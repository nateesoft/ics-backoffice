'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import {
  FlowProject, FlowTemplate, CssFramework, SupportedLanguage, FrontendFramework, BackendFramework, DatabaseType, ThemeMode,
  CSS_FRAMEWORKS, SUPPORTED_LANGUAGES, FRONTEND_FRAMEWORKS, BACKEND_FRAMEWORKS, DATABASES, THEMES,
  CURRENCY_FORMATS, DATE_FORMATS,
} from '@/types/flowProject';
import { FLOW_TEMPLATES, getFlowTemplate } from '@/lib/flowTemplates';
import { FlowItemsStore } from '@/lib/flowItemsStore';
import { flowUiStore } from '@/lib/flowUiStore';
import LiveFormPreview from '@/components/flow-generate/ui-builder/LiveFormPreview';

interface NewProjectModalProps {
  store: FlowItemsStore;
  modalTitle?: string;
  onClose: () => void;
  onCreated: (project: FlowProject) => void;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

export default function NewProjectModal({ store, modalTitle = 'New Project', onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<FlowTemplate | null>(null);
  const [cssFramework, setCssFramework] = useState<CssFramework>('tailwind');
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(['en', 'th']);
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>('en');
  const [formatDate, setFormatDate] = useState(DATE_FORMATS[0]);
  const [currencyFormat, setCurrencyFormat] = useState('THB');
  const [frontendFramework, setFrontendFramework] = useState<FrontendFramework>('NextJS');
  const [backendFramework, setBackendFramework] = useState<BackendFramework>('NestJS');
  const [database, setDatabase] = useState<DatabaseType>('PostgreSQL');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<FlowProject | null>(null);

  const selectedTemplate = templateId ? getFlowTemplate(templateId) : null;

  function toggleLanguage(lang: SupportedLanguage) {
    setSupportedLanguages(prev => {
      const next = prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang];
      if (next.length === 0) return prev;
      if (!next.includes(defaultLanguage)) setDefaultLanguage(next[0]);
      return next;
    });
  }

  function handleSave() {
    if (!name.trim()) { setError('กรุณากรอกชื่อโปรเจค'); return; }
    if (!templateId) { setError('กรุณาเลือก Template'); return; }
    setError('');
    const project = store.create({
      name: name.trim(),
      description: description.trim(),
      templateId,
      cssFramework,
      supportedLanguages,
      defaultLanguage,
      formatDate,
      currencyFormat,
      frontendFramework,
      backendFramework,
      database,
      theme,
    });
    // Seed the project's Main Page UI with the template's app-shell content (if it has one) so
    // the user lands on ready-to-edit chrome instead of a blank canvas.
    if (selectedTemplate?.schema && selectedTemplate?.uiSchema) {
      flowUiStore.create({
        projectId: project.id,
        name: `${project.name} — Main Layout`,
        description: `สร้างจาก Template: ${selectedTemplate.name}`,
        uiType: 'Page',
        pageKind: 'Main Page',
        uiPath: '/',
        roles: [],
        schema: selectedTemplate.schema,
        uiSchema: selectedTemplate.uiSchema,
      });
    }
    setCreated(project);
  }

  if (created) {
    return (
      <Modal title="สร้างโปรเจคสำเร็จ" onClose={() => onCreated(created)} size="md">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            สร้างโปรเจค &ldquo;{created.name}&rdquo; สำเร็จแล้ว
          </p>
          <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อเข้าไปยังหน้ารายละเอียดโปรเจค</p>
          <button
            onClick={() => onCreated(created)}
            className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ไปยังหน้าโปรเจค
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={modalTitle} onClose={onClose} size={showTemplates ? 'xl' : 'md'}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Project ID</label>
          <input type="text" className={`${inputCls} bg-slate-50 text-slate-400`} value="จะถูกสร้างอัตโนมัติ (UUID)" disabled />
        </div>

        <div>
          <label className={labelCls}>ชื่อโปรเจค</label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น Inventory Management"
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="อธิบายรายละเอียดโปรเจค..."
          />
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Project Configuration</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CSS Framework</label>
              <select className={inputCls} value={cssFramework} onChange={e => setCssFramework(e.target.value as CssFramework)}>
                {CSS_FRAMEWORKS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Theme</label>
              <select className={inputCls} value={theme} onChange={e => setTheme(e.target.value as ThemeMode)}>
                {THEMES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Frontend Framework</label>
              <select className={inputCls} value={frontendFramework} onChange={e => setFrontendFramework(e.target.value as FrontendFramework)}>
                {FRONTEND_FRAMEWORKS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Backend Framework</label>
              <select className={inputCls} value={backendFramework} onChange={e => setBackendFramework(e.target.value as BackendFramework)}>
                {BACKEND_FRAMEWORKS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Database</label>
              <select className={inputCls} value={database} onChange={e => setDatabase(e.target.value as DatabaseType)}>
                {DATABASES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Currency Format</label>
              <select className={inputCls} value={currencyFormat} onChange={e => setCurrencyFormat(e.target.value)}>
                {CURRENCY_FORMATS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Date Format</label>
              <select className={inputCls} value={formatDate} onChange={e => setFormatDate(e.target.value)}>
                {DATE_FORMATS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelCls}>Supported Languages</label>
            <div className="flex items-center gap-4">
              {SUPPORTED_LANGUAGES.map(lang => (
                <label key={lang} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input type="checkbox" checked={supportedLanguages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                  {lang}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className={labelCls}>Default Language</label>
            <select className={inputCls} value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value as SupportedLanguage)}>
              {supportedLanguages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Template สำหรับ Clone</label>
          <div className="flex items-center gap-2">
            <div className={`${inputCls} bg-slate-50 flex-1 truncate`}>
              {selectedTemplate ? (
                <span className="text-slate-700">{selectedTemplate.name} <span className="text-slate-400">({selectedTemplate.templateId})</span></span>
              ) : (
                <span className="text-slate-400">ยังไม่ได้เลือก Template</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(v => {
                const next = !v;
                if (next) setPreviewTemplate(selectedTemplate ?? FLOW_TEMPLATES[0]);
                return next;
              })}
              className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition flex-shrink-0"
            >
              Browse
            </button>
          </div>

          {showTemplates && (
            <div className="mt-2 border border-slate-200 rounded-lg grid grid-cols-2 overflow-hidden">
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto border-r border-slate-200">
                {FLOW_TEMPLATES.map(t => (
                  <button
                    key={t.templateId}
                    type="button"
                    onMouseEnter={() => setPreviewTemplate(t)}
                    onFocus={() => setPreviewTemplate(t)}
                    onClick={() => { setTemplateId(t.templateId); setShowTemplates(false); }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition ${templateId === t.templateId ? 'bg-indigo-50' : ''} ${previewTemplate?.templateId === t.templateId ? 'bg-indigo-50/60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${templateId === t.templateId ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                      <span className="text-sm font-medium text-slate-800">{t.name}</span>
                      <span className="text-xs text-slate-400">{t.templateId}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-4">{t.description}</p>
                  </button>
                ))}
              </div>
              <div className="max-h-80 overflow-y-auto p-3 bg-slate-50">
                {previewTemplate ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800">{previewTemplate.name}</p>
                    <p className="text-xs text-slate-400 mb-2">Preview</p>
                    {previewTemplate.schema && previewTemplate.uiSchema ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-100 overflow-hidden" style={{ height: 300 }}>
                        <div className="pointer-events-none origin-top-left" style={{ transform: 'scale(0.42)', width: '238%' }}>
                          <LiveFormPreview schema={previewTemplate.schema} uiSchema={previewTemplate.uiSchema} data={{}} onDataChange={() => {}} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-10">
                        Template นี้ไม่มี Layout ให้ดูตัวอย่าง (เป็น template สำหรับ CRUD workflow)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-10">เลื่อนเมาส์ไปที่ template เพื่อดูตัวอย่าง</p>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
}
