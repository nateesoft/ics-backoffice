'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authApi } from '@/lib/api';
import dynamic from 'next/dynamic';

const MeetingRoomModal = dynamic(() => import('@/components/chat/MeetingRoomModal'), { ssr: false });

const JITSI_URL = process.env.NEXT_PUBLIC_JITSI_URL || 'https://meet.jit.si';

function generateRoomId(name: string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `ics-${slug || 'meeting'}-${Date.now().toString(36)}`;
}

function extractRoomIdFromInput(input: string): string {
  try {
    const url = new URL(input);
    const room = url.searchParams.get('room');
    if (room) return room;
  } catch {}
  return input.trim();
}

function MeetingPageContent() {
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    authApi.me().then(r => {
      if (r.data?.username) setDisplayName(r.data.username);
    }).catch(() => {});

    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) setJoinInput(roomFromUrl);
  }, [searchParams]);

  function handleCreate() {
    if (!displayName.trim()) return;
    setActiveRoomId(generateRoomId(roomName));
  }

  function handleJoin() {
    const roomId = extractRoomIdFromInput(joinInput);
    if (!displayName.trim() || !roomId) return;
    setActiveRoomId(roomId);
  }

  return (
    <>
      {activeRoomId && (
        <MeetingRoomModal
          roomId={activeRoomId}
          displayName={displayName}
          jitsiUrl={JITSI_URL}
          onClose={() => setActiveRoomId(null)}
        />
      )}

      <DashboardLayout>
        <div className="min-h-full flex flex-col items-center justify-center py-12 px-4">
          <div className="w-full max-w-md space-y-5">
            {/* Title */}
            <div className="text-center mb-2">
              <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Meeting Room</h1>
              <p className="text-slate-500 text-sm mt-1">Video call พร้อม Screen Sharing สำหรับทีม</p>
            </div>

            {/* Display Name */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                ชื่อของคุณในห้อง
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="ชื่อที่จะแสดงในห้อง meeting"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>

            {/* Create Room */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">1</span>
                สร้างห้อง Meeting ใหม่
              </h2>
              <input
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="ชื่อห้อง เช่น team-standup, sprint-review"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition mb-3"
              />
              <button
                onClick={handleCreate}
                disabled={!displayName.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                สร้างห้อง
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">หรือ</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Join Room */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">2</span>
                เข้าร่วมห้องที่มีอยู่
              </h2>
              <input
                value={joinInput}
                onChange={e => setJoinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="วาง Room ID หรือ Link ที่นี่"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition mb-3 font-mono"
              />
              <button
                onClick={handleJoin}
                disabled={!displayName.trim() || !joinInput.trim()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                เข้าร่วมห้อง
              </button>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2.5 px-1">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-400 leading-relaxed">
                ห้อง Meeting รองรับ Video, Audio และ <strong>Screen Sharing</strong> — คลิกปุ่ม "แชร์หน้าจอ" ใน toolbar ของห้องได้เลยครับ
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function MeetingPage() {
  return (
    <Suspense>
      <MeetingPageContent />
    </Suspense>
  );
}
