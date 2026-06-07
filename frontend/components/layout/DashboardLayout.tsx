'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { authApi } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    authApi.me().then(r => setUser(r.data)).catch(() => router.push('/ics-backoffice/login'));
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="md:hidden font-bold text-slate-800 text-sm">ICS Backoffice</div>
          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.username}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
