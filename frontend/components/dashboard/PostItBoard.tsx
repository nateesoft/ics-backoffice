'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { notesApi } from '@/lib/api';

interface NoteReaction {
  id: number;
  emoji: string;
  createdBy: string;
}

interface NoteReply {
  id: number;
  noteId: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface Note {
  id: number;
  content: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reactions: NoteReaction[];
  replyCount: number;
}

const COLORS: Record<string, { bg: string; tape: string; text: string; muted: string; ring: string; dot: string; handle: string; input: string }> = {
  yellow: { bg: 'bg-yellow-100',  tape: 'bg-yellow-300/60',  text: 'text-yellow-950', muted: 'text-yellow-700/60', ring: 'ring-yellow-300',  dot: 'bg-yellow-400',  handle: 'hover:bg-yellow-200/80', input: 'bg-yellow-50 border-yellow-200 focus:ring-yellow-300' },
  green:  { bg: 'bg-green-100',   tape: 'bg-green-300/60',   text: 'text-green-950',  muted: 'text-green-700/60',  ring: 'ring-green-300',   dot: 'bg-green-400',   handle: 'hover:bg-green-200/80',  input: 'bg-green-50 border-green-200 focus:ring-green-300' },
  blue:   { bg: 'bg-blue-100',    tape: 'bg-blue-300/60',    text: 'text-blue-950',   muted: 'text-blue-700/60',   ring: 'ring-blue-300',    dot: 'bg-blue-400',    handle: 'hover:bg-blue-200/80',   input: 'bg-blue-50 border-blue-200 focus:ring-blue-300' },
  pink:   { bg: 'bg-pink-100',    tape: 'bg-pink-300/60',    text: 'text-pink-950',   muted: 'text-pink-700/60',   ring: 'ring-pink-300',    dot: 'bg-pink-400',    handle: 'hover:bg-pink-200/80',   input: 'bg-pink-50 border-pink-200 focus:ring-pink-300' },
  purple: { bg: 'bg-purple-100',  tape: 'bg-purple-300/60',  text: 'text-purple-950', muted: 'text-purple-700/60', ring: 'ring-purple-300',  dot: 'bg-purple-400',  handle: 'hover:bg-purple-200/80', input: 'bg-purple-50 border-purple-200 focus:ring-purple-300' },
  orange: { bg: 'bg-orange-100',  tape: 'bg-orange-300/60',  text: 'text-orange-950', muted: 'text-orange-700/60', ring: 'ring-orange-300',  dot: 'bg-orange-400',  handle: 'hover:bg-orange-200/80', input: 'bg-orange-50 border-orange-200 focus:ring-orange-300' },
};
const COLOR_KEYS = Object.keys(COLORS);
const ROTATIONS = [-1.5, 1, -0.8, 2, 0, -1, 1.5, -2, 0.5, -0.5];
const REACTION_EMOJIS = ['👍', '❤️', '😄', '🎉', '👀', '🚀', '🤔', '😮'];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({
  note,
  currentUser,
  onClose,
  onReactionToggle,
}: {
  note: Note;
  currentUser: string;
  onClose: () => void;
  onReactionToggle: (noteId: number, emoji: string) => Promise<void>;
}) {
  const [replies, setReplies] = useState<NoteReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const palette = COLORS[note.color] ?? COLORS.yellow;

  useEffect(() => {
    notesApi.getReplies(note.id).then(res => {
      setReplies(res.data);
      setLoading(false);
    });
  }, [note.id]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const res = await notesApi.addReply(note.id, text.trim());
    setReplies(prev => [...prev, res.data]);
    setText('');
    setSubmitting(false);
  }

  async function handleDelete(replyId: number) {
    await notesApi.deleteReply(note.id, replyId);
    setReplies(prev => prev.filter(r => r.id !== replyId));
  }

  // aggregate reactions
  const reactionMap = new Map<string, { count: number; mine: boolean }>();
  for (const r of note.reactions) {
    const prev = reactionMap.get(r.emoji) ?? { count: 0, mine: false };
    reactionMap.set(r.emoji, { count: prev.count + 1, mine: prev.mine || r.createdBy === currentUser });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — note content preview */}
        <div className={`${palette.bg} px-5 pt-5 pb-4`}>
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words flex-1 ${palette.text}`}>
              {note.content || <span className="opacity-40 italic">Empty note</span>}
            </p>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={`mt-2 text-[11px] ${palette.muted}`}>
            <span className="font-medium">{note.createdBy}</span>
            <span className="mx-1">·</span>
            <span>{formatRelative(note.updatedAt ?? note.createdAt)}</span>
          </div>

          {/* Reactions row */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {Array.from(reactionMap.entries()).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => onReactionToggle(note.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition
                  ${mine
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white/60 border-white/80 text-slate-600 hover:bg-white'
                  }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
            {/* Add reaction */}
            <EmojiPickerInline
              onPick={emoji => onReactionToggle(note.id, emoji)}
              palette={palette}
            />
          </div>
        </div>

        {/* Replies */}
        <div className="px-5 py-4 max-h-64 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
          ) : replies.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No replies yet — be the first!</p>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className="flex items-start gap-2.5 group">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {reply.createdBy[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">{reply.createdBy}</span>
                    <span className="text-[10px] text-slate-400">{formatRelative(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
                </div>
                {reply.createdBy === currentUser && (
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition flex-shrink-0"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-slate-100 pt-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any);
              }}
              placeholder="Write a reply..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="self-end px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Ctrl+Enter to send</p>
        </form>
      </div>
    </div>
  );
}

// ─── Emoji Picker Inline ──────────────────────────────────────────────────────
function EmojiPickerInline({ onPick, palette }: { onPick: (emoji: string) => void; palette: (typeof COLORS)[string] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-white/60 border border-white/80 hover:bg-white text-slate-500 transition text-sm"
        title="Add reaction"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-2 flex gap-1">
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onPick(emoji); setOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Emoji Picker on Card ─────────────────────────────────────────────────────
function EmojiPickerOnCard({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/10 text-current/60 hover:text-current transition"
        title="React"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 z-30 bg-white rounded-xl border border-slate-200 shadow-xl p-2 flex gap-1">
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onPick(emoji); setOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post-it Card ─────────────────────────────────────────────────────────────
function PostIt({
  note,
  index,
  currentUser,
  onSave,
  onDelete,
  onColorChange,
  onReactionToggle,
  onOpenReplies,
  autoFocus,
  dragHandleProps,
  isDragging,
  isOverlay,
}: {
  note: Note;
  index: number;
  currentUser: string;
  onSave?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onColorChange?: (id: number, color: string) => void;
  onReactionToggle?: (noteId: number, emoji: string) => Promise<void>;
  onOpenReplies?: (note: Note) => void;
  autoFocus?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const [editing, setEditing] = useState(autoFocus);
  const [text, setText] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const palette = COLORS[note.color] ?? COLORS.yellow;
  const rotation = isOverlay ? 3 : ROTATIONS[index % ROTATIONS.length];

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  useEffect(() => { setText(note.content); }, [note.content]);

  function commitEdit() {
    setEditing(false);
    if (text.trim() !== note.content) onSave?.(note.id, text.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setText(note.content); setEditing(false); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commitEdit();
  }

  // aggregate reactions for display
  const reactionMap = new Map<string, { count: number; mine: boolean }>();
  for (const r of note.reactions ?? []) {
    const prev = reactionMap.get(r.emoji) ?? { count: 0, mine: false };
    reactionMap.set(r.emoji, { count: prev.count + 1, mine: prev.mine || r.createdBy === currentUser });
  }
  const hasReactions = reactionMap.size > 0;

  return (
    <div
      className="group relative flex-shrink-0"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center top',
        opacity: isDragging ? 0.25 : 1,
      }}
    >
      {/* Tape */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 ${palette.tape} rounded-sm shadow-sm z-10`} />

      <div
        className={`relative w-52 ${palette.bg} rounded-sm pt-5 pb-3 px-4
          shadow-[0_4px_12px_rgba(0,0,0,0.12),_0_1px_3px_rgba(0,0,0,0.08)]
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-[1.03]
          transition-all duration-200 select-none
          ${isOverlay ? 'shadow-[0_16px_40px_rgba(0,0,0,0.25)] scale-105 ring-2 ' + palette.ring : ''}
          ${editing ? 'ring-2 ' + palette.ring + ' scale-[1.03] shadow-[0_8px_24px_rgba(0,0,0,0.18)]' : ''}`}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={`absolute top-2 left-2 p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing transition ${palette.handle} touch-none`}
          title="Drag to move"
          onMouseDown={e => e.stopPropagation()}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete?.(note.id)}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-black/10 transition"
          title="Delete note"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        {editing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            placeholder="Type a note..."
            className={`w-full min-h-[5rem] resize-none bg-transparent focus:outline-none text-sm leading-relaxed ${palette.text} placeholder-current/40 select-text`}
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className={`min-h-[5rem] text-sm leading-relaxed cursor-text whitespace-pre-wrap break-words
              ${text ? palette.text : 'opacity-35 italic'}`}
          >
            {text || 'Click to add a note...'}
          </p>
        )}

        {/* Reactions display */}
        {!isOverlay && hasReactions && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Array.from(reactionMap.entries()).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onReactionToggle?.(note.id, emoji); }}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition
                  ${mine
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white/50 border-white/70 text-slate-600 hover:bg-white/80'
                  }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between gap-1">
          <div className={`text-[10px] ${palette.muted} leading-tight min-w-0 truncate`}>
            <span className="font-medium">{note.createdBy}</span>
            <span className="mx-0.5">·</span>
            <span>{formatRelative(note.updatedAt ?? note.createdAt)}</span>
          </div>

          {!isOverlay && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Emoji picker */}
              <EmojiPickerOnCard onPick={emoji => onReactionToggle?.(note.id, emoji)} />

              {/* Reply button */}
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onOpenReplies?.(note); }}
                className="flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5 hover:bg-black/10 transition text-current/60 hover:text-current"
                title="Replies"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {note.replyCount > 0 && <span className="font-medium">{note.replyCount}</span>}
              </button>
            </div>
          )}
        </div>

        {/* Color palette (on hover, absolute) */}
        {!isOverlay && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto">
            {COLOR_KEYS.map(c => (
              <button
                key={c}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onColorChange?.(note.id, c); }}
                className={`w-3 h-3 rounded-full ${COLORS[c].dot} hover:scale-125 transition ${note.color === c ? 'ring-2 ring-offset-1 ring-slate-500' : ''}`}
                title={c}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sortable wrapper ─────────────────────────────────────────────────────────
function SortablePostIt(props: Parameters<typeof PostIt>[0]) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.note.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <PostIt
        {...props}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Add Note Button ──────────────────────────────────────────────────────────
function AddNoteButton({ onCreate }: { onCreate: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0 self-start mt-3 z-50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition shadow-sm hover:shadow-md"
        title="Add note"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 min-w-max">
          <p className="text-xs text-slate-400 font-medium text-center mb-3">Pick a color</p>
          <div className="grid grid-cols-3 gap-3">
            {COLOR_KEYS.map(c => (
              <button
                key={c}
                onClick={() => { setOpen(false); onCreate(c); }}
                className={`w-10 h-10 rounded-xl ${COLORS[c].bg} border-2 border-white shadow-sm hover:scale-110 hover:shadow-md transition`}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function PostItBoard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteId, setNewNoteId] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [replyNote, setReplyNote] = useState<Note | null>(null);
  const [currentUser, setCurrentUser] = useState('');
  const activeIndex = activeNote ? notes.findIndex(n => n.id === activeNote.id) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    const res = await notesApi.getAll();
    setNotes(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    import('@/lib/api').then(({ authApi }) => {
      authApi.me().then(res => setCurrentUser(res.data.username)).catch(() => {});
    });
  }, []);

  async function handleCreate(color: string) {
    const res = await notesApi.create({ content: '', color });
    const newNote: Note = res.data;
    setNotes(prev => [newNote, ...prev]);
    setNewNoteId(newNote.id);
  }

  async function handleSave(id: number, content: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    await notesApi.update(id, { content });
    setNewNoteId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this note?')) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    await notesApi.remove(id);
  }

  async function handleColorChange(id: number, color: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
    await notesApi.update(id, { color });
  }

  async function handleReactionToggle(noteId: number, emoji: string) {
    const res = await notesApi.toggleReaction(noteId, emoji);
    const updatedReactions: NoteReaction[] = res.data;
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, reactions: updatedReactions } : n));
    // keep reply modal in sync
    setReplyNote(prev => prev?.id === noteId ? { ...prev, reactions: updatedReactions } : prev);
  }

  function handleDragStart(event: DragStartEvent) {
    const note = notes.find(n => n.id === event.active.id);
    if (note) setActiveNote(note);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveNote(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex(n => n.id === active.id);
    const newIndex = notes.findIndex(n => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);

    setNotes(reordered);
    await notesApi.reorder(reordered.map(n => n.id));
  }

  function handleOpenReplies(note: Note) {
    setReplyNote(note);
  }

  function handleReplyCountChange(noteId: number, delta: number) {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, replyCount: n.replyCount + delta } : n));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {notes.length > 0 && (
          <span className="text-xs text-slate-400">{notes.length} note{notes.length > 1 ? 's' : ''}</span>
        )}
        <span className="text-xs text-slate-300">· drag handle to reorder</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={notes.map(n => n.id)} strategy={rectSortingStrategy}>
          <div className="flex items-start gap-6 flex-wrap">
            {notes.map((note, i) => (
              <SortablePostIt
                key={note.id}
                note={note}
                index={i}
                currentUser={currentUser}
                onSave={handleSave}
                onDelete={handleDelete}
                onColorChange={handleColorChange}
                onReactionToggle={handleReactionToggle}
                onOpenReplies={handleOpenReplies}
                autoFocus={note.id === newNoteId}
              />
            ))}
            <AddNoteButton onCreate={handleCreate} />
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeNote && (
            <PostIt
              note={activeNote}
              index={activeIndex}
              currentUser={currentUser}
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {notes.length === 0 && (
        <p className="text-xs text-slate-400 pl-1">No notes yet — click + to add one.</p>
      )}

      {replyNote && (
        <ReplyModal
          note={replyNote}
          currentUser={currentUser}
          onClose={() => setReplyNote(null)}
          onReactionToggle={handleReactionToggle}
        />
      )}
    </div>
  );
}
