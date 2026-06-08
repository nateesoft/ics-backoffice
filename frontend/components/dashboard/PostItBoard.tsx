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

interface Note {
  id: number;
  content: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const COLORS: Record<string, { bg: string; tape: string; text: string; muted: string; ring: string; dot: string; handle: string }> = {
  yellow: { bg: 'bg-yellow-100',  tape: 'bg-yellow-300/60',  text: 'text-yellow-950', muted: 'text-yellow-700/60', ring: 'ring-yellow-300',  dot: 'bg-yellow-400',  handle: 'hover:bg-yellow-200/80' },
  green:  { bg: 'bg-green-100',   tape: 'bg-green-300/60',   text: 'text-green-950',  muted: 'text-green-700/60',  ring: 'ring-green-300',   dot: 'bg-green-400',   handle: 'hover:bg-green-200/80' },
  blue:   { bg: 'bg-blue-100',    tape: 'bg-blue-300/60',    text: 'text-blue-950',   muted: 'text-blue-700/60',   ring: 'ring-blue-300',    dot: 'bg-blue-400',    handle: 'hover:bg-blue-200/80' },
  pink:   { bg: 'bg-pink-100',    tape: 'bg-pink-300/60',    text: 'text-pink-950',   muted: 'text-pink-700/60',   ring: 'ring-pink-300',    dot: 'bg-pink-400',    handle: 'hover:bg-pink-200/80' },
  purple: { bg: 'bg-purple-100',  tape: 'bg-purple-300/60',  text: 'text-purple-950', muted: 'text-purple-700/60', ring: 'ring-purple-300',  dot: 'bg-purple-400',  handle: 'hover:bg-purple-200/80' },
  orange: { bg: 'bg-orange-100',  tape: 'bg-orange-300/60',  text: 'text-orange-950', muted: 'text-orange-700/60', ring: 'ring-orange-300',  dot: 'bg-orange-400',  handle: 'hover:bg-orange-200/80' },
};
const COLOR_KEYS = Object.keys(COLORS);
const ROTATIONS = [-1.5, 1, -0.8, 2, 0, -1, 1.5, -2, 0.5, -0.5];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

// ─── Post-it Card ─────────────────────────────────────────────────────────────
function PostIt({
  note,
  index,
  onSave,
  onDelete,
  onColorChange,
  autoFocus,
  dragHandleProps,
  isDragging,
  isOverlay,
}: {
  note: Note;
  index: number;
  onSave?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onColorChange?: (id: number, color: string) => void;
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
        className={`relative w-52 min-h-[10.5rem] ${palette.bg} rounded-sm pt-5 pb-3 px-4
          shadow-[0_4px_12px_rgba(0,0,0,0.12),_0_1px_3px_rgba(0,0,0,0.08)]
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-[1.03]
          transition-all duration-200 select-none
          ${isOverlay ? 'shadow-[0_16px_40px_rgba(0,0,0,0.25)] scale-105 ring-2 ' + palette.ring : ''}
          ${editing ? 'ring-2 ' + palette.ring + ' scale-[1.03] shadow-[0_8px_24px_rgba(0,0,0,0.18)]' : ''}`}
      >
        {/* Drag handle — top-left, grab cursor */}
        <div
          {...dragHandleProps}
          className={`absolute top-2 left-2 p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing transition ${palette.handle} touch-none`}
          title="Drag to move"
          onMouseDown={e => e.stopPropagation()} // prevent card click when using handle
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
            className={`w-full min-h-[5.5rem] resize-none bg-transparent focus:outline-none text-sm leading-relaxed ${palette.text} placeholder-current/40 select-text`}
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className={`min-h-[5.5rem] text-sm leading-relaxed cursor-text whitespace-pre-wrap break-words
              ${text ? palette.text : 'opacity-35 italic'}`}
          >
            {text || 'Click to add a note...'}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className={`text-[10px] ${palette.muted} leading-tight`}>
            <span className="font-medium">{note.createdBy}</span>
            <span className="mx-1">·</span>
            <span>{formatRelative(note.updatedAt ?? note.createdAt)}</span>
          </div>

          {/* Color palette (on hover) */}
          {!isOverlay && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              {COLOR_KEYS.map(c => (
                <button
                  key={c}
                  onClick={() => onColorChange?.(note.id, c)}
                  className={`w-3.5 h-3.5 rounded-full ${COLORS[c].dot} hover:scale-125 transition ${note.color === c ? 'ring-2 ring-offset-1 ring-slate-500' : ''}`}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>
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
    <div ref={ref} className="relative flex-shrink-0 self-start mt-3">
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
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white rounded-2xl border border-slate-200 shadow-xl p-3">
          <p className="text-xs text-slate-400 font-medium text-center mb-2">Pick a color</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_KEYS.map(c => (
              <button
                key={c}
                onClick={() => { setOpen(false); onCreate(c); }}
                className={`w-10 h-10 rounded-xl ${COLORS[c].bg} border-2 border-white shadow-md hover:scale-110 transition`}
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
  const activeIndex = activeNote ? notes.findIndex(n => n.id === activeNote.id) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    const res = await notesApi.getAll();
    setNotes(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16v12l-4 4H4V4z" />
        </svg>
        <h2 className="text-sm font-semibold text-slate-700">Quick Notes</h2>
        {notes.length > 0 && (
          <span className="text-xs text-slate-400">{notes.length} note{notes.length > 1 ? 's' : ''}</span>
        )}
        <span className="text-xs text-slate-300 ml-1">· drag handle to reorder</span>
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
                onSave={handleSave}
                onDelete={handleDelete}
                onColorChange={handleColorChange}
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
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {notes.length === 0 && (
        <p className="text-xs text-slate-400 pl-1">No notes yet — click + to add one.</p>
      )}
    </div>
  );
}
