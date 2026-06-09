'use client';
import { useState, useEffect, useCallback } from 'react';
import { attachmentsApi } from '@/lib/api';
import IssueComments from './IssueComments';
import { Issue, PRIORITY_COLORS, STATUS_COLORS } from '@/types/issue';

interface IssueAttachment {
  id: number;
  issueId: number;
  storedName: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api';

function isImage(mime: string) { return mime.startsWith('image/'); }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IssueAttachments({ issueId }: { issueId: number }) {
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const [preview, setPreview] = useState<IssueAttachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await attachmentsApi.getAll(issueId);
    setAttachments(res.data);
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await attachmentsApi.upload(issueId, file);
      }
      await load();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(att: IssueAttachment) {
    if (!confirm(`Delete "${att.originalName}"?`)) return;
    await attachmentsApi.remove(issueId, att.id);
    await load();
  }

  const images = attachments.filter(a => isImage(a.mimetype));
  const files = attachments.filter(a => !isImage(a.mimetype));

  return (
    <div className="mt-5 pt-5 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Attachments
          {attachments.length > 0 && (
            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{attachments.length}</span>
          )}
        </h3>
        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
          {uploading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add files
            </>
          )}
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {attachments.length === 0 && (
        <p className="text-xs text-slate-400 py-2">No attachments yet.</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map(att => (
            <div key={att.id} className="group relative aspect-square rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
              <img
                src={`${API_BASE}/uploads/${att.storedName}`}
                alt={att.originalName}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                onClick={() => setPreview(att)}
              />
              <button
                onClick={() => handleDelete(att)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                title="Delete"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-[10px] truncate">{att.originalName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map(att => (
            <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 group">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              <a
                href={`${API_BASE}/uploads/${att.storedName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs text-slate-700 hover:text-indigo-600 truncate font-medium"
              >
                {att.originalName}
              </a>
              <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(att.size)}</span>
              <button
                onClick={() => handleDelete(att)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-slate-400 transition"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <img
              src={`${API_BASE}/uploads/${preview.storedName}`}
              alt={preview.originalName}
              className="max-w-full max-h-[82vh] rounded-xl shadow-2xl object-contain"
            />
            <p className="text-white text-sm text-center mt-3 opacity-75">{preview.originalName}</p>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssueDetail({ issue, currentUser }: { issue: Issue; currentUser: string }) {
  const row = (label: string, value: any) => value ? (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="col-span-2 text-sm text-slate-800">{value}</div>
    </div>
  ) : null;

  return (
    <div>
      <div className="space-y-1">
        {row('Project', issue.projectName)}
        {row('Code Type', issue.codeType)}
        {row('Detail', issue.detail)}
        {row('Github', issue.githubLink)}
        {row('Created Date', issue.issueCreateDate)}
        {row('Priority', <span className={`text-xs px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>)}
        {row('Work Period', issue.taskWorkPeriod ? `${issue.taskWorkPeriod} ${issue.taskWorkPeriodUnit}` : null)}
        {row('Target Date', issue.targetDate)}
        {row('Issuer', issue.issuer)}
        {row('Developer', issue.developer)}
        {row('Tester', issue.tester)}
        {row('Task Status', <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[issue.taskStatus]}`}>{issue.taskStatus}</span>)}
        {row('Deployment', issue.deploymentStatus)}
        {row('Anydesk', issue.anydesk)}
        {row('TeamViewer', issue.teamViewer)}
        {row('Contract Detail', issue.contractDetail)}
      </div>
      <IssueAttachments issueId={issue.id} />
      <IssueComments issueId={issue.id} currentUser={currentUser} />
    </div>
  );
}
