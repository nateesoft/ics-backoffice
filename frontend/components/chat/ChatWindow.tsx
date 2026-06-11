'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatContext } from './ChatContext';
import dynamic from 'next/dynamic';

const JitsiCallModal = dynamic(() => import('./JitsiCallModal'), { ssr: false });
const IncomingCallModal = dynamic(() => import('./IncomingCallModal'), { ssr: false });

const JITSI_URL = process.env.NEXT_PUBLIC_JITSI_URL || 'https://meet.jit.si';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function ThreadWindow({
  thread,
  currentUserId,
  isActive,
  onFocus,
  index,
}: {
  thread: { userId: number; username: string; messages: any[]; unread: number };
  currentUserId: number;
  isActive: boolean;
  onFocus: () => void;
  index: number;
}) {
  const { sendMessage, closeThread, startCall } = useChatContext();
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages, minimized]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(thread.userId, input.trim());
    setInput('');
  }

  const rightOffset = 16 + index * (280 + 12);

  return (
    <div
      className="fixed bottom-0 z-50 flex flex-col shadow-2xl rounded-t-xl overflow-hidden"
      style={{ right: rightOffset, width: 280 }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer select-none ${
          isActive ? 'bg-indigo-600' : 'bg-slate-700'
        }`}
        onClick={() => setMinimized(v => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {thread.username[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white truncate">{thread.username}</span>
          {thread.unread > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {thread.unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {/* Voice call button */}
          <button
            title="Voice Call"
            onClick={() => startCall(thread.userId, thread.username, 'voice')}
            className="p-1 hover:bg-white/20 rounded transition text-white"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
          </button>
          {/* Video call button */}
          <button
            title="Video Call"
            onClick={() => startCall(thread.userId, thread.username, 'video')}
            className="p-1 hover:bg-white/20 rounded transition text-white"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </button>
          <button
            onClick={() => setMinimized(v => !v)}
            className="p-1 hover:bg-white/20 rounded transition text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={minimized ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
            </svg>
          </button>
          <button
            onClick={() => closeThread(thread.userId)}
            className="p-1 hover:bg-white/20 rounded transition text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="bg-white flex-1 overflow-y-auto p-3 space-y-2" style={{ height: 320 }}>
            {thread.messages.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-8">เริ่มการสนทนากับ {thread.username}</p>
            )}
            {thread.messages.map(msg => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="bg-white border-t border-slate-200 flex items-center gap-2 px-3 py-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 text-sm bg-slate-100 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-300 transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-full flex items-center justify-center transition flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ChatWindow({ currentUserId, currentUsername }: { currentUserId: number; currentUsername: string }) {
  const { threads, activeThreadId, activeCall, incomingCall, acceptCall, rejectCall, endCall } = useChatContext();
  const [focusedId, setFocusedId] = useState<number | null>(null);

  const visibleThreads = threads.slice(-3);

  return (
    <>
      {visibleThreads.map((thread, idx) => (
        <ThreadWindow
          key={thread.userId}
          thread={thread}
          currentUserId={currentUserId}
          isActive={focusedId === thread.userId || activeThreadId === thread.userId}
          onFocus={() => setFocusedId(thread.userId)}
          index={idx}
        />
      ))}

      {/* Active call — Jitsi modal */}
      {activeCall && (
        <JitsiCallModal
          roomId={activeCall.roomId}
          displayName={currentUsername}
          withUsername={activeCall.withUsername}
          callType={activeCall.callType}
          jitsiUrl={JITSI_URL}
          onClose={endCall}
        />
      )}

      {/* Incoming call notification */}
      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </>
  );
}
