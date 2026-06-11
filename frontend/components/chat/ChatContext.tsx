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

interface ChatContextValue {
  openThread: (userId: number, username: string) => void;
  closeThread: (userId: number) => void;
  sendMessage: (toUserId: number, content: string) => void;
  threads: ChatThread[];
  activeThreadId: number | null;
  totalUnread: number;
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

  useEffect(() => {
    const wsBase = (process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api')
      .replace(/\/api$/, '')
      .replace(/^\//, '');
    const wsUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';

    const socket = io(wsUrl, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('new_message', (msg: ChatMessage) => {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const otherName = msg.senderId === currentUserId ? '' : msg.senderUsername;

      setThreads(prev => {
        const idx = prev.findIndex(t => t.userId === otherId);
        if (idx >= 0) {
          const updated = [...prev];
          const isActive = activeThreadIdRef.current === otherId;
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
          return [...prev, {
            userId: otherId,
            username: otherName,
            messages: [msg],
            unread: 1,
          }];
        }
        return prev;
      });
    });

    socket.on('marked_read', ({ fromUserId }: { fromUserId: number }) => {
      setThreads(prev => prev.map(t =>
        t.userId === fromUserId ? { ...t, unread: 0 } : t
      ));
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // keep a ref so the socket event closure can read the latest value
  const activeThreadIdRef = useRef<number | null>(null);
  useEffect(() => { activeThreadIdRef.current = activeThreadId; }, [activeThreadId]);

  const openThread = useCallback(async (userId: number, username: string) => {
    setActiveThreadId(userId);
    setThreads(prev => {
      if (prev.find(t => t.userId === userId)) return prev;
      return [...prev, { userId, username, messages: [], unread: 0 }];
    });

    // load history & clear unread
    try {
      const res = await chatApi.getConversation(userId);
      setThreads(prev => prev.map(t =>
        t.userId === userId
          ? { ...t, messages: res.data, unread: 0, username: username || t.username }
          : t
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

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <ChatContext.Provider value={{ openThread, closeThread, sendMessage, threads, activeThreadId, totalUnread }}>
      {children}
    </ChatContext.Provider>
  );
}
