'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import IssueForm from '@/components/issues/IssueForm';
import IssueDetail from '@/components/issues/IssueDetail';
import { Issue, TASK_STATUSES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from '@/types/issue';
import { issuesApi, authApi } from '@/lib/api';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [viewIssue, setViewIssue] = useState<Issue | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await issuesApi.getAll();
    setIssues(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    authApi.me().then(res => setCurrentUser(res.data.username)).catch(() => {});
  }, []);

  async function handleCancel(id: number) {
    if (!confirm('Cancel this issue?')) return;
    await issuesApi.cancel(id);
    load();
  }

  const filtered = issues.filter(i => {
    if (filterStatus && i.taskStatus !== filterStatus) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    if (search && !i.projectName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectCls = "px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Issue Tickets</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} issues found</p>
          </div>
          <button
            onClick={() => { setEditIssue(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Issue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={selectCls + " flex-1 min-w-40"}
          />
          <select className={selectCls} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selectCls} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
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
                            onClick={() => setViewIssue(issue)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
        <Modal title={editIssue ? 'Edit Issue' : 'New Issue'} onClose={() => setShowForm(false)} size="xl">
          <IssueForm
            initial={editIssue || undefined}
            onSuccess={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {viewIssue && (
        <Modal title={`Issue #${viewIssue.id} — ${viewIssue.projectName}`} onClose={() => setViewIssue(null)} size="xl">
          <IssueDetail issue={viewIssue} currentUser={currentUser} />
        </Modal>
      )}
    </DashboardLayout>
  );
}

