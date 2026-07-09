'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import NewProjectModal from '@/components/flow-generate/NewProjectModal';
import { FlowProject } from '@/types/flowProject';
import { getFlowTemplate } from '@/lib/flowTemplates';
import { FlowItemsStore } from '@/lib/flowItemsStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FlowItemsListPageProps {
  store: FlowItemsStore;
  basePath: string;
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle: string;
  newButtonLabel?: string;
  modalTitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function FlowItemsListPage({
  store,
  basePath,
  breadcrumb,
  title,
  subtitle,
  newButtonLabel = 'New Project',
  modalTitle = 'New Project',
  emptyTitle = 'ยังไม่มีโปรเจค',
  emptySubtitle = 'เริ่มต้นสร้างโปรเจคแรกของคุณได้เลย',
}: FlowItemsListPageProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setProjects(store.getAll());
    setLoaded(true);
  }, [store]);

  function handleCreated(project: FlowProject) {
    setShowModal(false);
    router.push(`${basePath}/${project.id}`);
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={breadcrumb} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {newButtonLabel}
        </button>
      </div>

      {loaded && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h10M4 14h13M4 18h7" />
          </svg>
          <h2 className="text-base font-semibold text-slate-700">{emptyTitle}</h2>
          <p className="text-slate-500 text-sm">{emptySubtitle}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            {newButtonLabel}
          </button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const template = getFlowTemplate(p.templateId);
            return (
              <Link
                key={p.id}
                href={`${basePath}/${p.id}`}
                className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-200 transition flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">{p.name}</h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">{p.description || 'ไม่มีรายละเอียด'}</p>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium truncate">
                    {template ? template.name : p.templateId}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(p.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <NewProjectModal store={store} modalTitle={modalTitle} onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
