'use client';
import { useState, useEffect, useCallback } from 'react';
import { commentsApi, commentAttachmentsApi } from '@/lib/api';
import CommentEditor, { CommentAttachment } from './CommentEditor';

interface Comment {
  id: number;
  issueId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments: CommentAttachment[];
}

interface IssueCommentsProps {
  issueId: number;
  currentUser: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isImage(mime: string) { return mime.startsWith('image/'); }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function AttachmentList({ attachments, commentId }: { attachments: CommentAttachment[]; commentId: number }) {
  const [preview, setPreview] = useState<CommentAttachment | null>(null);
  if (attachments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {attachments.map(att => (
        <div key={att.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-1.5">
          {isImage(att.mimetype) ? (
            <img src={`${API_BASE}/uploads/${att.storedName}`} alt={att.originalName} className="w-6 h-6 rounded object-cover cursor-pointer" onClick={() => setPreview(att)} />
          ) : (
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          )}
          <a href={`${API_BASE}/uploads/${att.storedName}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-slate-700 hover:text-indigo-600 truncate font-medium">
            {att.originalName}
          </a>
          <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(att.size)}</span>
        </div>
      ))}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img src={`${API_BASE}/uploads/${preview.storedName}`} alt={preview.originalName} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            <p className="text-white text-sm text-center mt-3 opacity-75">{preview.originalName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssueComments({ issueId, currentUser }: IssueCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commentsApi.getAll(issueId);
      setComments(res.data);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(content: string, pendingFiles: File[]) {
    const res = await commentsApi.create(issueId, content);
    const newCommentId: number = res.data.id;
    for (const file of pendingFiles) {
      await commentAttachmentsApi.upload(newCommentId, file);
    }
    await load();
  }

  async function handleUpdate(comment: Comment) {
    return async (content: string) => {
      await commentsApi.update(issueId, comment.id, content);
      setEditId(null);
      await load();
    };
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this comment?')) return;
    await commentsApi.remove(issueId, id);
    await load();
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{comments.length}</span>
        )}
      </h3>

      {/* Comment list */}
      {loading ? (
        <div className="text-slate-400 text-xs py-3">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-slate-400 text-xs py-3">No comments yet.</div>
      ) : (
        <div className="space-y-5 mb-6">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(c.createdBy)}`}>
                {c.createdBy[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800">{c.createdBy}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                  {c.updatedAt !== c.createdAt && <span className="text-xs text-slate-300 italic">edited</span>}
                </div>

                {editId === c.id ? (
                  <CommentEditor
                    key={`edit-${c.id}`}
                    commentId={c.id}
                    initialContent={c.content}
                    initialAttachments={c.attachments}
                    onSubmit={async (content) => { await handleUpdate(c)(content); }}
                    onCancel={() => setEditId(null)}
                    submitLabel="Save"
                  />
                ) : (
                  <div className="group relative">
                    <div
                      className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600"
                      dangerouslySetInnerHTML={{ __html: c.content }}
                    />
                    <AttachmentList attachments={c.attachments} commentId={c.id} />
                    {c.createdBy === currentUser && (
                      <div className="absolute top-1.5 right-2 hidden group-hover:flex gap-1">
                        <button onClick={() => setEditId(c.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500 transition" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment */}
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(currentUser || 'u')}`}>
          {(currentUser || 'u')[0]?.toUpperCase()}
        </div>
        <CommentEditor
          key="new-comment"
          onSubmit={handleCreate}
          placeholder="Write a comment..."
          submitLabel="Comment"
        />
      </div>
    </div>
  );
}
