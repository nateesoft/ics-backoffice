'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import {
  FlowProject, CssFramework, SupportedLanguage, FrontendFramework, BackendFramework, DatabaseType, ThemeMode,
  CSS_FRAMEWORKS, SUPPORTED_LANGUAGES, FRONTEND_FRAMEWORKS, BACKEND_FRAMEWORKS, DATABASES, THEMES,
  CURRENCY_FORMATS, DATE_FORMATS,
} from '@/types/flowProject';
import { getFlowTemplate } from '@/lib/flowTemplates';
import { FlowItemsStore } from '@/lib/flowItemsStore';

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

interface ProjectSettingsModalProps {
  project: FlowProject;
  store: FlowItemsStore;
  onClose: () => void;
  onSaved: (updated: FlowProject) => void;
}

export default function ProjectSettingsModal({ project, store, onClose, onSaved }: ProjectSettingsModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [cssFramework, setCssFramework] = useState<CssFramework>(project.cssFramework);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(project.supportedLanguages);
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>(project.defaultLanguage);
  const [formatDate, setFormatDate] = useState(project.formatDate);
  const [currencyFormat, setCurrencyFormat] = useState(project.currencyFormat);
  const [frontendFramework, setFrontendFramework] = useState<FrontendFramework>(project.frontendFramework);
  const [backendFramework, setBackendFramework] = useState<BackendFramework>(project.backendFramework);
  const [database, setDatabase] = useState<DatabaseType>(project.database);
  const [theme, setTheme] = useState<ThemeMode>(project.theme);

  const template = getFlowTemplate(project.templateId);

  function toggleLanguage(lang: SupportedLanguage) {
    setSupportedLanguages(prev => {
      const next = prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang];
      if (next.length === 0) return prev;
      if (!next.includes(defaultLanguage)) setDefaultLanguage(next[0]);
      return next;
    });
  }

  function handleSave() {
    if (!name.trim()) return;
    const updated = store.update(project.id, {
      name: name.trim(),
      description: description.trim(),
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
    if (updated) onSaved(updated);
  }

  return (
    <Modal title="ตั้งค่าโปรเจค" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>ชื่อโปรเจค</label>
          <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
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
          <label className={labelCls}>Template ที่ Clone มา</label>
          <div className="px-3 py-2 rounded-lg border border-slate-100 bg-slate-50">
            <p className="text-sm font-medium text-slate-700">{template ? template.name : project.templateId}</p>
            {template && <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
}
