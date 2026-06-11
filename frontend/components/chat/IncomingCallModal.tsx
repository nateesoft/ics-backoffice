'use client';
import { useEffect } from 'react';

interface Props {
  callerName: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ callerName, callType, onAccept, onReject }: Props) {
  // auto-reject after 30 seconds
  useEffect(() => {
    const timer = setTimeout(onReject, 30000);
    return () => clearTimeout(timer);
  }, [onReject]);

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-72 shadow-2xl text-center border border-slate-700">
        {/* Pulsing avatar */}
        <div className="relative mx-auto mb-4 w-20 h-20">
          <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
          <span
            className="absolute inset-2 rounded-full bg-indigo-500/20 animate-ping"
            style={{ animationDelay: '0.3s' }}
          />
          <div className="relative w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
            {callerName[0]?.toUpperCase()}
          </div>
        </div>

        <p className="text-white font-semibold text-lg mb-1">{callerName}</p>
        <p className="text-slate-400 text-sm mb-6">
          {callType === 'voice' ? 'Voice Call' : 'Video Call'} incoming...
        </p>

        <div className="flex justify-center gap-8">
          {/* Reject */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onReject}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-slate-400 text-xs">ปฏิเสธ</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition shadow-lg animate-bounce"
            >
              {callType === 'voice' ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              )}
            </button>
            <span className="text-slate-400 text-xs">รับสาย</span>
          </div>
        </div>
      </div>
    </div>
  );
}
