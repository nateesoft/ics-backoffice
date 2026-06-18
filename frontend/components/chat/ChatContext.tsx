'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatMessage } from '@/lib/api';

interface ChatThread {
  userId: number;
  username: string;
  messages: ChatMessage[];
  unread: number;
}

export interface CallInfo {
  roomId: string;
  callType: 'voice' | 'video';
  withUserId: number;
  withUsername: string;
}

export interface IncomingCall {
  roomId: string;
  callType: 'voice' | 'video';
  callerId: number;
  callerName: string;
}

interface ChatContextValue {
  openThread: (userId: number, username: string) => void;
  closeThread: (userId: number) => void;
  sendMessage: (toUserId: number, content: string) => void;
  threads: ChatThread[];
  activeThreadId: number | null;
  totalUnread: number;
  startCall: (userId: number, username: string, callType: 'voice' | 'video') => void;
  activeCall: CallInfo | null;
  incomingCall: IncomingCall | null;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId: number }) {
  const socketRef = useRef<Socket | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    const wsUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:9191';

    const socket = io(wsUrl, {
      path: '/ics-backoffice/socket.io',
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;

    socket.on('new_message', (msg: ChatMessage) => {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const otherName = msg.senderId === currentUserId ? '' : msg.senderUsername;

      setThreads(prev => {
        const idx = prev.findIndex(t => t.userId === otherId);
        if (idx >= 0) {
          const updated = [...prev];
          const isActive = activeThreadIdRef.current === otherId;
          if (updated[idx].messages.some(m => m.id === msg.id)) return prev;
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, msg],
            unread: (msg.senderId !== currentUserId && !isActive)
              ? updated[idx].unread + 1
              : updated[idx].unread,
          };
          return updated;
        }
        if (msg.senderId !== currentUserId) {
          return [...prev, { userId: otherId, username: otherName, messages: [msg], unread: 1 }];
        }
        return prev;
      });
    });

    socket.on('marked_read', ({ fromUserId }: { fromUserId: number }) => {
      setThreads(prev => prev.map(t => t.userId === fromUserId ? { ...t, unread: 0 } : t));
    });

    // --- Call signaling ---
    socket.on('incoming_call', (data: { callerId: number; callerName: string; roomId: string; callType: 'voice' | 'video' }) => {
      setIncomingCall({ callerId: data.callerId, callerName: data.callerName, roomId: data.roomId, callType: data.callType });
    });

    socket.on('call_accepted', (data: { acceptedByName: string; roomId: string }) => {
      setActiveCall(prev => prev ? { ...prev } : null);
    });

    socket.on('call_rejected', (data: { rejectedByName: string }) => {
      setActiveCall(null);
    });

    socket.on('call_ended', () => {
      setActiveCall(null);
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const activeThreadIdRef = useRef<number | null>(null);
  useEffect(() => { activeThreadIdRef.current = activeThreadId; }, [activeThreadId]);

  const openThread = useCallback(async (userId: number, username: string) => {
    setActiveThreadId(userId);
    setThreads(prev => {
      if (prev.find(t => t.userId === userId)) return prev;
      return [...prev, { userId, username, messages: [], unread: 0 }];
    });
    try {
      const res = await chatApi.getConversation(userId);
      setThreads(prev => prev.map(t =>
        t.userId === userId ? { ...t, messages: res.data, unread: 0, username: username || t.username } : t
      ));
    } catch {}
    socketRef.current?.emit('mark_read', { fromUserId: userId });
  }, []);

  const closeThread = useCallback((userId: number) => {
    setThreads(prev => prev.filter(t => t.userId !== userId));
    setActiveThreadId(prev => prev === userId ? null : prev);
  }, []);

  const sendMessage = useCallback((toUserId: number, content: string) => {
    socketRef.current?.emit('send_message', { toUserId, content });
  }, []);

  const startCall = useCallback((userId: number, username: string, callType: 'voice' | 'video') => {
    const roomId = `ics-${Math.min(currentUserId, userId)}-${Math.max(currentUserId, userId)}-${Date.now()}`;
    socketRef.current?.emit('call_invite', { toUserId: userId, roomId, callType });
    setActiveCall({ roomId, callType, withUserId: userId, withUsername: username });
  }, [currentUserId]);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call_accept', { callerId: incomingCall.callerId, roomId: incomingCall.roomId });
    setActiveCall({
      roomId: incomingCall.roomId,
      callType: incomingCall.callType,
      withUserId: incomingCall.callerId,
      withUsername: incomingCall.callerName,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call_reject', { callerId: incomingCall.callerId, roomId: incomingCall.roomId });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (!activeCall) return;
    socketRef.current?.emit('call_end', { toUserId: activeCall.withUserId, roomId: activeCall.roomId });
    setActiveCall(null);
  }, [activeCall]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <ChatContext.Provider value={{
      openThread, closeThread, sendMessage,
      threads, activeThreadId, totalUnread,
      startCall, activeCall, incomingCall, acceptCall, rejectCall, endCall,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
