'use client';
import { useEffect, useRef, useState } from 'react';
import { Issue, CODE_TYPES, PRIORITIES, WORK_PERIOD_UNITS, TASK_STATUSES, DEPLOYMENT_STATUSES, ISSUE_TAGS, TAG_COLORS, IssueTag } from '@/types/issue';
import { issuesApi, attachmentsApi, usersApi } from '@/lib/api';
import DetailEditor from './DetailEditor';

interface IssueFormProps {
  initial?: Partial<Issue>;
  onSuccess: (issue: Issue) => void;
  onCancel: () => void;
  defaultDate?: string;
}

const today = new Date().toISOString().split('T')[0];

const FIELD_LABELS: Record<string, string> = {
  projectName: 'Project Name',
  codeType: 'Project Type',
  detail: 'Detail',
  githubLink: 'Github Link',
  issueCreateDate: 'Issue Create Date',
  priority: 'Priority',
  taskWorkPeriod: 'Work Period',
  taskWorkPeriodUnit: 'Work Period Unit',
  targetDate: 'Target Date',
  issuer: 'Issuer',
  developer: 'Developer',
  tester: 'Tester',
  taskStatus: 'Task Status',
  deploymentStatus: 'Deployment Status',
  anydesk: 'Anydesk',
  teamViewer: 'TeamViewer',
  contractDetail: 'Contract Detail',
  tags: 'Tags',
  visibility: 'Visibility',
};

function humanizeErrorMessage(msg: string): string {
  const field = msg.split(' ')[0];
  const label = FIELD_LABELS[field] || field;

  if (/should not be empty/i.test(msg)) return `กรุณากรอก ${label}`;
  if (/must be one of the following values/i.test(msg)) return `กรุณาเลือก ${label} ที่ถูกต้อง`;
  if (/must be a valid ISO 8601 date string/i.test(msg)) return `กรุณากรอก ${label} ให้ถูกต้อง (ตัวอย่าง: 2025-01-31)`;
  if (/must be a number/i.test(msg)) return `${label} ต้องเป็นตัวเลข`;
  if (/must be a string/i.test(msg)) return `กรุณากรอก ${label}`;
  if (/must be shorter than or equal to (\d+)/i.test(msg)) {
    const n = msg.match(/(\d+)/)?.[1];
    return `${label} ต้องไม่เกิน ${n} ตัวอักษร`;
  }
  if (/must be longer than or equal to (\d+)/i.test(msg)) {
    const n = msg.match(/(\d+)/)?.[1];
    return `${label} ต้องมีอย่างน้อย ${n} ตัวอักษร`;
  }
  return msg;
}

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
    tags: initial?.tags || [],
    visibility: initial?.visibility || 'all',
  });
  const pendingFilesRef = useRef<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | string[]>('');
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);

  useEffect(() => {
    usersApi.getAll().then(res => setUsers(res.data)).catch(() => {});
  }, []);

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
      if (!err?.response) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      } else {
        const msg = err.response.data?.message;
        const status = err.response.status;
        if (status === 400) {
          setError(Array.isArray(msg) ? msg.map(humanizeErrorMessage) : (msg ? humanizeErrorMessage(msg) : 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง'));
        } else if (status === 401 || status === 403) {
          setError('ไม่มีสิทธิ์ดำเนินการนี้ กรุณาเข้าสู่ระบบใหม่');
        } else if (status >= 500) {
          setError('เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง');
        } else {
          setError(msg || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
      }
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
          <label className={labelCls}>Project Type *</label>
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
          <select className={selectCls} value={form.developer} onChange={e => set('developer', e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tester</label>
          <select className={selectCls} value={form.tester} onChange={e => set('tester', e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
          </select>
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
          <label className={labelCls}>Tags</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ISSUE_TAGS.map(tag => {
              const active = (form.tags as string[]).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const cur = form.tags as string[];
                    set('tags', active ? cur.filter(t => t !== tag) : [...cur, tag]);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition select-none
                    ${active
                      ? TAG_COLORS[tag as IssueTag] + ' border-transparent ring-2 ring-offset-1 ring-current'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Visibility</label>
          <div className="flex gap-2 mt-1">
            {([
              { value: 'all', label: 'เห็นแบบทั้งหมด', icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )},
              { value: 'creator', label: 'เฉพาะผู้สร้าง', icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              )},
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('visibility', opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                  ${form.visibility === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Contract Detail</label>
          <textarea className={inputCls} rows={2} value={form.contractDetail} onChange={e => set('contractDetail', e.target.value)} placeholder="Contract details..." />
        </div>
      </div>

      {error && (error as string[]).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">เกิดข้อผิดพลาด</p>
            {Array.isArray(error) ? (
              <ul className="mt-1 text-sm text-red-600 list-disc list-inside space-y-0.5">
                {error.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            ) : (
              <p className="mt-0.5 text-sm text-red-600">{error}</p>
            )}
          </div>
          <button type="button" onClick={() => setError('')} className="shrink-0 text-red-400 hover:text-red-600 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
