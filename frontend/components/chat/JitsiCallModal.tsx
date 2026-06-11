'use client';
import { useEffect, useRef } from 'react';

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
  withUsername: string;
  callType: 'voice' | 'video';
  jitsiUrl: string;
  onClose: () => void;
}

export default function JitsiCallModal({ roomId, displayName, withUsername, callType, jitsiUrl, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);

  useEffect(() => {
    const host = jitsiUrl.replace(/^https?:\/\//, '');

    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current = new window.JitsiMeetExternalAPI(host, {
        roomName: roomId,
        parentNode: containerRef.current,
        displayName,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: callType === 'voice',
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: callType === 'voice'
            ? ['microphone', 'desktop', 'hangup', 'fodeviceselection', 'settings']
            : ['microphone', 'camera', 'desktop', 'hangup', 'fodeviceselection', 'settings', 'fullscreen'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
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

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
            {withUsername[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              {callType === 'voice' ? 'Voice Call' : 'Video Call'} — {withUsername}
            </p>
            <p className="text-slate-400 text-xs">Connected via Jitsi</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
        >
          วางสาย
        </button>
      </div>

      {/* Jitsi iframe area */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
