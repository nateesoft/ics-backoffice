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
import IssueDetail from '@/components/issues/IssueDetail';
import PostItBoard from '@/components/dashboard/PostItBoard';
import { Issue, TaskStatus, TASK_STATUSES, PRIORITIES, CODE_TYPES, ISSUE_TAGS, STATUS_COLORS, PRIORITY_COLORS, TAG_COLORS, IssueTag } from '@/types/issue';
import { issuesApi, authApi, usersApi } from '@/lib/api';

interface SystemUser { id: number; username: string; }

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

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function AgeBadge({ createdAt }: { createdAt: string }) {
  const days = daysAgo(createdAt);
  const [cls, label] = days === 0
    ? ['bg-emerald-50 text-emerald-600 border-emerald-200', 'Today']
    : days <= 3
    ? ['bg-emerald-50 text-emerald-600 border-emerald-200', `${days}d`]
    : days <= 7
    ? ['bg-yellow-50 text-yellow-600 border-yellow-200', `${days}d`]
    : days <= 14
    ? ['bg-orange-50 text-orange-600 border-orange-200', `${days}d`]
    : ['bg-red-50 text-red-600 border-red-200', `${days}d`];
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border leading-none ${cls}`} title={`Created ${days} day${days !== 1 ? 's' : ''} ago`}>
      {label}
    </span>
  );
}

// ─── Trello Card ──────────────────────────────────────────────────────────────
function IssueCard({ issue, onView, ghost }: { issue: Issue; onView?: () => void; ghost?: boolean }) {
  return (
    <div
      onClick={onView}
      className={`bg-white rounded-lg p-3 border border-slate-100 select-none
        ${ghost ? 'shadow-2xl rotate-2 scale-105 ring-2 ring-indigo-400' : 'shadow-sm hover:shadow-md'}
        ${onView ? 'cursor-pointer' : 'cursor-grabbing'}
        transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-slate-800 leading-tight">{issue.projectName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
      </div>
      {issue.tags && issue.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.tags.map(tag => (
            <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag as IssueTag] ?? 'bg-slate-100 text-slate-600'}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {issue.detail && (
        <p
          className="text-xs text-slate-500 line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{ __html: issue.detail }}
        />
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{issue.codeType}</span>
        <div className="flex items-center gap-1.5">
          {issue.targetDate && <span>{issue.targetDate}</span>}
          <AgeBadge createdAt={issue.createdAt} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {issue.developer ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
              {issue.developer[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">{issue.developer}</span>
          </div>
        ) : <span />}
        {issue.createdBy && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400" title={`Created by ${issue.createdBy}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span>{issue.createdBy}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ issue, onView, onCancel }: { issue: Issue; onView: () => void; onCancel: () => void }) {
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
      <div className="relative group">
        <IssueCard issue={issue} onView={onView} />
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onCancel(); }}
          className="absolute top-1.5 right-1.5 hidden group-hover:flex w-5 h-5 items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition border border-red-100"
          title="Cancel issue"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Droppable Lane ───────────────────────────────────────────────────────────
function DroppableLane({
  status, issues, onAddInLane, onView, onCancel,
}: {
  status: TaskStatus;
  issues: Issue[];
  onAddInLane: () => void;
  onView: (issue: Issue) => void;
  onCancel: (issueId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`flex-shrink-0 w-72 rounded-xl p-3 transition-colors duration-150 ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-100'}`}>
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

      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors duration-150 ${isOver ? 'bg-indigo-100/60' : ''}`}
      >
        {issues.map(issue => (
          <DraggableCard
            key={issue.id}
            issue={issue}
            onView={() => onView(issue)}
            onCancel={() => onCancel(issue.id)}
          />
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

// ─── Cancelled Lane ───────────────────────────────────────────────────────────
function CancelledLane({
  issues, onRestore, onView,
}: {
  issues: Issue[];
  onRestore: (issueId: number) => void;
  onView: (issue: Issue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: '__cancelled__' });

  return (
    <div className={`flex-shrink-0 w-72 rounded-xl p-3 transition-colors duration-150 ${isOver ? 'bg-red-50 ring-2 ring-red-300' : 'bg-slate-100'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
          Cancelled
        </span>
        <span className="text-xs text-slate-500 font-medium">{issues.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors duration-150 ${isOver ? 'bg-red-100/60' : ''}`}
      >
        {issues.map(issue => (
          <div key={issue.id} className="relative group">
            <div
              onClick={() => onView(issue)}
              className="opacity-55 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <IssueCard issue={issue} />
            </div>
            <button
              onClick={() => onRestore(issue.id)}
              className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-medium border border-emerald-200 transition"
              title="Restore issue"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Restore
            </button>
          </div>
        ))}
        {issues.length === 0 && (
          <div className={`h-16 flex items-center justify-center rounded-lg border-2 border-dashed text-xs transition-colors duration-150 ${isOver ? 'border-red-400 text-red-500 bg-red-50' : 'border-slate-200 text-slate-300'}`}>
            Drag here to cancel
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trello Board ─────────────────────────────────────────────────────────────
function TrelloView({
  issues, setIssues, onAddInLane, onView,
}: {
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  onAddInLane: (status: string) => void;
  onView: (issue: Issue) => void;
}) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function onDragStart(event: DragStartEvent) {
    const issue = (event.active.data.current as { issue: Issue }).issue;
    setActiveIssue(issue);
  }

  async function doCancelIssue(issueId: number) {
    setIssues(all => all.map(i => i.id === issueId ? { ...i, isCancelled: true } : i));
    try {
      await issuesApi.cancel(issueId);
    } catch {
      setIssues(all => all.map(i => i.id === issueId ? { ...i, isCancelled: false } : i));
    }
  }

  async function handleCancelBtn(issueId: number) {
    if (!confirm('Cancel this issue?')) return;
    await doCancelIssue(issueId);
  }

  async function handleRestore(issueId: number) {
    setIssues(all => all.map(i => i.id === issueId ? { ...i, isCancelled: false } : i));
    try {
      await issuesApi.restore(issueId);
    } catch {
      setIssues(all => all.map(i => i.id === issueId ? { ...i, isCancelled: true } : i));
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as number;
    const overId = over.id as string;
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    if (overId === '__cancelled__') {
      if (issue.isCancelled) return;
      await doCancelIssue(issueId);
      return;
    }

    const newStatus = overId as TaskStatus;
    if (!issue.isCancelled && issue.taskStatus === newStatus) return;

    setIssues(all => all.map(i => i.id === issueId ? { ...i, taskStatus: newStatus } : i));
    try {
      await issuesApi.update(issueId, { ...issue, taskStatus: newStatus });
    } catch {
      setIssues(all => all.map(i => i.id === issueId ? { ...i, taskStatus: issue.taskStatus } : i));
    }
  }

  const cancelledIssues = issues.filter(i => i.isCancelled);

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
              onView={onView}
              onCancel={handleCancelBtn}
            />
          );
        })}
        <CancelledLane
          issues={cancelledIssues}
          onRestore={handleRestore}
          onView={onView}
        />
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

// ─── User Filter Bar ──────────────────────────────────────────────────────────
function UserFilterBar({ users, selected, onChange }: {
  users: SystemUser[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (users.length === 0) return null;

  function toggleUser(username: string) {
    const next = new Set(selected);
    if (next.has(username)) next.delete(username); else next.add(username);
    onChange(next);
  }

  const allActive = selected.size === 0;
  const avatarColors = [
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-teal-100 text-teal-700',
    'bg-fuchsia-100 text-fuchsia-700',
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(new Set())}
        title="Show all"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
          ${allActive
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        All
      </button>

      {users.map((user, idx) => {
        const active = selected.has(user.username);
        const colorCls = avatarColors[idx % avatarColors.length];
        return (
          <button
            key={user.id}
            onClick={() => toggleUser(user.username)}
            title={user.username}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none
              ${active ? 'bg-white/20 text-white' : colorCls}`}>
              {user.username[0]?.toUpperCase()}
            </div>
            {user.username}
          </button>
        );
      })}

      {selected.size > 0 && (
        <span className="text-[10px] text-slate-400 font-medium ml-1">
          {selected.size} selected
        </span>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [view, setView] = useState<ViewMode>('trello');
  const [showNotes, setShowNotes] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [viewIssue, setViewIssue] = useState<Issue | null>(null);
  const [cloneIssue, setCloneIssue] = useState<Issue | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('New');
  const [currentUser, setCurrentUser] = useState('');
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [boardSearch, setBoardSearch] = useState('');
  const [boardPriority, setBoardPriority] = useState('');
  const [boardCodeType, setBoardCodeType] = useState('');
  const [boardTag, setBoardTag] = useState('');

  function currentMonthRange() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
  }

  const defaultDateRange = currentMonthRange();
  const [dateFrom, setDateFrom] = useState(defaultDateRange.from);
  const [dateTo, setDateTo] = useState(defaultDateRange.to);

  const hasBoardFilters = boardSearch || boardPriority || boardCodeType || boardTag || selectedUsers.size > 0;
  function clearBoardFilters() {
    setBoardSearch('');
    setBoardPriority('');
    setBoardCodeType('');
    setBoardTag('');
    setSelectedUsers(new Set());
    const range = currentMonthRange();
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  const load = useCallback(async () => {
    const res = await issuesApi.getAll();
    setIssues(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    authApi.me().then(res => setCurrentUser(res.data.username)).catch(() => {});
    usersApi.getAll().then(res => setSystemUsers(res.data)).catch(() => {});
  }, []);

  const filteredIssues = issues.filter(i => {
    if (selectedUsers.size > 0 && !(
      (i.developer && selectedUsers.has(i.developer)) ||
      (i.tester && selectedUsers.has(i.tester))
    )) return false;
    if (boardPriority && i.priority !== boardPriority) return false;
    if (boardCodeType && i.codeType !== boardCodeType) return false;
    if (boardTag && !(i.tags ?? []).includes(boardTag)) return false;
    if (boardSearch) {
      const q = boardSearch.toLowerCase();
      if (!i.projectName.toLowerCase().includes(q) &&
          !(i.developer ?? '').toLowerCase().includes(q)) return false;
    }
    if (dateFrom && i.issueCreateDate < dateFrom) return false;
    if (dateTo && i.issueCreateDate > dateTo) return false;
    return true;
  });

  function openCreate(date?: string, status?: string) {
    setDefaultDate(date || '');
    setDefaultStatus(status || 'New');
    setEditIssue(null);
    setShowForm(true);
  }

  function openView(issue: Issue) {
    setViewIssue(issue);
  }

  function openEdit(issue: Issue) {
    setViewIssue(null);
    setEditIssue(issue);
    setShowForm(true);
  }

  function openClone(issue: Issue) {
    setViewIssue(null);
    setEditIssue(null);
    setCloneIssue(issue);
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

        {/* Post-it Notes */}
        <div className="bg-white/60 rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setShowNotes(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 transition rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v12l-4 4H4V4z" /></svg>
              <span className="text-sm font-semibold text-slate-600">Quick Notes</span>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showNotes ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showNotes && (
            <div className="px-5 pb-4">
              <PostItBoard />
            </div>
          )}
        </div>

        {/* Board Filters (Trello only) */}
        {view === 'trello' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-4 space-y-3">
            {/* Row 1: date range + search + dropdowns + clear */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Date range */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none text-slate-700 w-32"
                />
                <span className="text-slate-400 text-xs font-medium">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none text-slate-700 w-32"
                />
              </div>
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search project or developer..."
                  value={boardSearch}
                  onChange={e => setBoardSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <select
                value={boardPriority}
                onChange={e => setBoardPriority(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
              <select
                value={boardCodeType}
                onChange={e => setBoardCodeType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Code Types</option>
                {CODE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select
                value={boardTag}
                onChange={e => setBoardTag(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Tags</option>
                {ISSUE_TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
              {hasBoardFilters && (
                <button
                  onClick={clearBoardFilters}
                  className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition flex items-center gap-1.5 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </div>
            {/* Row 2: Assignee avatars */}
            {systemUsers.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Assignee</span>
                <UserFilterBar users={systemUsers} selected={selectedUsers} onChange={setSelectedUsers} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {view === 'calendar' ? (
          <CalendarView issues={filteredIssues} onDateClick={date => openCreate(date)} />
        ) : (
          <TrelloView
            issues={filteredIssues}
            setIssues={setIssues}
            onAddInLane={status => openCreate('', status)}
            onView={openView}
          />
        )}
      </div>

      {/* View Detail Modal */}
      {viewIssue && (
        <Modal
          title={`Issue #${viewIssue.id} — ${viewIssue.projectName}`}
          onClose={() => setViewIssue(null)}
          size="xl"
          action={
            !viewIssue.isCancelled ? (
              <button
                onClick={() => openEdit(viewIssue)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            ) : undefined
          }
        >
          <IssueDetail issue={viewIssue} currentUser={currentUser} onClone={openClone} />
        </Modal>
      )}

      {showForm && (
        <Modal
          title={editIssue ? 'Edit Issue' : cloneIssue ? `Clone Issue #${cloneIssue.id} — ${cloneIssue.projectName}` : 'New Issue'}
          onClose={() => { setShowForm(false); setCloneIssue(null); }}
          size="xl"
        >
          <IssueForm
            initial={editIssue || (cloneIssue ? {
              ...cloneIssue,
              id: undefined as any,
              taskStatus: 'New' as any,
              deploymentStatus: 'Wait Approve' as any,
              issueCreateDate: new Date().toISOString().split('T')[0],
              isCancelled: undefined as any,
            } : { taskStatus: defaultStatus as TaskStatus })}
            defaultDate={cloneIssue ? undefined : defaultDate}
            onSuccess={() => { setShowForm(false); setCloneIssue(null); load(); }}
            onCancel={() => { setShowForm(false); setCloneIssue(null); }}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}
