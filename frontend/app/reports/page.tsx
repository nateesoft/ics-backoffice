'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Issue, TASK_STATUSES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from '@/types/issue';
import { issuesApi } from '@/lib/api';

export default function ReportsPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issuesApi.getAll().then(r => { setIssues(r.data); setLoading(false); });
  }, []);

  const active = issues.filter(i => !i.isCancelled);
  const byStatus = TASK_STATUSES.map(s => ({ status: s, count: active.filter(i => i.taskStatus === s).length }));
  const byPriority = PRIORITIES.map(p => ({ priority: p, count: active.filter(i => i.priority === p).length }));
  const maxStatusCount = Math.max(...byStatus.map(s => s.count), 1);
  const maxPriorityCount = Math.max(...byPriority.map(p => p.count), 1);

  const byCodeType = Array.from(new Set(active.map(i => i.codeType))).map(ct => ({
    type: ct,
    count: active.filter(i => i.codeType === ct).length,
  })).sort((a, b) => b.count - a.count);

  const recentIssues = [...issues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of all issue tasks</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: issues.length, sub: 'All issues', color: 'bg-indigo-500' },
                { label: 'Active', value: active.length, sub: 'Not cancelled', color: 'bg-green-500' },
                { label: 'Cancelled', value: issues.filter(i => i.isCancelled).length, sub: 'Cancelled issues', color: 'bg-red-500' },
                { label: 'Critical', value: active.filter(i => i.priority === 'Critical').length, sub: 'Critical priority', color: 'bg-orange-500' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                    <span className="text-white text-xl font-bold">{card.value}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                  <div className="text-sm font-semibold text-slate-700">{card.label}</div>
                  <div className="text-xs text-slate-400">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Status */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Issues by Status</h2>
                <div className="space-y-3">
                  {byStatus.map(({ status, count }) => (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>{status}</span>
                        <span className="text-sm font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${(count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Priority */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Issues by Priority</h2>
                <div className="space-y-3">
                  {byPriority.map(({ priority, count }) => (
                    <div key={priority}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]}`}>{priority}</span>
                        <span className="text-sm font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${priority === 'Critical' ? 'bg-red-500' : priority === 'High' ? 'bg-orange-500' : priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(count / maxPriorityCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Code Type */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Issues by Technology</h2>
                {byCodeType.length === 0 ? (
                  <div className="text-slate-400 text-sm">No data</div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {byCodeType.map(({ type, count }) => (
                      <div key={type} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <span className="text-sm font-mono text-slate-700">{type}</span>
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Recent Issues</h2>
                <div className="space-y-3">
                  {recentIssues.map(issue => (
                    <div key={issue.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{issue.projectName}</div>
                        <div className="text-xs text-slate-400">{issue.codeType} · {new Date(issue.createdAt).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${issue.isCancelled ? 'bg-red-100 text-red-600' : STATUS_COLORS[issue.taskStatus]}`}>
                        {issue.isCancelled ? 'Cancelled' : issue.taskStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
