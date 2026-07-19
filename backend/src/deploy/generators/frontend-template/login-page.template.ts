// New — Preview never had a real login (its Actor picker is a client-side dropdown with zero
// enforcement). `useSearchParams()` wrapped in <Suspense>, matching this codebase's own established
// convention (see CLAUDE.md: "useSearchParams() ต้อง wrap ด้วย <Suspense> เสมอ" — required for
// Next.js 16 builds, not just a style preference).
export function renderLoginPageTsx(): string {
  return `'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(\`\${API_BASE}/auth/login\`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Username หรือ Password ไม่ถูกต้อง');
        setLoading(false);
        return;
      }
      router.push(params.get('redirect') || '/');
    } catch {
      setError('เชื่อมต่อ API ไม่ได้');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h1 className="text-lg font-semibold text-slate-800">เข้าสู่ระบบ</h1>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
`;
}
