'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove,
  horizontalListSortingStrategy, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant { id: string; name: string; }
interface SeqMessage  { id: string; from: string; to: string; label: string; type: 'sync' | 'async' | 'return'; }
interface SequenceData { participants: Participant[]; messages: SeqMessage[]; }

function uid() { return Math.random().toString(36).slice(2, 8); }

const LANE_W = 160;
const HEAD_H = 62;
const ROW_H  = 64;

function parseData(value: string): SequenceData {
  try {
    const d = JSON.parse(value);
    if (Array.isArray(d?.participants) && Array.isArray(d?.messages)) return d;
  } catch {}
  return {
    participants: [{ id: 'p1', name: 'Client' }, { id: 'p2', name: 'Server' }],
    messages: [],
  };
}

// ─── SVG Diagram ──────────────────────────────────────────────────────────────
function DiagramSvg({ data }: { data: SequenceData }) {
  const { participants, messages } = data;
  const n   = participants.length;
  const W   = Math.max(n * LANE_W + 40, 320);
  const H   = HEAD_H + messages.length * ROW_H + 56;

  function cx(id: string): number | null {
    const idx = participants.findIndex(p => p.id === id);
    return idx < 0 ? null : idx * LANE_W + LANE_W / 2 + 20;
  }

  return (
    <svg width={W} height={H} className="block" style={{ minWidth: W }}>
      {/* Participant headers + lifelines */}
      {participants.map((p, i) => {
        const pcx = i * LANE_W + LANE_W / 2 + 20;
        return (
          <g key={p.id}>
            <rect x={pcx - 58} y={8} width={116} height={38} rx={7}
              fill="#eef2ff" stroke="#a5b4fc" strokeWidth={1.5} />
            <text x={pcx} y={31} textAnchor="middle" fontSize={12} fontWeight={700} fill="#4338ca">
              {p.name.length > 13 ? p.name.slice(0, 11) + '…' : p.name}
            </text>
            <line x1={pcx} y1={HEAD_H} x2={pcx} y2={H - 28}
              stroke="#c7d2fe" strokeWidth={1.5} strokeDasharray="6,4" />
            {/* Bottom box */}
            <rect x={pcx - 32} y={H - 28} width={64} height={20} rx={5}
              fill="#eef2ff" stroke="#a5b4fc" strokeWidth={1} />
          </g>
        );
      })}

      {/* Messages */}
      {messages.map((msg, j) => {
        const y  = HEAD_H + j * ROW_H + ROW_H / 2;
        const x1 = cx(msg.from);
        const x2 = cx(msg.to);
        if (x1 === null || x2 === null) return null;

        const isSelf   = msg.from === msg.to;
        const dashed   = msg.type === 'return';
        const stroke   = dashed ? '#94a3b8' : '#6366f1';
        const midX     = (x1 + x2) / 2;

        if (isSelf) {
          return (
            <g key={msg.id}>
              <path
                d={`M ${x1} ${y - 8} L ${x1 + 44} ${y - 8} L ${x1 + 44} ${y + 8} L ${x1} ${y + 8}`}
                fill="none" stroke={stroke} strokeWidth={1.5}
                strokeDasharray={dashed ? '5,3' : undefined} />
              <polygon points={`${x1},${y + 8} ${x1 + 10},${y + 3} ${x1 + 10},${y + 13}`} fill={stroke} />
              <text x={x1 + 50} y={y + 5} fontSize={11} fill="#475569">{msg.label}</text>
            </g>
          );
        }

        const dir    = x2 > x1 ? 1 : -1;
        const headL  = 10;
        const arrowX = x2 - dir * headL;

        return (
          <g key={msg.id}>
            {/* Row highlight */}
            <rect x={20} y={y - ROW_H / 2 + 2} width={W - 40} height={ROW_H - 4}
              fill={j % 2 === 0 ? 'transparent' : '#f8fafc'} rx={4} />
            {/* Row index */}
            <text x={14} y={y + 4} textAnchor="middle" fontSize={9} fill="#cbd5e1">{j + 1}</text>
            {/* Line */}
            <line x1={x1} y1={y} x2={arrowX} y2={y}
              stroke={stroke} strokeWidth={1.5}
              strokeDasharray={dashed ? '6,3' : undefined} />
            {/* Arrow head */}
            {msg.type === 'async' ? (
              <polyline points={`${arrowX},${y - 6} ${x2},${y} ${arrowX},${y + 6}`}
                fill="none" stroke={stroke} strokeWidth={1.5} />
            ) : (
              <polygon points={`${x2},${y} ${arrowX},${y - 6} ${arrowX},${y + 6}`} fill={stroke} />
            )}
            {/* Label */}
            <text x={midX} y={y - 9} textAnchor="middle" fontSize={11} fill="#334155"
              fontStyle={dashed ? 'italic' : 'normal'}>
              {msg.label || ''}
            </text>
            {/* Type badge */}
            <text x={midX} y={y + 18} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {msg.type}
            </text>
          </g>
        );
      })}

      {messages.length === 0 && (
        <text x={W / 2} y={HEAD_H + 40} textAnchor="middle" fontSize={12} fill="#cbd5e1" fontStyle="italic">
          Add messages below…
        </text>
      )}
    </svg>
  );
}

// ─── Sortable Participant pill ────────────────────────────────────────────────
function SortableParticipant({
  p, onRename, onRemove, canRemove,
}: {
  p: Participant; onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void; canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(p.name);

  function commit() {
    setEditing(false);
    onRename(p.id, draft.trim() || p.name);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-sm font-semibold text-indigo-800
        ${isDragging ? 'opacity-40 shadow-lg' : ''}`}
    >
      <span {...attributes} {...listeners}
        className="text-indigo-300 cursor-grab touch-none text-xs select-none px-0.5">⠿</span>

      {editing ? (
        <input autoFocus value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-24 bg-white border border-indigo-300 rounded px-1.5 py-0 text-sm font-semibold text-indigo-800 focus:outline-none" />
      ) : (
        <span className="cursor-text" onClick={() => setEditing(true)}>{p.name}</span>
      )}

      {canRemove && (
        <button type="button" onClick={() => onRemove(p.id)}
          className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-indigo-300 hover:text-red-400 hover:bg-red-50 transition text-xs leading-none">×</button>
      )}
    </div>
  );
}

// ─── Sortable Message row ─────────────────────────────────────────────────────
const MSG_TYPE_CLS: Record<SeqMessage['type'], string> = {
  sync:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  async:  'bg-violet-50 text-violet-700 border-violet-200',
  return: 'bg-slate-100 text-slate-500 border-slate-200',
};

function SortableMessage({
  msg, participants, onUpdate, onRemove,
}: {
  msg: SeqMessage; participants: Participant[];
  onUpdate: (id: string, u: Partial<SeqMessage>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: msg.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-sm
        ${isDragging ? 'opacity-40 shadow-xl' : ''}`}>
      <span {...attributes} {...listeners}
        className="text-slate-300 cursor-grab touch-none text-xs select-none px-0.5">⠿</span>

      {/* From */}
      <select value={msg.from} onChange={e => onUpdate(msg.id, { from: e.target.value })}
        className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300">
        {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {/* Type */}
      <select value={msg.type} onChange={e => onUpdate(msg.id, { type: e.target.value as SeqMessage['type'] })}
        className={`text-[10px] font-semibold px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${MSG_TYPE_CLS[msg.type]}`}>
        <option value="sync">sync →</option>
        <option value="async">async ⇒</option>
        <option value="return">return ⤶</option>
      </select>

      {/* To */}
      <select value={msg.to} onChange={e => onUpdate(msg.id, { to: e.target.value })}
        className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300">
        {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {/* Label */}
      <input value={msg.label} onChange={e => onUpdate(msg.id, { label: e.target.value })}
        placeholder="Message label…"
        className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-slate-700" />

      <button type="button" onClick={() => onRemove(msg.id)}
        className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition flex-shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SequenceDiagramEditor({
  value, onChange, readOnly = false,
}: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean;
}) {
  const [data, setData] = useState<SequenceData>(() => parseData(value));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function save(next: SequenceData) { setData(next); onChange?.(JSON.stringify(next)); }

  function addParticipant() {
    save({ ...data, participants: [...data.participants, { id: `p${uid()}`, name: `Actor ${data.participants.length + 1}` }] });
  }

  function removeParticipant(id: string) {
    save({ participants: data.participants.filter(p => p.id !== id), messages: data.messages.filter(m => m.from !== id && m.to !== id) });
  }

  function renameParticipant(id: string, name: string) {
    save({ ...data, participants: data.participants.map(p => p.id === id ? { ...p, name } : p) });
  }

  function addMessage() {
    if (data.participants.length < 2) return;
    const [p1, p2] = data.participants;
    save({ ...data, messages: [...data.messages, { id: `m${uid()}`, from: p1.id, to: p2.id, label: '', type: 'sync' }] });
  }

  function updateMessage(id: string, u: Partial<SeqMessage>) {
    save({ ...data, messages: data.messages.map(m => m.id === id ? { ...m, ...u } : m) });
  }

  function removeMessage(id: string) {
    save({ ...data, messages: data.messages.filter(m => m.id !== id) });
  }

  function onDragEndParticipants(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oi = data.participants.findIndex(p => p.id === active.id);
    const ni = data.participants.findIndex(p => p.id === over.id);
    save({ ...data, participants: arrayMove(data.participants, oi, ni) });
  }

  function onDragEndMessages(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oi = data.messages.findIndex(m => m.id === active.id);
    const ni = data.messages.findIndex(m => m.id === over.id);
    save({ ...data, messages: arrayMove(data.messages, oi, ni) });
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Diagram preview */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 overflow-x-auto p-4 min-h-[140px]">
        <DiagramSvg data={data} />
      </div>

      {!readOnly && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4">
          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Participants
                <span className="ml-1.5 text-slate-300 font-normal normal-case tracking-normal">drag to reorder · click name to rename</span>
              </span>
              <button type="button" onClick={addParticipant}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold transition">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndParticipants}>
              <SortableContext items={data.participants.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap gap-2">
                  {data.participants.map(p => (
                    <SortableParticipant key={p.id} p={p}
                      onRename={renameParticipant} onRemove={removeParticipant}
                      canRemove={data.participants.length > 1} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Messages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Messages
                <span className="ml-1.5 text-slate-300 font-normal normal-case tracking-normal">drag to reorder</span>
              </span>
              <button type="button" onClick={addMessage} disabled={data.participants.length < 2}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold transition disabled:opacity-40">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Message
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndMessages}>
              <SortableContext items={data.messages.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {data.messages.map(msg => (
                    <SortableMessage key={msg.id} msg={msg} participants={data.participants}
                      onUpdate={updateMessage} onRemove={removeMessage} />
                  ))}
                  {data.messages.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-3 bg-white rounded-lg border border-dashed border-slate-200">
                      Click "Add Message" to add the first message
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}
