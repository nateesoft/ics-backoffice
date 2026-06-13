'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { docCommentsApi } from '@/lib/api';

interface DocReaction {
  id: number;
  commentId: number;
  emoji: string;
  createdBy: string;
}

interface DocComment {
  id: number;
  documentId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reactions: DocReaction[];
  parentId: number | null;
}

interface Props {
  docId: number;
  currentUser: string;
}

const EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅', '❌', '💡', '🤔'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function groupReactions(reactions: DocReaction[], currentUser: string) {
  const groups: Record<string, { count: number; reacted: boolean; users: string[] }> = {};
  for (const r of reactions) {
    if (!groups[r.emoji]) groups[r.emoji] = { count: 0, reacted: false, users: [] };
    groups[r.emoji].count++;
    groups[r.emoji].users.push(r.createdBy);
    if (r.createdBy === currentUser) groups[r.emoji].reacted = true;
  }
  return groups;
}

function CommentInput({ onSubmit, onCancel, placeholder = 'Write a comment...', submitLabel = 'Comment', initialValue = '' }: {
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
}) {
  const [text, setText] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [text]);

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 space-y-1.5">
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none leading-relaxed text-slate-700 placeholder:text-slate-300"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Ctrl+Enter to submit</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition">
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={submitting || !text.trim()}
            onClick={submit}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium transition"
          >
            {submitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReactionBar({ commentId, reactions, currentUser, onToggle }: {
  commentId: number;
  reactions: DocReaction[];
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
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
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
          <span>{emoji}</span><span>{count}</span>
        </button>
      ))}
      <button
        ref={triggerRef}
        onClick={openPicker}
        title="Add reaction"
        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
      >
        <span>😊</span><span className="font-bold text-[10px]">+</span>
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
          className="grid grid-cols-6 gap-0.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5"
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => { onToggle(commentId, e); setShowPicker(false); }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-lg hover:bg-slate-50"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentComments({ docId, currentUser }: Props) {
  const [comments, setComments] = useState<DocComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [replyToId, setReplyToId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await docCommentsApi.getAll(docId);
      setComments(res.data);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  const topLevel = comments.filter(c => !c.parentId);
  const repliesMap: Record<number, DocComment[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  async function handleCreate(content: string, parentId?: number) {
    await docCommentsApi.create(docId, content, parentId);
    await load();
    if (parentId) setReplyToId(null);
  }

  async function handleUpdate(id: number, content: string) {
    await docCommentsApi.update(id, content);
    setEditId(null);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this comment?')) return;
    await docCommentsApi.remove(id);
    await load();
  }

  async function handleToggleReaction(commentId: number, emoji: string) {
    const res = await docCommentsApi.toggleReaction(commentId, emoji);
    const updated: DocReaction[] = res.data;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: updated } : c));
  }

  function renderCommentBody(c: DocComment, isReply: boolean) {
    if (editId === c.id) {
      return (
        <CommentInput
          key={`edit-${c.id}`}
          initialValue={c.content}
          onSubmit={content => handleUpdate(c.id, content)}
          onCancel={() => setEditId(null)}
          submitLabel="Save"
        />
      );
    }

    return (
      <div className="group relative">
        <div className={`bg-slate-50 rounded-xl px-3 py-2 text-slate-700 whitespace-pre-wrap leading-relaxed ${isReply ? 'text-xs' : 'text-sm'}`}>
          {c.content}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ReactionBar
            commentId={c.id}
            reactions={c.reactions}
            currentUser={currentUser}
            onToggle={handleToggleReaction}
          />
          {!isReply && (
            <button
              onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors mt-1.5 ${
                replyToId === c.id ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
              {(repliesMap[c.id]?.length ?? 0) > 0 && (
                <span className="text-slate-400 font-normal">{repliesMap[c.id].length}</span>
              )}
            </button>
          )}
        </div>

        {c.createdBy === currentUser && (
          <div className="absolute top-1.5 right-2 hidden group-hover:flex gap-1">
            <button onClick={() => setEditId(c.id)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(c.id)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500 transition" title="Delete">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">
        Comments
        {topLevel.length > 0 && (
          <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">
            {topLevel.length}
          </span>
        )}
      </h4>

      {loading ? (
        <div className="text-slate-400 text-xs py-3">Loading comments...</div>
      ) : topLevel.length === 0 ? (
        <div className="text-slate-400 text-xs py-2">No comments yet. Be the first to comment!</div>
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

              {/* Replies */}
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
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(currentUser)}`}>
                    {currentUser[0]?.toUpperCase()}
                  </div>
                  <CommentInput
                    key={`reply-${c.id}`}
                    placeholder={`Reply to @${c.createdBy}...`}
                    submitLabel="Reply"
                    onSubmit={content => handleCreate(content, c.id)}
                    onCancel={() => setReplyToId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New top-level comment */}
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(currentUser)}`}>
          {currentUser[0]?.toUpperCase()}
        </div>
        <CommentInput
          key="new-comment"
          onSubmit={content => handleCreate(content)}
          placeholder="Write a comment..."
          submitLabel="Comment"
        />
      </div>
    </div>
  );
}
