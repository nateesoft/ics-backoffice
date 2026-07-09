'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import { FlowProject } from '@/types/flowProject';
import { getFlowTemplate } from '@/lib/flowTemplates';
import { flowProjectsStore } from '@/lib/flowProjectsStore';

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

export default function FlowProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FlowProject | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = flowProjectsStore.getById(params.id);
    setProject(p);
    if (p) {
      setName(p.name);
      setDescription(p.description);
    }
  }, [params.id]);

  function handleSave() {
    if (!project || !name.trim()) return;
    const updated = flowProjectsStore.update(project.id, { name: name.trim(), description: description.trim() });
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
        <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'Not Found' }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">ไม่พบโปรเจคนี้</h2>
          <button
            onClick={() => router.push('/flow-generate')}
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
      <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: project.name }]} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">แก้ไขรายละเอียดโปรเจค</h1>
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
