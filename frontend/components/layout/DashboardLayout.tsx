'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { authApi, notificationsApi, AppNotification } from '@/lib/api';

const POLL_INTERVAL = 30_000;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">Change Password</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Password changed successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <input type="password" className={inputCls} value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input type="password" className={inputCls} value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={4} />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input type="password" className={inputCls} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    authApi.me().then(r => setUser(r.data)).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    authApi.heartbeat().catch(() => {});
    const timer = setInterval(() => authApi.heartbeat().catch(() => {}), 60_000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnread();
      setNotifications(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  async function handleLogout() {
    await authApi.logout();
    router.push('/login');
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    setNotifications([]);
  }

  async function handleMarkRead(n: AppNotification) {
    await notificationsApi.markRead(n.id);
    setNotifications(prev => prev.filter(x => x.id !== n.id));
    setDropdownOpen(false);
    router.push(`/issues?issue=${n.issueId}`);
  }

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition" onClick={() => setMobileOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="md:hidden font-bold text-slate-800 text-sm">ICS Backoffice</div>
          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  {/* Avatar with notification badge */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none pointer-events-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.username}</span>
                  <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-40">
                    {/* User info */}
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-700">{user.username}</p>
                    </div>

                    {/* Notifications section */}
                    <div className="border-b border-slate-100">
                      <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>
                          )}
                        </span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition">
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="px-3 pb-2.5 text-xs text-slate-400">No new notifications</p>
                      ) : (
                        <ul className="max-h-52 overflow-y-auto">
                          {notifications.map(n => (
                            <li key={n.id}>
                              <button
                                onClick={() => handleMarkRead(n)}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition flex items-start gap-2.5 group"
                              >
                                <span className="mt-0.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                <span className="flex-1 min-w-0">
                                  <span className="text-xs text-slate-700 leading-snug">
                                    <span className="font-semibold text-indigo-600">@{n.senderUsername}</span>
                                    {' mentioned you in '}
                                    <span className="font-medium">Issue #{n.issueId}</span>
                                  </span>
                                  <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => { setDropdownOpen(false); setShowChangePassword(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
