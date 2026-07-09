'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import {
  FlowProject, CssFramework, SupportedLanguage, FrontendFramework, BackendFramework, DatabaseType, ThemeMode,
  CSS_FRAMEWORKS, SUPPORTED_LANGUAGES, FRONTEND_FRAMEWORKS, BACKEND_FRAMEWORKS, DATABASES, THEMES,
  CURRENCY_FORMATS, DATE_FORMATS,
} from '@/types/flowProject';
import { getFlowTemplate } from '@/lib/flowTemplates';
import { FlowItemsStore } from '@/lib/flowItemsStore';

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FlowItemDetailPageProps {
  store: FlowItemsStore;
  basePath: string;
  breadcrumbBase: BreadcrumbItem[];
  pageTitle?: string;
}

export default function FlowItemDetailPage({
  store,
  basePath,
  breadcrumbBase,
  pageTitle = 'แก้ไขรายละเอียดโปรเจค',
}: FlowItemDetailPageProps) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FlowProject | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cssFramework, setCssFramework] = useState<CssFramework>('tailwind');
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(['en', 'th']);
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>('en');
  const [formatDate, setFormatDate] = useState(DATE_FORMATS[0]);
  const [currencyFormat, setCurrencyFormat] = useState('THB');
  const [frontendFramework, setFrontendFramework] = useState<FrontendFramework>('NextJS');
  const [backendFramework, setBackendFramework] = useState<BackendFramework>('NestJS');
  const [database, setDatabase] = useState<DatabaseType>('PostgreSQL');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = store.getById(params.id);
    setProject(p);
    if (p) {
      setName(p.name);
      setDescription(p.description);
      setCssFramework(p.cssFramework);
      setSupportedLanguages(p.supportedLanguages);
      setDefaultLanguage(p.defaultLanguage);
      setFormatDate(p.formatDate);
      setCurrencyFormat(p.currencyFormat);
      setFrontendFramework(p.frontendFramework);
      setBackendFramework(p.backendFramework);
      setDatabase(p.database);
      setTheme(p.theme);
    }
  }, [store, params.id]);

  function toggleLanguage(lang: SupportedLanguage) {
    setSupportedLanguages(prev => {
      const next = prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang];
      if (next.length === 0) return prev;
      if (!next.includes(defaultLanguage)) setDefaultLanguage(next[0]);
      return next;
    });
  }

  function handleSave() {
    if (!project || !name.trim()) return;
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
    if (updated) {
      setProject(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  if (project === undefined) return null;

  if (project === null) {
    return (
      <div className="space-y-5">
        <FlowBreadcrumb items={[...breadcrumbBase, { label: 'Not Found' }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">ไม่พบโปรเจคนี้</h2>
          <button
            onClick={() => router.push(basePath)}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            กลับไปหน้ารายการโปรเจค
          </button>
        </div>
      </div>
    );
  }

  const template = getFlowTemplate(project.templateId);

  return (
    <div className="space-y-5 max-w-2xl">
      <FlowBreadcrumb items={[...breadcrumbBase, { label: project.name }]} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>
        <p className="text-slate-500 text-sm mt-0.5">Project ID: <span className="font-mono">{project.id}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <label className={labelCls}>ชื่อโปรเจค</label>
          <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
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
          {saved && <span className="text-sm text-green-600 font-medium">บันทึกแล้ว</span>}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
