'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { projectPlansApi, ProjectPlan, ProjectPhase } from '@/lib/api';
import DatePickerInput from '@/components/ui/DatePickerInput';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const PHASE_PRESETS = [
  { name: 'Development', color: '#3b82f6' },
  { name: 'Testing',     color: '#f59e0b' },
  { name: 'Deployment',  color: '#10b981' },
  { name: 'Production',  color: '#8b5cf6' },
  { name: 'Design',      color: '#ec4899' },
  { name: 'Review',      color: '#06b6d4' },
];

const PX_PER_DAY  = 5;
const ROW_H_BASE  = 52;
const PHASE_STRIP = 26;
const NAME_W      = 220;
const HEADER_H    = 48;

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
  ));
}

function getMonths(start: string, end: string) {
  const list: { year: number; month: number; days: number; label: string }[] = [];
  const startD = new Date(start + 'T00:00:00');
  const endD   = new Date(end   + 'T00:00:00');
  let cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
  while (cur <= endD) {
    const y = cur.getFullYear(), m = cur.getMonth();
    list.push({ year: y, month: m, days: new Date(y, m + 1, 0).getDate(),
      label: cur.toLocaleString('th-TH', { month: 'short', year: '2-digit' }) });
    cur = new Date(y, m + 1, 1);
  }
  return list;
}

const emptyForm      = { name: '', description: '', startDate: '', endDate: '', color: COLORS[0] };
const emptyPhaseForm = { name: '', startDate: '', endDate: '', color: PHASE_PRESETS[0].color };

// ─── PhaseForm ─────────────────────────────────────────────────────────────
function PhaseForm({ value, onChange, saving, projectStart, onSave, onCancel, isEdit }: {
  value: typeof emptyPhaseForm;
  onChange: (v: typeof emptyPhaseForm) => void;
  saving: boolean;
  projectStart: string;
  onSave: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const valid = value.name.trim() && value.startDate && value.endDate && value.endDate >= value.startDate;
  return (
    <div className="bg-slate-900/80 rounded-lg p-3 space-y-2.5 border border-slate-700/60">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1">
        {PHASE_PRESETS.map(p => {
          const active = value.name === p.name;
          return (
            <button key={p.name} type="button"
              onClick={() => onChange({ ...value, name: p.name, color: p.color })}
              className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
              style={{
                borderColor: active ? p.color : 'transparent',
                background: active ? p.color + '28' : '#1e293b',
                color: active ? p.color : '#64748b',
              }}
            >{p.name}</button>
          );
        })}
      </div>

      {/* Name */}
      <input
        type="text" autoFocus
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        placeholder="ชื่อ Phase / Tag"
        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <DatePickerInput value={value.startDate} onChange={v => onChange({ ...value, startDate: v })}
          min={projectStart} placeholder="Start" />
        <DatePickerInput value={value.endDate} onChange={v => onChange({ ...value, endDate: v })}
          min={value.startDate || projectStart} placeholder="End" />
      </div>

      {/* Color */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => onChange({ ...value, color: c })}
            className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
            style={{
              background: c,
              outline: value.color === c ? '2px solid white' : '2px solid transparent',
              outlineOffset: 1,
              transform: value.color === c ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="px-3 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving || !valid}
          className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-40">
          {saving ? '...' : isEdit ? 'Update' : 'Add Phase'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PlanningPage() {
  const today = toDateStr(new Date());

  const [projects,    setProjects]    = useState<ProjectPlan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState<ProjectPlan | null>(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);

  // Phase state
  const [addingPhase,    setAddingPhase]    = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [phaseForm,      setPhaseForm]      = useState(emptyPhaseForm);
  const [savingPhase,    setSavingPhase]    = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const didScroll  = useRef(false);

  useEffect(() => {
    projectPlansApi.getAll()
      .then(r => { setProjects(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const rangeStart = useMemo(() => {
    if (!projects.length) return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const min = projects.reduce((a, p) => p.startDate < a ? p.startDate : a, projects[0].startDate);
    const d = new Date(min + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, [projects]);

  const rangeEnd = useMemo(() => {
    if (!projects.length) return new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
    const max = projects.reduce((a, p) => p.endDate > a ? p.endDate : a, projects[0].endDate);
    const d = new Date(max + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  }, [projects]);

  const totalDays   = daysBetween(rangeStart, rangeEnd) + 1;
  const months      = useMemo(() => getMonths(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const monthOffset = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    months.forEach(m => { offsets.push(acc); acc += m.days; });
    return offsets;
  }, [months]);

  const todayOffset = today >= rangeStart && today <= rangeEnd
    ? daysBetween(rangeStart, today) : -1;

  useEffect(() => {
    if (!loading && !didScroll.current && scrollRef.current && todayOffset > 0) {
      didScroll.current = true;
      scrollRef.current.scrollLeft = Math.max(0, todayOffset * PX_PER_DAY - 300);
    }
  }, [loading, todayOffset]);

  function rowH(p: ProjectPlan) {
    return ROW_H_BASE + ((p.phases?.length ?? 0) > 0 ? PHASE_STRIP : 0);
  }

  // get latest phases for the currently editing project from projects state
  const editingPhases: ProjectPhase[] = editing
    ? (projects.find(p => p.id === editing.id)?.phases ?? []).slice().sort((a, b) => a.startDate.localeCompare(b.startDate))
    : [];

  function resetPhaseState() {
    setAddingPhase(false);
    setEditingPhaseId(null);
    setPhaseForm(emptyPhaseForm);
  }

  function openAdd() {
    const end = new Date(); end.setDate(end.getDate() + 30);
    setEditing(null);
    setForm({ name: '', description: '', startDate: today, endDate: toDateStr(end), color: COLORS[0] });
    resetPhaseState();
    setModalOpen(true);
  }

  function openEdit(p: ProjectPlan) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '', startDate: p.startDate, endDate: p.endDate, color: p.color });
    resetPhaseState();
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); resetPhaseState(); }

  async function handleSave() {
    if (!form.name.trim() || !form.startDate || !form.endDate || form.endDate < form.startDate) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await projectPlansApi.update(editing.id, {
          name: form.name, description: form.description || undefined,
          startDate: form.startDate, endDate: form.endDate, color: form.color,
        });
        if (res.data) setProjects(prev => prev.map(p => p.id === editing.id ? res.data! : p));
      } else {
        const res = await projectPlansApi.create({
          name: form.name, description: form.description || undefined,
          startDate: form.startDate, endDate: form.endDate, color: form.color,
        });
        setProjects(prev => [...prev, { ...res.data, phases: [] }]
          .sort((a, b) => a.startDate.localeCompare(b.startDate)));
        closeModal();
      }
      if (editing) closeModal();
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    try {
      await projectPlansApi.remove(editing.id);
      setProjects(prev => prev.filter(p => p.id !== editing.id));
      closeModal();
    } catch {} finally { setSaving(false); }
  }

  // Phase CRUD

  async function handleAddPhase() {
    if (!editing || !phaseForm.name.trim() || !phaseForm.startDate || !phaseForm.endDate) return;
    setSavingPhase(true);
    try {
      const res = await projectPlansApi.addPhase(editing.id, phaseForm);
      setProjects(prev => prev.map(p => p.id === editing.id
        ? { ...p, phases: [...(p.phases ?? []), res.data] }
        : p));
      setAddingPhase(false);
      setPhaseForm(emptyPhaseForm);
    } catch {} finally { setSavingPhase(false); }
  }

  async function handleUpdatePhase(phaseId: number) {
    if (!editing || !phaseForm.name.trim() || !phaseForm.startDate || !phaseForm.endDate) return;
    setSavingPhase(true);
    try {
      const res = await projectPlansApi.updatePhase(editing.id, phaseId, phaseForm);
      if (res.data) {
        setProjects(prev => prev.map(p => p.id === editing.id
          ? { ...p, phases: (p.phases ?? []).map(ph => ph.id === phaseId ? res.data! : ph) }
          : p));
      }
      setEditingPhaseId(null);
      setPhaseForm(emptyPhaseForm);
    } catch {} finally { setSavingPhase(false); }
  }

  async function handleDeletePhase(phaseId: number) {
    if (!editing) return;
    setProjects(prev => prev.map(p => p.id === editing.id
      ? { ...p, phases: (p.phases ?? []).filter(ph => ph.id !== phaseId) }
      : p));
    try {
      await projectPlansApi.removePhase(editing.id, phaseId);
    } catch {
      projectPlansApi.getAll().then(r => setProjects(r.data)).catch(() => {});
    }
  }

  const canSave = form.name.trim() && form.startDate && form.endDate && form.endDate >= form.startDate;

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Project Planning</h1>
            <p className="text-slate-500 text-sm mt-0.5">วางแผนและติดตามช่วงเวลาของโปรเจกต์</p>
          </div>
          <div className="flex items-center gap-2">
            {todayOffset >= 0 && (
              <button
                onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft = Math.max(0, todayOffset * PX_PER_DAY - 300); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Today
              </button>
            )}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Project
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm gap-2">
              <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <svg className="w-14 h-14 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">ยังไม่มีโปรเจกต์</p>
              <button onClick={openAdd} className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition">
                + Add Project
              </button>
            </div>
          ) : (
            <div ref={scrollRef} className="overflow-auto h-full">
              <div style={{ minWidth: NAME_W + totalDays * PX_PER_DAY }}>
                {/* Month header */}
                <div className="flex sticky top-0 z-20 bg-slate-800 border-b border-slate-700" style={{ height: HEADER_H }}>
                  <div className="flex-shrink-0 sticky left-0 z-30 bg-slate-800 border-r border-slate-700 flex items-center px-4" style={{ width: NAME_W }}>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</span>
                  </div>
                  <div className="flex" style={{ width: totalDays * PX_PER_DAY }}>
                    {months.map((m, i) => (
                      <div key={i} className="flex-shrink-0 border-r border-slate-700/40 flex items-center justify-center" style={{ width: m.days * PX_PER_DAY }}>
                        <span className="text-xs font-medium text-slate-400 select-none">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows */}
                {projects.map((p, rowIdx) => {
                  const barLeft  = daysBetween(rangeStart, p.startDate) * PX_PER_DAY;
                  const barWidth = Math.max((daysBetween(p.startDate, p.endDate) + 1) * PX_PER_DAY, 10);
                  const rH       = rowH(p);
                  const phases   = (p.phases ?? []).slice().sort((a, b) => a.startDate.localeCompare(b.startDate));

                  return (
                    <div key={p.id} className={`flex border-b border-slate-700/40 ${rowIdx % 2 === 1 ? 'bg-slate-800/60' : ''}`} style={{ height: rH }}>
                      {/* Left: name */}
                      <div
                        className={`flex-shrink-0 sticky left-0 z-10 border-r border-slate-700 cursor-pointer hover:bg-slate-700/50 transition ${rowIdx % 2 === 1 ? 'bg-slate-800/60' : 'bg-slate-800'}`}
                        style={{ width: NAME_W }}
                        onClick={() => openEdit(p)}
                      >
                        <div className="flex items-center px-3 gap-2" style={{ height: ROW_H_BASE }}>
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200 truncate leading-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">{p.startDate} – {p.endDate}</p>
                          </div>
                          <svg className="w-3 h-3 flex-shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        {/* Phase tag pills */}
                        {phases.length > 0 && (
                          <div className="flex items-center gap-1 px-3 pb-1 flex-wrap" style={{ height: PHASE_STRIP }}>
                            {phases.map(ph => (
                              <span key={ph.id} className="text-[9px] text-white font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: ph.color }}>
                                {ph.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: bars */}
                      <div className="relative" style={{ width: totalDays * PX_PER_DAY, height: rH }}>
                        {/* Month grid lines */}
                        {monthOffset.slice(1).map((off, i) => (
                          <div key={i} className="absolute inset-y-0 w-px bg-slate-700/25" style={{ left: off * PX_PER_DAY }} />
                        ))}
                        {/* Today line */}
                        {todayOffset >= 0 && (
                          <div className="absolute inset-y-0 w-px bg-yellow-400/50 z-10" style={{ left: todayOffset * PX_PER_DAY }} />
                        )}

                        {/* Main project bar */}
                        <div className="absolute left-0 right-0" style={{ top: 0, height: ROW_H_BASE }}>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md cursor-pointer hover:opacity-75 transition-opacity flex items-center overflow-hidden"
                            style={{ left: barLeft, width: barWidth, background: p.color }}
                            onClick={() => openEdit(p)}
                            title={`${p.name}\n${p.startDate} – ${p.endDate}`}
                          >
                            {barWidth > 64 && (
                              <span className="text-xs font-medium text-white px-2 truncate select-none">{p.name}</span>
                            )}
                          </div>
                        </div>

                        {/* Phase bars */}
                        {phases.length > 0 && (
                          <div className="absolute left-0 right-0" style={{ top: ROW_H_BASE, height: PHASE_STRIP }}>
                            {phases.map(ph => {
                              const phLeft  = daysBetween(rangeStart, ph.startDate) * PX_PER_DAY;
                              const phWidth = Math.max((daysBetween(ph.startDate, ph.endDate) + 1) * PX_PER_DAY, 8);
                              return (
                                <div
                                  key={ph.id}
                                  className="absolute top-1/2 -translate-y-1/2 h-[18px] rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center overflow-hidden"
                                  style={{ left: phLeft, width: phWidth, background: ph.color }}
                                  onClick={() => openEdit(p)}
                                  title={`${ph.name}: ${ph.startDate} – ${ph.endDate}`}
                                >
                                  {phWidth > 48 && (
                                    <span className="text-[9px] text-white font-semibold px-1.5 truncate select-none">{ph.name}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
              <h2 className="text-base font-semibold text-white">
                {editing ? 'Edit Project' : 'Add Project'}
              </h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Issue Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && canSave && !editing) handleSave(); }}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="ชื่อโปรเจกต์"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                  placeholder="คำอธิบาย (ไม่บังคับ)"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date <span className="text-red-400">*</span></label>
                  <DatePickerInput value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} placeholder="วันเริ่มต้น" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date <span className="text-red-400">*</span></label>
                  <DatePickerInput value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} min={form.startDate} placeholder="วันสิ้นสุด" />
                </div>
              </div>
              {form.startDate && form.endDate && form.endDate < form.startDate && (
                <p className="text-xs text-red-400">End date ต้องไม่น้อยกว่า Start date</p>
              )}

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: form.color === c ? '2px solid white' : '2px solid transparent', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>

              {/* ─── Phases section (edit mode only) ─── */}
              {editing && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phases / Tags</span>
                    {!addingPhase && editingPhaseId === null && (
                      <button
                        onClick={() => {
                          setAddingPhase(true);
                          setPhaseForm({ ...emptyPhaseForm, startDate: form.startDate, endDate: form.endDate });
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Phase
                      </button>
                    )}
                  </div>

                  {/* Phase list */}
                  <div className="space-y-1.5">
                    {editingPhases.length === 0 && !addingPhase && (
                      <p className="text-xs text-slate-600 py-0.5">ยังไม่มี Phase — กด "+ Add Phase" เพื่อเพิ่ม</p>
                    )}

                    {editingPhases.map(ph => (
                      editingPhaseId === ph.id ? (
                        <PhaseForm key={ph.id}
                          value={phaseForm} onChange={setPhaseForm}
                          saving={savingPhase} projectStart={form.startDate}
                          onSave={() => handleUpdatePhase(ph.id)}
                          onCancel={() => { setEditingPhaseId(null); setPhaseForm(emptyPhaseForm); }}
                          isEdit
                        />
                      ) : (
                        <div key={ph.id} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-2.5 py-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ph.color }} />
                          <span className="text-sm text-slate-200 flex-1 truncate">{ph.name}</span>
                          <span className="text-[10px] text-slate-500 flex-shrink-0 hidden sm:block">{ph.startDate} – {ph.endDate}</span>
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingPhaseId(ph.id);
                              setPhaseForm({ name: ph.name, startDate: ph.startDate, endDate: ph.endDate, color: ph.color });
                              setAddingPhase(false);
                            }}
                            className="p-0.5 text-slate-600 hover:text-slate-300 transition flex-shrink-0"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePhase(ph.id)}
                            className="p-0.5 text-slate-600 hover:text-red-400 transition flex-shrink-0"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    ))}

                    {/* Add phase form */}
                    {addingPhase && (
                      <PhaseForm
                        value={phaseForm} onChange={setPhaseForm}
                        saving={savingPhase} projectStart={form.startDate}
                        onSave={handleAddPhase}
                        onCancel={() => { setAddingPhase(false); setPhaseForm(emptyPhaseForm); }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 flex-shrink-0">
              {editing ? (
                <button onClick={handleDelete} disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition">
                  Delete
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
                  {editing ? 'Close' : 'Cancel'}
                </button>
                <button onClick={handleSave} disabled={saving || !canSave}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition">
                  {saving ? 'Saving...' : editing ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
