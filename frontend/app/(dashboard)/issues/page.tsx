'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import IssueForm from '@/components/issues/IssueForm';
import IssueDetail from '@/components/issues/IssueDetail';
import { Issue, TASK_STATUSES, PRIORITIES, CODE_TYPES, DEPLOYMENT_STATUSES, ISSUE_TAGS, STATUS_COLORS, PRIORITY_COLORS } from '@/types/issue';
import { issuesApi, authApi } from '@/lib/api';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [viewIssue, setViewIssue] = useState<Issue | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCodeType, setFilterCodeType] = useState('');
  const [filterDeployment, setFilterDeployment] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showCancelled, setShowCancelled] = useState(true);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [cloneIssue, setCloneIssue] = useState<Issue | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const initialIssueIdRef = useRef<number | null>(null);

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

  const hasActiveFilters = filterStatus || filterPriority || filterCodeType || filterDeployment || filterTag || !showCancelled || search;

  function clearFilters() {
    setFilterStatus('');
    setFilterPriority('');
    setFilterCodeType('');
    setFilterDeployment('');
    setFilterTag('');
    setShowCancelled(true);
    setSearch('');
    const range = currentMonthRange();
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await issuesApi.getAll();
    setIssues(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('issue');
    if (id) initialIssueIdRef.current = Number(id);
  }, []);

  useEffect(() => {
    if (!loading && initialIssueIdRef.current && issues.length > 0) {
      const found = issues.find(i => i.id === initialIssueIdRef.current);
      initialIssueIdRef.current = null;
      if (found) openIssue(found);
    }
  }, [loading, issues]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    authApi.me().then(res => setCurrentUser(res.data.username)).catch(() => {});
  }, []);

  function openIssue(issue: Issue) {
    setViewIssue(issue);
    window.history.replaceState({}, '', `${window.location.pathname}?issue=${issue.id}`);
  }

  function closeIssue() {
    setViewIssue(null);
    window.history.replaceState({}, '', window.location.pathname);
  }

  function handleShare(issue: Issue) {
    const url = `${window.location.origin}${window.location.pathname}?issue=${issue.id}`;
    const doCopy = () => {
      setCopiedId(issue.id);
      setTimeout(() => setCopiedId(null), 2000);
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

  function handleClone(issue: Issue) {
    setEditIssue(null);
    setCloneIssue(issue);
    setShowForm(true);
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this issue?')) return;
    await issuesApi.cancel(id);
    load();
  }

  const filtered = issues.filter(i => {
    if (!showCancelled && i.isCancelled) return false;
    if (filterStatus && i.taskStatus !== filterStatus) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    if (filterCodeType && i.codeType !== filterCodeType) return false;
    if (filterDeployment && i.deploymentStatus !== filterDeployment) return false;
    if (filterTag && !(i.tags ?? []).includes(filterTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = i.projectName.toLowerCase().includes(q)
        || (i.developer ?? '').toLowerCase().includes(q)
        || (i.issuer ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (dateFrom && i.issueCreateDate < dateFrom) return false;
    if (dateTo && i.issueCreateDate > dateTo) return false;
    return true;
  });

  const selectCls = "px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Issue Tickets</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} issues found</p>
          </div>
          <button
            onClick={() => { setEditIssue(null); setCloneIssue(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Issue
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          {/* Row 1: Date range + Search + main filters */}
          <div className="flex flex-wrap gap-3">
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
                placeholder="Search project, developer, issuer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={selectCls + " pl-9 w-full"}
              />
            </div>
            <select className={selectCls} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className={selectCls} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <button
              onClick={() => setShowMoreFilters(v => !v)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition flex items-center gap-1.5 ${showMoreFilters ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
              More Filters
              {(filterCodeType || filterDeployment || filterTag || !showCancelled) && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
          </div>

          {/* Row 2: Extra filters (collapsible) */}
          {showMoreFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              <select className={selectCls} value={filterCodeType} onChange={e => setFilterCodeType(e.target.value)}>
                <option value="">All Code Types</option>
                {CODE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className={selectCls} value={filterDeployment} onChange={e => setFilterDeployment(e.target.value)}>
                <option value="">All Deploy Status</option>
                {DEPLOYMENT_STATUSES.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className={selectCls} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                <option value="">All Tags</option>
                {ISSUE_TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 cursor-pointer hover:bg-slate-50 select-none">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={e => setShowCancelled(e.target.checked)}
                  className="rounded"
                />
                Show Cancelled
              </label>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No issues found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Project</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Developer</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Target Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(issue => (
                    <tr key={issue.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${issue.isCancelled ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-slate-400 font-mono">#{issue.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{issue.projectName}</div>
                        {issue.isCancelled && <span className="text-xs text-red-500">Cancelled</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{issue.codeType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[issue.taskStatus]}`}>{issue.taskStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{issue.developer || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{issue.targetDate || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openIssue(issue)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button
                            onClick={() => handleShare(issue)}
                            className={`p-1.5 rounded-lg transition ${copiedId === issue.id ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={copiedId === issue.id ? 'Copied!' : 'Share Link'}
                          >
                            {copiedId === issue.id ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleClone(issue)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg transition text-emerald-500"
                            title="Clone Issue"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          {!issue.isCancelled && (
                            <>
                              <button
                                onClick={() => { setEditIssue(issue); setShowForm(true); }}
                                className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-indigo-500"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button
                                onClick={() => handleCancel(issue.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
            } : undefined)}
            onSuccess={() => { setShowForm(false); setCloneIssue(null); load(); }}
            onCancel={() => { setShowForm(false); setCloneIssue(null); }}
          />
        </Modal>
      )}

      {viewIssue && (
        <Modal title={`Issue #${viewIssue.id} — ${viewIssue.projectName}`} onClose={closeIssue} size="xl">
          <IssueDetail
            issue={viewIssue}
            currentUser={currentUser}
            onClone={(issue) => { closeIssue(); handleClone(issue); }}
          />
        </Modal>
      )}
    </>
  );
}

