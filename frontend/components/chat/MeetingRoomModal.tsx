'use client';
import { useEffect, useRef, useState } from 'react';

interface JitsiAPI {
  dispose: () => void;
  addEventListeners: (listeners: Record<string, () => void>) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (host: string, options: Record<string, unknown>) => JitsiAPI;
  }
}

interface Props {
  roomId: string;
  displayName: string;
  jitsiUrl: string;
  onClose: () => void;
}

export default function MeetingRoomModal({ roomId, displayName, jitsiUrl, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const host = jitsiUrl.replace(/^https?:\/\//, '');

    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current = new window.JitsiMeetExternalAPI(host, {
        roomName: roomId,
        parentNode: containerRef.current,
        displayName,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'participants-pane',
            'chat', 'raisehand', 'hangup', 'fodeviceselection',
            'settings', 'fullscreen', 'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        },
        width: '100%',
        height: '100%',
      });

      apiRef.current.addEventListeners({
        readyToClose: onClose,
        videoConferenceLeft: onClose,
      });
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = `${jitsiUrl}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function handleCopyLink() {
    const link = `${window.location.origin}/ics-backoffice/meeting?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Meeting Room</p>
            <p className="text-slate-400 text-xs font-mono truncate max-w-[200px]">{roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400">คัดลอกแล้ว!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                คัดลอก Link
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
          >
            ออกจากห้อง
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
