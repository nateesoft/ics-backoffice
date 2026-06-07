'use client';
import { useRef, useState } from 'react';
import { Issue, CODE_TYPES, PRIORITIES, WORK_PERIOD_UNITS, TASK_STATUSES, DEPLOYMENT_STATUSES } from '@/types/issue';
import { issuesApi, attachmentsApi } from '@/lib/api';
import DetailEditor from './DetailEditor';

interface IssueFormProps {
  initial?: Partial<Issue>;
  onSuccess: (issue: Issue) => void;
  onCancel: () => void;
  defaultDate?: string;
}

const today = new Date().toISOString().split('T')[0];

export default function IssueForm({ initial, onSuccess, onCancel, defaultDate }: IssueFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    projectName: initial?.projectName || '',
    codeType: initial?.codeType || 'NextJS',
    detail: initial?.detail || '',
    githubLink: initial?.githubLink || '',
    issueCreateDate: initial?.issueCreateDate || defaultDate || today,
    priority: initial?.priority || 'Medium',
    taskWorkPeriod: initial?.taskWorkPeriod ?? '',
    taskWorkPeriodUnit: initial?.taskWorkPeriodUnit || 'Days',
    targetDate: initial?.targetDate || '',
    issuer: initial?.issuer || '',
    developer: initial?.developer || '',
    tester: initial?.tester || '',
    taskStatus: initial?.taskStatus || 'New',
    deploymentStatus: initial?.deploymentStatus || 'Wait Approve',
    anydesk: initial?.anydesk || '',
    teamViewer: initial?.teamViewer || '',
    contractDetail: initial?.contractDetail || '',
  });
  const pendingFilesRef = useRef<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, taskWorkPeriod: form.taskWorkPeriod ? Number(form.taskWorkPeriod) : undefined };
      const res = isEdit
        ? await issuesApi.update(initial!.id!, payload)
        : await issuesApi.create(payload);

      const savedIssue: Issue = res.data;

      // Upload any pending files that were added before the issue was created
      const pending = pendingFilesRef.current;
      if (pending.length > 0) {
        await Promise.all(pending.map(f => attachmentsApi.upload(savedIssue.id, f)));
        pendingFilesRef.current = [];
      }

      onSuccess(savedIssue);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save issue');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
  const selectCls = inputCls + " cursor-pointer";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Project Name *</label>
          <input className={inputCls} value={form.projectName} onChange={e => set('projectName', e.target.value)} required placeholder="Project name" />
        </div>
        <div>
          <label className={labelCls}>Code Type *</label>
          <select className={selectCls} value={form.codeType} onChange={e => set('codeType', e.target.value)} required>
            {CODE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* ─── Detail + File Upload ─── */}
        <div className="md:col-span-2">
          <label className={labelCls}>Detail & Attachments</label>
          <DetailEditor
            value={form.detail}
            onChange={val => set('detail', val)}
            issueId={initial?.id}
            onPendingFilesChange={files => { pendingFilesRef.current = files; }}
          />
        </div>

        <div>
          <label className={labelCls}>Github Link</label>
          <input className={inputCls} value={form.githubLink} onChange={e => set('githubLink', e.target.value)} placeholder="https://github.com/..." />
        </div>
        <div>
          <label className={labelCls}>Issue Create Date *</label>
          <input type="date" className={inputCls} value={form.issueCreateDate} onChange={e => set('issueCreateDate', e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Priority *</label>
          <select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value)} required>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelCls}>Work Period</label>
            <input type="number" min="0" className={inputCls} value={form.taskWorkPeriod} onChange={e => set('taskWorkPeriod', e.target.value)} placeholder="0" />
          </div>
          <div className="w-28">
            <label className={labelCls}>Unit</label>
            <select className={selectCls} value={form.taskWorkPeriodUnit} onChange={e => set('taskWorkPeriodUnit', e.target.value)}>
              {WORK_PERIOD_UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Target Date</label>
          <input type="date" className={inputCls} value={form.targetDate} onChange={e => set('targetDate', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Issuer</label>
          <input className={inputCls} value={form.issuer} onChange={e => set('issuer', e.target.value)} placeholder="Issuer name" />
        </div>
        <div>
          <label className={labelCls}>Developer</label>
          <input className={inputCls} value={form.developer} onChange={e => set('developer', e.target.value)} placeholder="Developer name" />
        </div>
        <div>
          <label className={labelCls}>Tester</label>
          <input className={inputCls} value={form.tester} onChange={e => set('tester', e.target.value)} placeholder="Tester name" />
        </div>
        <div>
          <label className={labelCls}>Task Status</label>
          <select className={selectCls} value={form.taskStatus} onChange={e => set('taskStatus', e.target.value)}>
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Deployment Status</label>
          <select className={selectCls} value={form.deploymentStatus} onChange={e => set('deploymentStatus', e.target.value)}>
            {DEPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Anydesk</label>
          <input className={inputCls} value={form.anydesk} onChange={e => set('anydesk', e.target.value)} placeholder="Anydesk ID" />
        </div>
        <div>
          <label className={labelCls}>TeamViewer</label>
          <input className={inputCls} value={form.teamViewer} onChange={e => set('teamViewer', e.target.value)} placeholder="TeamViewer ID" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Contract Detail</label>
          <textarea className={inputCls} rows={2} value={form.contractDetail} onChange={e => set('contractDetail', e.target.value)} placeholder="Contract details..." />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50">
          {loading ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
        </button>
      </div>
    </form>
  );
}
