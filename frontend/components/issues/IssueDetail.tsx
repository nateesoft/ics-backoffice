'use client';
import { useState, useEffect, useCallback } from 'react';
import { attachmentsApi, issuesApi } from '@/lib/api';
import { linkify } from '@/lib/linkify';
import IssueComments from './IssueComments';
import { Issue, PRIORITY_COLORS, STATUS_COLORS, TAG_COLORS, IssueTag } from '@/types/issue';

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

interface HistoryEntry {
  id: number;
  issueId: number;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
}

function IssueHistory({ issueId }: { issueId: number }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issuesApi.getHistory(issueId)
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issueId]);

  return (
    <div className="mt-5 pt-5 border-t border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Edit History
        {history.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{history.length}</span>
        )}
      </h3>

      {loading ? (
        <p className="text-xs text-slate-400 py-2">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">No edit history yet.</p>
      ) : (
        <div className="relative pl-5">
          {/* vertical line */}
          <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" />

          <div className="space-y-4">
            {history.map(entry => (
              <div key={entry.id} className="relative">
                {/* dot */}
                <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-300" />

                <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {entry.changedBy?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{entry.changedBy}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDateTime(entry.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-slate-500">{entry.fieldName}</span>
                    {entry.oldValue ? (
                      <>
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded line-through">{entry.oldValue}</span>
                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </>
                    ) : null}
                    {entry.newValue ? (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{entry.newValue}</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">cleared</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssueDetail({ issue, currentUser, onClone }: { issue: Issue; currentUser: string; onClone?: (issue: Issue) => void }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?issue=${issue.id}`;
    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => fallbackCopy(url, doCopy));
    } else {
      fallbackCopy(url, doCopy);
    }
  }

  function fallbackCopy(text: string, onSuccess: () => void) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); onSuccess(); } catch {}
    document.body.removeChild(ta);
  }

  const row = (label: string, value: any) => value ? (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="col-span-2 text-sm text-slate-800">{value}</div>
    </div>
  ) : null;

  const htmlRow = (label: string, html: string | null | undefined) => html ? (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div
        className="col-span-2 text-sm text-slate-800 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600"
        dangerouslySetInnerHTML={{ __html: linkify(html) }}
      />
    </div>
  ) : null;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        {onClone && (
          <button
            onClick={() => onClone(issue)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Clone Issue
          </button>
        )}
        <button
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${copied ? 'bg-green-50 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share Link
            </>
          )}
        </button>
      </div>
      <div className="space-y-1">
        {row('Project', issue.projectName)}
        {row('Code Type', issue.codeType)}
        {htmlRow('Detail', issue.detail)}
        {row('Github', issue.githubLink)}
        {row('Created Date', issue.issueCreateDate)}
        {row('Priority', <span className={`text-xs px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>)}
        {row('Work Period', issue.taskWorkPeriod ? `${issue.taskWorkPeriod} ${issue.taskWorkPeriodUnit}` : null)}
        {row('Target Date', issue.targetDate)}
        {row('Issuer', issue.issuer)}
        {row('Developer', issue.developer)}
        {row('Tester', issue.tester)}
        {row('Created By', issue.createdBy)}
        {issue.tags && issue.tags.length > 0 && (
          <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tags</div>
            <div className="col-span-2 flex flex-wrap gap-1.5">
              {issue.tags.map(tag => (
                <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TAG_COLORS[tag as IssueTag] ?? 'bg-slate-100 text-slate-600'}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {row('Task Status', <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[issue.taskStatus]}`}>{issue.taskStatus}</span>)}
        {row('Deployment', issue.deploymentStatus)}
        {row('Anydesk', issue.anydesk)}
        {row('TeamViewer', issue.teamViewer)}
        {row('Contract Detail', issue.contractDetail)}
        {issue.visibility === 'creator' && (
          <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Visibility</div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                เฉพาะผู้สร้าง
              </span>
            </div>
          </div>
        )}
      </div>
      <IssueAttachments issueId={issue.id} />
      <IssueComments issueId={issue.id} currentUser={currentUser} />
      <IssueHistory issueId={issue.id} />
    </div>
  );
}
