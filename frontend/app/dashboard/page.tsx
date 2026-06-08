'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import IssueForm from '@/components/issues/IssueForm';
import { Issue, TaskStatus, TASK_STATUSES, STATUS_COLORS, PRIORITY_COLORS } from '@/types/issue';
import { issuesApi } from '@/lib/api';

type ViewMode = 'calendar' | 'trello';

// ─── Calendar ────────────────────────────────────────────────────────────────
function CalendarView({ issues, onDateClick }: { issues: Issue[]; onDateClick: (date: string) => void }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const issuesByDate = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return issues.filter(i => !i.isCancelled && (i.targetDate === ds || i.issueCreateDate === ds));
  };

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="font-semibold text-slate-800">{monthNames[month]} {year}</h2>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {dayNames.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[80px] border-r border-b border-slate-100 bg-slate-50/50" />;
          const dayIssues = issuesByDate(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i} onClick={() => onDateClick(dateStr(day))} className="min-h-[80px] border-r border-b border-slate-100 p-1.5 cursor-pointer hover:bg-indigo-50/50 transition group">
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-600 group-hover:text-indigo-600'}`}>{day}</div>
              <div className="space-y-0.5">
                {dayIssues.slice(0, 2).map(issue => (
                  <div key={issue.id} className={`text-xs px-1 py-0.5 rounded truncate ${PRIORITY_COLORS[issue.priority]}`}>{issue.projectName}</div>
                ))}
                {dayIssues.length > 2 && <div className="text-xs text-slate-400 pl-1">+{dayIssues.length - 2} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trello Card (draggable) ──────────────────────────────────────────────────
function IssueCard({ issue, onEdit, ghost }: { issue: Issue; onEdit?: () => void; ghost?: boolean }) {
  return (
    <div
      onClick={onEdit}
      className={`bg-white rounded-lg p-3 border border-slate-100 select-none
        ${ghost ? 'shadow-2xl rotate-2 scale-105 ring-2 ring-indigo-400' : 'shadow-sm hover:shadow-md'}
        ${onEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-grabbing'}
        transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-slate-800 leading-tight">{issue.projectName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
      </div>
      {issue.detail && (
        <p
          className="text-xs text-slate-500 line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{ __html: issue.detail }}
        />
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{issue.codeType}</span>
        {issue.targetDate && <span>{issue.targetDate}</span>}
      </div>
      {issue.developer && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
            {issue.developer[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">{issue.developer}</span>
        </div>
      )}
    </div>
  );
}

function DraggableCard({ issue, onEdit }: { issue: Issue; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform ?? null) }}
      {...attributes}
      {...listeners}
      className={`transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      <IssueCard issue={issue} onEdit={onEdit} />
    </div>
  );
}

// ─── Trello Lane (droppable) ──────────────────────────────────────────────────
function DroppableLane({
  status, issues, onAddInLane, onEdit,
}: {
  status: TaskStatus;
  issues: Issue[];
  onAddInLane: () => void;
  onEdit: (issue: Issue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`flex-shrink-0 w-72 rounded-xl p-3 transition-colors duration-150 ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-100'}`}>
      {/* Lane header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>{status}</span>
          <span className="text-xs text-slate-500 font-medium">{issues.length}</span>
        </div>
        <button
          onClick={onAddInLane}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors duration-150 ${isOver ? 'bg-indigo-100/60' : ''}`}
      >
        {issues.map(issue => (
          <DraggableCard key={issue.id} issue={issue} onEdit={() => onEdit(issue)} />
        ))}
        {issues.length === 0 && (
          <div className={`h-16 flex items-center justify-center rounded-lg border-2 border-dashed text-xs transition-colors duration-150 ${isOver ? 'border-indigo-400 text-indigo-500 bg-indigo-50' : 'border-slate-200 text-slate-300'}`}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trello Board ─────────────────────────────────────────────────────────────
function TrelloView({
  issues, setIssues, onAddInLane, onEdit,
}: {
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  onAddInLane: (status: string) => void;
  onEdit: (issue: Issue) => void;
}) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function onDragStart(event: DragStartEvent) {
    const issue = (event.active.data.current as { issue: Issue }).issue;
    setActiveIssue(issue);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as number;
    const newStatus = over.id as TaskStatus;
    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.taskStatus === newStatus) return;

    // Optimistic update
    const prev = [...issues];
    setIssues(all => all.map(i => i.id === issueId ? { ...i, taskStatus: newStatus } : i));

    try {
      await issuesApi.update(issueId, { ...issue, taskStatus: newStatus });
    } catch {
      setIssues(prev); // rollback
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {TASK_STATUSES.map(status => {
          const laneIssues = issues.filter(i => i.taskStatus === status && !i.isCancelled);
          return (
            <DroppableLane
              key={status}
              status={status}
              issues={laneIssues}
              onAddInLane={() => onAddInLane(status)}
              onEdit={onEdit}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeIssue ? <IssueCard issue={activeIssue} ghost /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [view, setView] = useState<ViewMode>('trello');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('New');

  const load = useCallback(async () => {
    const res = await issuesApi.getAll();
    setIssues(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate(date?: string, status?: string) {
    setDefaultDate(date || '');
    setDefaultStatus(status || 'New');
    setEditIssue(null);
    setShowForm(true);
  }

  function openEdit(issue: Issue) {
    setEditIssue(issue);
    setShowForm(true);
  }

  const stats = {
    total: issues.filter(i => !i.isCancelled).length,
    inProgress: issues.filter(i => i.taskStatus === 'InProgress' && !i.isCancelled).length,
    done: issues.filter(i => i.taskStatus === 'Done' && !i.isCancelled).length,
    critical: issues.filter(i => i.priority === 'Critical' && !i.isCancelled).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track and manage bug issues</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Calendar
              </button>
              <button
                onClick={() => setView('trello')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'trello' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                Board
              </button>
            </div>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Issue
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Issues', value: stats.total, color: 'text-indigo-600' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-purple-600' },
            { label: 'Completed', value: stats.done, color: 'text-green-600' },
            { label: 'Critical', value: stats.critical, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        {view === 'calendar' ? (
          <CalendarView issues={issues} onDateClick={date => openCreate(date)} />
        ) : (
          <TrelloView
            issues={issues}
            setIssues={setIssues}
            onAddInLane={status => openCreate('', status)}
            onEdit={openEdit}
          />
        )}
      </div>

      {showForm && (
        <Modal title={editIssue ? 'Edit Issue' : 'New Issue'} onClose={() => setShowForm(false)} size="xl">
          <IssueForm
            initial={editIssue ?? { taskStatus: defaultStatus as TaskStatus }}
            defaultDate={defaultDate}
            onSuccess={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}
