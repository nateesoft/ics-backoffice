'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import bgImage from '@/public/bg.webp';
import { authApi } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(username, password);
      const redirect = searchParams.get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Image
        src={bgImage}
        alt=""
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="login-card-wrapper w-full max-w-md relative z-10">
        <div className="login-border-spin" />
        <div className="login-card-shadow bg-white rounded-2xl p-10 relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
              {/* Antennae */}
              <line x1="9" y1="2" x2="12" y2="6" />
              <line x1="15" y1="2" x2="12" y2="6" />
              {/* Head */}
              <circle cx="12" cy="8" r="2" />
              {/* Body */}
              <ellipse cx="12" cy="15" rx="4" ry="5" />
              {/* Left legs */}
              <line x1="8" y1="12" x2="4" y2="10" />
              <line x1="8" y1="15" x2="4" y2="15" />
              <line x1="8" y1="18" x2="4" y2="20" />
              {/* Right legs */}
              <line x1="16" y1="12" x2="20" y2="10" />
              <line x1="16" y1="15" x2="20" y2="15" />
              <line x1="16" y1="18" x2="20" y2="20" />
            </svg>
          </div>
          <h1 className="text-2xl tracking-tight">
            <span style={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>ICS</span>
            <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.3rem' }}>Back Office</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Bug Issue Tracking System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter password"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900" />
    }>
      <LoginForm />
    </Suspense>
  );
}
