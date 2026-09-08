'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import FlowCanvasEditor from '@/components/flow-generate/FlowCanvasEditor';
import ProjectSettingsModal from '@/components/flow-generate/ProjectSettingsModal';
import { FlowProject } from '@/types/flowProject';
import { getFlowTemplate } from '@/lib/flowTemplates';
import { FlowItemsStore } from '@/lib/flowItemsStore';

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
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setProject(store.getById(params.id));
  }, [store, params.id]);

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
    <div className="space-y-4">
      <FlowBreadcrumb items={[...breadcrumbBase, { label: project.name }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {project.name} · Project ID: <span className="font-mono">{project.id}</span>
            {template && <> · <span className="text-indigo-600 font-medium">{template.name}</span></>}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ตั้งค่าโปรเจค
        </button>
      </div>

      <FlowCanvasEditor projectId={project.id} />

      {showSettings && (
        <ProjectSettingsModal
          project={project}
          store={store}
          onClose={() => setShowSettings(false)}
          onSaved={updated => {
            setProject(updated);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
