'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import NewProjectModal from '@/components/uis-gen/NewProjectModal';
import { uisGenProjectsApi } from '@/lib/api';
import { getUisGenTemplate } from '@/lib/uisGenTemplates';
import type { UisGenProject } from '@/types/uisGen';

export default function UisGenPage() {
  const [projects, setProjects] = useState<UisGenProject[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function load() {
    uisGenProjectsApi.getAll().then(res => {
      setProjects(res.data);
      setLoaded(true);
    });
  }

  useEffect(load, []);

  function handleDelete(id: string) {
    if (!confirm('ลบ Web Application Project นี้? รวมถึง Sitemap และหน้าที่ออกแบบไว้ทั้งหมด')) return;
    // Deleting the project cascades to its sitemap row on the backend (FK onDelete: CASCADE) —
    // no separate sitemap-delete call needed.
    uisGenProjectsApi.remove(id).then(load);
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'UIs Gen' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">UIs Gen</h1>
          <p className="text-slate-500 text-sm mt-0.5">Low-code Web Application Builder — ออกแบบ sitemap, หน้า, และสิทธิ์ผู้ใช้ โดยไม่ต้องเขียนโค้ด</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewProject(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          สร้าง Web Application Project
        </button>
      </div>

      {loaded && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 5.25h16.5v13.5H3.75V5.25zM3.75 9h16.5M8.25 9v9.75" />
          </svg>
          <h2 className="text-base font-semibold text-slate-700">ยังไม่มี Project</h2>
          <p className="text-slate-500 text-sm">กด &ldquo;สร้าง Web Application Project&rdquo; เพื่อเริ่มต้น</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {projects.map(p => {
              const template = getUisGenTemplate(p.templateId);
              return (
                <li key={p.id} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.themeColor }} />
                    <div className="min-w-0">
                      <Link href={`/uis-gen/${p.id}`} className="font-medium text-slate-800 hover:text-indigo-600 truncate">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500 truncate">{template?.name ?? p.templateId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString()}</span>
                    <Link href={`/uis-gen/${p.id}/preview`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Preview
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="text-sm font-medium text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </div>
  );
}
