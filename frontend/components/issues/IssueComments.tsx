'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { commentsApi, commentAttachmentsApi, commentReactionsApi, usersApi, issuesApi, documentsApi } from '@/lib/api';
import CommentEditor, { CommentAttachment, MentionUser, MentionIssue, MentionDocument } from './CommentEditor';

interface CommentReaction {
  id: number;
  commentId: number;
  emoji: string;
  createdBy: string;
}

interface Comment {
  id: number;
  issueId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments: CommentAttachment[];
  reactions: CommentReaction[];
  parentId: number | null;
}

interface IssueCommentsProps {
  issueId: number;
  currentUser: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

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

function groupReactions(reactions: CommentReaction[], currentUser: string) {
  const groups: Record<string, { count: number; reacted: boolean; users: string[] }> = {};
  for (const r of reactions) {
    if (!groups[r.emoji]) groups[r.emoji] = { count: 0, reacted: false, users: [] };
    groups[r.emoji].count++;
    groups[r.emoji].users.push(r.createdBy);
    if (r.createdBy === currentUser) groups[r.emoji].reacted = true;
  }
  return groups;
}

function ReactionBar({ commentId, reactions, currentUser, onToggle }: {
  commentId: number;
  reactions: CommentReaction[];
  currentUser: string;
  onToggle: (commentId: number, emoji: string) => Promise<void>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const groups = groupReactions(reactions, currentUser);

  useEffect(() => {
    if (!showPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  function openPicker() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.top, left: rect.left });
    }
    setShowPicker(p => !p);
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(groups).map(([emoji, { count, reacted, users }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(commentId, emoji)}
          title={users.join(', ')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
            reacted
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
      <button
        ref={triggerRef}
        onClick={openPicker}
        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
        title="Add reaction"
      >
        <span>😊</span>
        <span className="font-bold">+</span>
      </button>
      {showPicker && (
        <div
          ref={pickerRef}
          style={{
            position: 'fixed',
            top: pickerPos.top,
            left: pickerPos.left,
            transform: 'translateY(-110%)',
            zIndex: 9999,
          }}
          className="flex gap-1 bg-white border border-slate-200 rounded-xl shadow-xl px-2 py-1.5"
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => { onToggle(commentId, e); setShowPicker(false); }}
              className="text-lg hover:scale-125 transition-transform leading-none"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: CommentAttachment[] }) {
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
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [mentionIssues, setMentionIssues] = useState<MentionIssue[]>([]);
  const [mentionDocs, setMentionDocs] = useState<MentionDocument[]>([]);

  useEffect(() => {
    usersApi.getAll().then(r => setUsers(r.data)).catch(() => {});
    issuesApi.getAll().then(r => setMentionIssues(
      r.data.filter((iss: any) => !iss.isCancelled).map((iss: any) => ({ id: iss.id, projectName: iss.projectName }))
    )).catch(() => {});
    documentsApi.getAll().then(r => setMentionDocs(
      r.data.map((doc: any) => ({ id: doc.id, title: doc.title }))
    )).catch(() => {});
  }, []);

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

  const topLevel = comments.filter(c => !c.parentId);
  const repliesMap: Record<number, Comment[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  async function handleCreate(content: string, pendingFiles: File[], parentId?: number) {
    const res = await commentsApi.create(issueId, content, parentId);
    const newId: number = res.data.id;
    for (const file of pendingFiles) {
      await commentAttachmentsApi.upload(newId, file);
    }
    await load();
    if (parentId) setReplyToId(null);
  }

  async function handleUpdate(comment: Comment, content: string) {
    await commentsApi.update(issueId, comment.id, content);
    setEditId(null);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this comment?')) return;
    await commentsApi.remove(issueId, id);
    await load();
  }

  async function handleToggleReaction(commentId: number, emoji: string) {
    const res = await commentReactionsApi.toggle(commentId, emoji);
    const updated: CommentReaction[] = res.data;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: updated } : c));
  }

  function renderCommentBody(c: Comment, isReply: boolean) {
    if (editId === c.id) {
      return (
        <CommentEditor
          key={`edit-${c.id}`}
          commentId={c.id}
          initialContent={c.content}
          initialAttachments={c.attachments}
          onSubmit={async (content) => handleUpdate(c, content)}
          onCancel={() => setEditId(null)}
          submitLabel="Save"
          users={users}
          issues={mentionIssues}
          documents={mentionDocs}
        />
      );
    }
    return (
      <div className="group relative">
        <div
          className={`bg-slate-50 rounded-lg px-3 py-2 leading-relaxed text-slate-700
            [&_strong]:font-bold [&_em]:italic [&_u]:underline
            [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
            [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs
            [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600
            ${isReply ? 'text-xs' : 'text-sm'}`}
          dangerouslySetInnerHTML={{ __html: c.content }}
        />
        <AttachmentList attachments={c.attachments} />

        {/* Reactions + Reply */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <ReactionBar
            commentId={c.id}
            reactions={c.reactions}
            currentUser={currentUser}
            onToggle={handleToggleReaction}
          />
          {!isReply && (
            <button
              onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                replyToId === c.id
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
              {(repliesMap[c.id]?.length ?? 0) > 0 && (
                <span className="ml-0.5 text-slate-400 font-normal">{repliesMap[c.id].length}</span>
              )}
            </button>
          )}
        </div>

        {/* Edit / Delete */}
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
    );
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Comments
        {topLevel.length > 0 && (
          <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{topLevel.length}</span>
        )}
      </h3>

      {loading ? (
        <div className="text-slate-400 text-xs py-3">Loading comments...</div>
      ) : topLevel.length === 0 ? (
        <div className="text-slate-400 text-xs py-3">No comments yet.</div>
      ) : (
        <div className="space-y-5 mb-6">
          {topLevel.map(c => (
            <div key={c.id}>
              {/* Top-level comment */}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(c.createdBy)}`}>
                  {c.createdBy[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">{c.createdBy}</span>
                    <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                    {c.updatedAt !== c.createdAt && <span className="text-xs text-slate-300 italic">edited</span>}
                  </div>
                  {renderCommentBody(c, false)}
                </div>
              </div>

              {/* Replies thread */}
              {(repliesMap[c.id]?.length ?? 0) > 0 && (
                <div className="ml-11 mt-3 pl-4 border-l-2 border-slate-100 space-y-3">
                  {repliesMap[c.id].map(r => (
                    <div key={r.id} className="flex gap-2">
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(r.createdBy)}`}>
                        {r.createdBy[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-800">{r.createdBy}</span>
                          <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                          {r.updatedAt !== r.createdAt && <span className="text-xs text-slate-300 italic">edited</span>}
                        </div>
                        {renderCommentBody(r, true)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline reply editor */}
              {replyToId === c.id && (
                <div className="ml-11 mt-3 flex gap-2">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(currentUser || 'u')}`}>
                    {(currentUser || 'u')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <CommentEditor
                      key={`reply-${c.id}`}
                      onSubmit={async (content, files) => handleCreate(content, files, c.id)}
                      onCancel={() => setReplyToId(null)}
                      placeholder={`Reply to @${c.createdBy}...`}
                      submitLabel="Reply"
                      users={users}
                      issues={mentionIssues}
                      documents={mentionDocs}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New top-level comment */}
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(currentUser || 'u')}`}>
          {(currentUser || 'u')[0]?.toUpperCase()}
        </div>
        <CommentEditor
          key="new-comment"
          onSubmit={handleCreate}
          placeholder="Write a comment..."
          submitLabel="Comment"
          users={users}
          issues={mentionIssues}
          documents={mentionDocs}
        />
      </div>
    </div>
  );
}
