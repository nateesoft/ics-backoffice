'use client';
import { useState, useEffect, useCallback } from 'react';
import { pushApi } from '@/lib/api';

const VAPID_PUBLIC_KEY = 'BMCUPqW8epGD6sboBTzwWi6JYRhxxIH1tOWd_2gFgTFq9c5B8wcczW3hRSzaS5KZcK-niolcTa8fLnzMOIYW6jE';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading';

export function usePushNotification() {
  const [state, setState] = useState<PushState>('loading');

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker
      .register('/ics-backoffice/sw.js', { scope: '/ics-backoffice/' })
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setState(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setState('unsupported'));
  }, []);

  const subscribe = useCallback(async () => {
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.register('/ics-backoffice/sw.js', {
        scope: '/ics-backoffice/',
      });
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      await pushApi.subscribe({
        endpoint: sub.endpoint,
        p256dh: (json.keys as any).p256dh,
        auth: (json.keys as any).auth,
      });
      setState('subscribed');
    } catch {
      setState('unsubscribed');
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/ics-backoffice/');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } catch {
      setState('subscribed');
    }
  }, []);

  return { state, subscribe, unsubscribe };
}
