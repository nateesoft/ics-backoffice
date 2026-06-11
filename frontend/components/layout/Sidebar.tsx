'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi, usersApi, OnlineUser } from '@/lib/api';
import { useChatContext } from '@/components/chat/ChatContext';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/issues',
    label: 'Issue Tickets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [teamUsers, setTeamUsers] = useState<OnlineUser[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const fetchTeam = useCallback(async () => {
    try {
      const res = await usersApi.getAll();
      setTeamUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTeam();
    const timer = setInterval(fetchTeam, 30_000);
    return () => clearInterval(timer);
  }, [fetchTeam]);

  async function handleLogout() {
    await authApi.logout();
    router.push('/login');
  }

  const onlineCount = teamUsers.filter(u => u.isOnline).length;
  const { openThread, threads } = useChatContext();
  const chatUnreadByUser = Object.fromEntries(threads.map(t => [t.userId, t.unread]));

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="font-bold text-sm">ICS Backoffice</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition hidden md:flex"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Team Online Status */}
      {teamUsers.length > 0 && (
        <div className="px-3 py-3 border-t border-slate-700">
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Team</span>
                <span className="text-[10px] text-slate-500">
                  {onlineCount}/{teamUsers.length} online
                </span>
              </div>
              <div className="space-y-0.5">
                {teamUsers.map(u => {
                  const unread = chatUnreadByUser[u.id] ?? 0;
                  return (
                    <button
                      key={u.id}
                      onClick={() => openThread(u.id, u.username)}
                      className="flex items-center gap-2.5 px-1 py-1 w-full rounded-lg hover:bg-slate-800 transition group"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${u.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                      </div>
                      <span className="text-xs text-slate-400 truncate group-hover:text-white transition">{u.username}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {unread > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1">
                            {unread}
                          </span>
                        )}
                        {u.isOnline && !unread && (
                          <span className="text-[10px] text-green-400 font-medium">Online</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              {teamUsers.slice(0, 4).map(u => {
                const unread = chatUnreadByUser[u.id] ?? 0;
                return (
                  <button
                    key={u.id}
                    onClick={() => openThread(u.id, u.username)}
                    className="relative hover:opacity-80 transition"
                    title={`${u.username} — ${u.isOnline ? 'Online' : 'Offline'}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-300">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${u.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[12px] h-3 flex items-center justify-center px-0.5">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {teamUsers.length > 4 && (
                <span className="text-[9px] text-slate-500">+{teamUsers.length - 4}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm font-medium"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-shrink-0">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="relative flex flex-col w-64 bg-slate-900">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
