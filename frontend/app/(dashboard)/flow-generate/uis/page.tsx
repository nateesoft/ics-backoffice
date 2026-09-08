'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import NewUiModal from '@/components/flow-generate/NewUiModal';
import { FlowUiItem } from '@/types/flowUi';
import { flowUiStore } from '@/lib/flowUiStore';
import { flowProjectsStore } from '@/lib/flowItemsStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
}

function uiTypeBadge(ui: FlowUiItem) {
  if (ui.uiType === 'Component') return 'Component';
  return `Page · ${ui.pageKind}`;
}

export default function FlowGenerateUisPage() {
  const router = useRouter();
  const [uis, setUis] = useState<FlowUiItem[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setUis(flowUiStore.getAll());
    setProjectNames(Object.fromEntries(flowProjectsStore.getAll().map(p => [p.id, p.name])));
    setLoaded(true);
  }, []);

  function handleCreated(ui: FlowUiItem) {
    setShowModal(false);
    router.push(`/flow-generate/uis/${ui.id}`);
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'UIs' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Flow Generate — UIs</h1>
          <p className="text-slate-500 text-sm mt-0.5">รายการ UI ที่เคยสร้างสำหรับ Flow Generate</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New UI
        </button>
      </div>

      {loaded && uis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16v4H4V5zm0 6h7v8H4v-8zm9 0h7v8h-7v-8z" />
          </svg>
          <h2 className="text-base font-semibold text-slate-700">ยังไม่มี UI</h2>
          <p className="text-slate-500 text-sm">เริ่มต้นสร้าง UI แรกของคุณได้เลย</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            New UI
          </button>
        </div>
      )}

      {uis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uis.map(u => (
            <Link
              key={u.id}
              href={`/flow-generate/uis/${u.id}`}
              className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-200 transition flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-600">{uiTypeBadge(u)}</span>
                {u.uiPath && <span className="text-xs font-mono text-slate-500 truncate">{u.uiPath}</span>}
              </div>
              <h3 className="font-semibold text-slate-800 truncate">{u.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 flex-1">{u.description || 'ไม่มีรายละเอียด'}</p>
              {u.roles && u.roles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {u.roles.map(role => (
                    <span key={role} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">{role}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium truncate">
                  {projectNames[u.projectId] ?? 'Unknown Project'}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(u.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NewUiModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
