'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import { FlowUiItem, UI_TYPES, PAGE_KINDS, UiType, PageKind } from '@/types/flowUi';
import { flowUiStore } from '@/lib/flowUiStore';
import { flowProjectsStore } from '@/lib/flowItemsStore';

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

export default function FlowUiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ui, setUi] = useState<FlowUiItem | null | undefined>(undefined);
  const [projectName, setProjectName] = useState('Unknown Project');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uiType, setUiType] = useState<UiType>('Page');
  const [pageKind, setPageKind] = useState<PageKind>('Main Page');
  const [uiPath, setUiPath] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = flowUiStore.getById(params.id);
    setUi(u);
    if (u) {
      setName(u.name);
      setDescription(u.description);
      setUiType(u.uiType);
      setPageKind(u.pageKind ?? 'Main Page');
      setUiPath(u.uiPath ?? '');
      const project = flowProjectsStore.getById(u.projectId);
      setProjectName(project ? project.name : 'Unknown Project');
    }
  }, [params.id]);

  const showPageKind = uiType === 'Page';
  const showUiPath = uiType === 'Page' && pageKind === 'Main Page';

  function handleSave() {
    if (!ui) return;
    if (!name.trim()) { setError('กรุณากรอก UI Name'); return; }
    if (showUiPath && !uiPath.trim()) { setError('กรุณากรอก UI Path'); return; }
    setError('');
    const updated = flowUiStore.update(ui.id, {
      name: name.trim(),
      description: description.trim(),
      uiType,
      pageKind: showPageKind ? pageKind : null,
      uiPath: showUiPath ? uiPath.trim() : null,
    });
    if (updated) {
      setUi(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  if (ui === undefined) return null;

  if (ui === null) {
    return (
      <div className="space-y-5">
        <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'UIs', href: '/flow-generate/uis' }, { label: 'Not Found' }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">ไม่พบ UI นี้</h2>
          <button
            onClick={() => router.push('/flow-generate/uis')}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            กลับไปหน้ารายการ UI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'UIs', href: '/flow-generate/uis' }, { label: ui.name }]} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">แก้ไขรายละเอียด UI</h1>
        <p className="text-slate-500 text-sm mt-0.5">Project: <span className="font-medium text-slate-600">{projectName}</span></p>
        <p className="text-slate-400 text-xs mt-0.5">UI ID: <span className="font-mono">{ui.id}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <label className={labelCls}>UI Name</label>
          <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>ประเภท UI</label>
          <select className={inputCls} value={uiType} onChange={e => setUiType(e.target.value as UiType)}>
            {UI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {showPageKind && (
          <div>
            <label className={labelCls}>ประเภท Page</label>
            <select className={inputCls} value={pageKind} onChange={e => setPageKind(e.target.value as PageKind)}>
              {PAGE_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        {showUiPath && (
          <div>
            <label className={labelCls}>UI Path</label>
            <input type="text" className={`${inputCls} font-mono`} value={uiPath} onChange={e => setUiPath(e.target.value)} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
        )}

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
