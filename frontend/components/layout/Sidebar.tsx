'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authApi, usersApi, docFoldersApi, avatarSrc, OnlineUser, DocFolder } from '@/lib/api';
import { useChatContext } from '@/components/chat/ChatContext';

function TeamAvatar({ user, size }: { user: OnlineUser; size: number }) {
  const [imgError, setImgError] = useState(false);
  const px = size * 4;
  if (user.avatarFilename && !imgError) {
    return (
      <img
        src={`${avatarSrc(user.id)}`}
        alt={user.username}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-slate-700 flex items-center justify-center font-semibold text-slate-300"
      style={{ width: px, height: px, fontSize: px * 0.4 }}
    >
      {user.username[0].toUpperCase()}
    </div>
  );
}

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
  {
    href: '/meeting',
    label: 'Meeting Room',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [teamUsers, setTeamUsers] = useState<OnlineUser[]>([]);

  const [docFolders, setDocFolders] = useState<DocFolder[]>([]);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFolderId = searchParams.get('folderId');

  useEffect(() => {
    docFoldersApi.getAll().then(r => setDocFolders(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/documents')) setDocsExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (addingFolder) setTimeout(() => folderInputRef.current?.focus(), 50);
  }, [addingFolder]);

  useEffect(() => {
    if (editingFolder !== null) setTimeout(() => editInputRef.current?.select(), 50);
  }, [editingFolder]);

  async function handleAddFolder() {
    const name = newFolderName.trim();
    setNewFolderName('');
    setAddingFolder(false);
    if (!name) return;
    try {
      const res = await docFoldersApi.create(name);
      setDocFolders(prev => [...prev, res.data]);
    } catch {}
  }

  async function handleRemoveFolder(id: number) {
    setDocFolders(prev => prev.filter(f => f.id !== id));
    try {
      await docFoldersApi.remove(id);
    } catch {
      docFoldersApi.getAll().then(r => setDocFolders(r.data)).catch(() => {});
    }
  }

  function handleStartEdit(folder: DocFolder) {
    setEditingFolder(folder.id);
    setEditFolderName(folder.name);
  }

  async function handleSaveEdit() {
    const name = editFolderName.trim();
    const id = editingFolder;
    setEditingFolder(null);
    setEditFolderName('');
    if (!name || id === null) return;
    setDocFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    try {
      await docFoldersApi.rename(id, name);
    } catch {
      docFoldersApi.getAll().then(r => setDocFolders(r.data)).catch(() => {});
    }
  }

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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          if (item.href === '/documents') {
            const isDocsActive = pathname.startsWith('/documents');
            return (
              <div key={item.href}>
                {/* Documents row */}
                <div className={`flex items-center rounded-lg transition ${isDocsActive && !collapsed ? 'bg-indigo-600' : ''}`}>
                  <Link
                    href="/documents"
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 px-3 py-2.5 flex-1 text-sm font-medium rounded-lg transition ${
                      isDocsActive
                        ? collapsed
                          ? 'bg-indigo-600 text-white'
                          : 'text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>

                  {!collapsed && (
                    <div className="flex items-center pr-1.5 gap-0.5">
                      {/* Collapse chevron — only when there are folders */}
                      {docFolders.length > 0 && (
                        <button
                          onClick={() => setDocsExpanded(v => !v)}
                          title={docsExpanded ? 'Collapse' : 'Expand'}
                          className={`p-1 rounded transition ${
                            isDocsActive
                              ? 'text-indigo-200 hover:bg-indigo-500 hover:text-white'
                              : 'text-slate-500 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <svg
                            className={`w-3 h-3 transition-transform duration-200 ${docsExpanded ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                      {/* Add folder "+" */}
                      <button
                        onClick={() => { setAddingFolder(true); setDocsExpanded(true); }}
                        title="Add folder"
                        className={`p-1 rounded transition ${
                          isDocsActive
                            ? 'text-indigo-200 hover:bg-indigo-500 hover:text-white'
                            : 'text-slate-500 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-menu folders */}
                {!collapsed && docsExpanded && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-slate-700/70 space-y-0.5 pb-0.5">
                    {docFolders.map(folder => {
                      const isFolderActive = pathname.startsWith('/documents') && activeFolderId === String(folder.id);
                      return (
                        <div key={folder.id} className="flex items-center group/folder">
                          {editingFolder === folder.id ? (
                            <div className="flex items-center gap-1 flex-1 py-0.5">
                              <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                              </svg>
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editFolderName}
                                onChange={e => setEditFolderName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') { setEditingFolder(null); }
                                }}
                                onBlur={() => setTimeout(handleSaveEdit, 120)}
                                className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white focus:outline-none focus:border-indigo-500 min-w-0"
                              />
                            </div>
                          ) : (
                            <>
                              <Link
                                href={`/documents?folderId=${folder.id}`}
                                onClick={onMobileClose}
                                className={`flex items-center gap-2 flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition min-w-0 ${
                                  isFolderActive
                                    ? 'bg-indigo-500/25 text-indigo-300'
                                    : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
                                }`}
                              >
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isFolderActive ? 'text-indigo-400' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                </svg>
                                <span className="truncate">{folder.name}</span>
                              </Link>
                              <div className="flex items-center gap-0.5 mr-0.5 opacity-0 group-hover/folder:opacity-100 transition">
                                {/* Rename */}
                                <button
                                  onClick={() => handleStartEdit(folder)}
                                  title="Rename"
                                  className="p-0.5 text-slate-600 hover:text-slate-300 rounded transition"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {/* Delete */}
                                <button
                                  onClick={() => handleRemoveFolder(folder.id)}
                                  title="Delete folder"
                                  className="p-0.5 text-slate-600 hover:text-red-400 rounded transition"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline "add folder" input */}
                    {addingFolder && (
                      <div className="flex items-center gap-1 py-0.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                        <input
                          ref={folderInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddFolder();
                            if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
                          }}
                          onBlur={() => setTimeout(handleAddFolder, 120)}
                          placeholder="ชื่อ folder..."
                          className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 min-w-0"
                        />
                        <button
                          onMouseDown={e => { e.preventDefault(); handleAddFolder(); }}
                          title="Confirm"
                          className="p-0.5 text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

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
                        <TeamAvatar user={u} size={6} />
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
                    <TeamAvatar user={u} size={7} />
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
