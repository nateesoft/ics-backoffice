'use client';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { ChatProvider } from '@/components/chat/ChatContext';
import ChatWindow from '@/components/chat/ChatWindow';
import { authApi, avatarSrc, notificationsApi, AppNotification } from '@/lib/api';
import { usePushNotification } from '@/hooks/usePushNotification';

const POLL_INTERVAL = 30_000;

function UserAvatar({ user, size }: { user: any; size: number }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [user?.avatarFilename]);
  const px = size * 4;
  const base = `rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold`;
  const style = { width: px, height: px };
  if (user?.avatarFilename && !imgError) {
    return (
      <div className={base} style={style}>
        <img
          src={`${avatarSrc(user.id)}?v=${encodeURIComponent(user.avatarFilename)}`}
          alt={user.username}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${base} bg-indigo-100 text-indigo-700`} style={style}>
      <span style={{ fontSize: px * 0.4 }}>{user?.username?.[0]?.toUpperCase()}</span>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AvatarModal({ user, onClose, onUpdated }: { user: any; onClose: () => void; onUpdated: (avatarFilename: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { setError('File must be under 3MB'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.uploadAvatar(file);
      onUpdated(res.data.avatarFilename);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError('');
    try {
      await authApi.removeAvatar();
      onUpdated(null);
      onClose();
    } catch {
      setError('Failed to remove avatar');
    } finally {
      setLoading(false);
    }
  }

  const currentAvatarUrl = user.avatarFilename ? avatarSrc(user.id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">Profile Photo</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Profile photo updated</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            {/* Avatar preview */}
            <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-indigo-100 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : currentAvatarUrl && !imgError ? (
                  <img
                    src={currentAvatarUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  user.username?.[0]?.toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition"
              >
                {file ? 'Change Photo' : 'Choose Photo'}
              </button>
              {(currentAvatarUrl && !imgError) && !file && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>

            {error && <div className="w-full bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>}

            <p className="text-xs text-slate-400">JPG, PNG, GIF or WebP · Max 3MB</p>

            <div className="flex justify-end gap-3 w-full pt-1 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-40"
              >
                {loading ? 'Uploading...' : 'Save Photo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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

function UnauthorizedModal() {
  const router = useRouter();
  function handleLogin() {
    const full = window.location.pathname + window.location.search;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '/ics-backoffice';
    const current = full.startsWith(base) ? full.slice(base.length) || '/' : full;
    router.push(`/login?redirect=${encodeURIComponent(current)}`);
  }
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10a4 4 0 100 8 4 4 0 000-8zm0 0V5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800 mb-1">Session หมดอายุ</h2>
          <p className="text-sm text-slate-500">กรุณา Login ใหม่เพื่อใช้งานต่อ</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
        >
          ไปหน้า Login
        </button>
      </div>
    </div>
  );
}

function PushBellButton() {
  const { state, subscribe, unsubscribe } = usePushNotification();

  if (state === 'unsupported') return null;

  if (state === 'loading') {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div title="Notifications blocked — please allow in browser settings" className="p-2 text-slate-300 cursor-not-allowed">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
    );
  }

  if (state === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        title="Notifications enabled — click to disable"
        className="p-2 rounded-lg hover:bg-slate-100 transition text-indigo-500"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      title="Enable push notifications"
      className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-indigo-500"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userRef = useRef<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    authApi.me().then(r => { userRef.current = r.data; setUser(r.data); });
  }, [router]);

  useEffect(() => {
    function handler() {
      if (userRef.current) {
        // session หมดอายุขณะใช้งานอยู่ → แสดง modal
        setShowUnauthorized(true);
      } else {
        // ยังไม่เคย login → redirect เงียบ พร้อมเก็บ path ปัจจุบัน
        // ตัด basePath ออกก่อน เพราะ router.push จะเติม basePath ให้อัตโนมัติ
        const full = window.location.pathname + window.location.search;
        const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '/ics-backoffice';
        const current = full.startsWith(base) ? full.slice(base.length) || '/' : full;
        router.push(`/login?redirect=${encodeURIComponent(current)}`);
      }
    }
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
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

  if (!user) return showUnauthorized ? <UnauthorizedModal /> : null;

  return (
    <ChatProvider currentUserId={user.id}>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Suspense fallback={<div className="hidden md:flex flex-shrink-0 w-64 bg-slate-900" />}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </Suspense>
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
            <PushBellButton />
            {user && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  {/* Avatar with notification badge */}
                  <div className="relative">
                    <UserAvatar user={user} size={8} />
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
                    <div className="px-3 py-3 border-b border-slate-100 flex items-center gap-3">
                      <UserAvatar user={user} size={10} />
                      <div>
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-700">{user.username}</p>
                      </div>
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
                      onClick={() => { setDropdownOpen(false); setShowAvatarModal(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Edit Profile Photo
                    </button>
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
      {showAvatarModal && (
        <AvatarModal
          user={user}
          onClose={() => setShowAvatarModal(false)}
          onUpdated={(avatarFilename) => {
            setUser((u: any) => ({ ...u, avatarFilename }));
          }}
        />
      )}
      {showUnauthorized && <UnauthorizedModal />}
      <ChatWindow currentUserId={user.id} currentUsername={user.username} />
    </div>
    </ChatProvider>
  );
}
