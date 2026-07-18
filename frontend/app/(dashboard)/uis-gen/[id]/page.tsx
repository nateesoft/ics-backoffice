'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import SitemapCanvas from '@/components/uis-gen/SitemapCanvas';
import { uisGenProjectsApi } from '@/lib/api';
import { getUisGenTemplate } from '@/lib/uisGenTemplates';
import type { UisGenProject } from '@/types/uisGen';

export default function UisGenProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();

  const [project, setProject] = useState<UisGenProject | null | undefined>(undefined);

  useEffect(() => {
    uisGenProjectsApi.getById(projectId).then(res => setProject(res.data)).catch(() => setProject(null));
  }, [projectId]);

  if (project === undefined) return null;

  if (project === null) {
    return (
      <div className="space-y-4">
        <FlowBreadcrumb items={[{ label: 'UIs Gen', href: '/uis-gen' }, { label: 'ไม่พบ Project' }]} />
        <p className="text-sm text-slate-500">ไม่พบ Project นี้ — อาจถูกลบไปแล้ว</p>
        <Link href="/uis-gen" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">← กลับไปหน้า UIs Gen</Link>
      </div>
    );
  }

  const template = getUisGenTemplate(project.templateId);

  function handleRename(name: string) {
    uisGenProjectsApi.update(projectId, { name }).then(res => setProject(res.data));
  }

  function handleGenerate() {
    uisGenProjectsApi.update(projectId, { sitemapGenerated: true }).then(res => setProject(res.data));
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'UIs Gen', href: '/uis-gen' }, { label: project.name }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: project.themeColor }} />
          <div className="min-w-0">
            <input
              type="text"
              defaultValue={project.name}
              onBlur={e => e.target.value.trim() && e.target.value !== project.name && handleRename(e.target.value.trim())}
              className="text-xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none px-0.5 -ml-0.5"
            />
            <p className="text-slate-500 text-sm mt-0.5">
              {template?.name ?? project.templateId}
              {template?.hasNav && ` · เมนู: ${project.navPosition}`}
            </p>
          </div>
        </div>
        {project.sitemapGenerated && (
          <button
            type="button"
            onClick={() => router.push(`/uis-gen/${projectId}/preview`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </button>
        )}
      </div>

      {project.sitemapGenerated ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <SitemapCanvas projectId={projectId} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-2xl border border-slate-100">
          <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h10M4 14h13M4 18h7" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-slate-700">พร้อมสร้าง Sitemap</h2>
            <p className="text-slate-500 text-sm mt-1">กด &ldquo;Generate&rdquo; เพื่อเปิด Sitemap Canvas แล้วเริ่มวาง Actor / Page / Content / Modal / Alert</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            Generate
          </button>
        </div>
      )}
    </div>
  );
}
