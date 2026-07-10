'use client';
import { FlowApiItem } from '@/types/flowApi';

const STORAGE_KEY = 'ics-backoffice:flow-generate-apis-v2';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Backfills fields added after some items were already persisted (e.g. sampleData/steps).
function normalize(item: FlowApiItem): FlowApiItem {
  return { ...item, sampleData: item.sampleData ?? '', steps: item.steps ?? [] };
}

function readAll(): FlowApiItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: FlowApiItem[] = raw ? JSON.parse(raw) : [];
    return items.map(normalize);
  } catch {
    return [];
  }
}

function writeAll(items: FlowApiItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type CreateApiData = {
  projectId: string;
  name: string;
  description: string;
  method: FlowApiItem['method'];
  path: string;
  payload: string;
  authType: FlowApiItem['authType'];
  apiType: FlowApiItem['apiType'];
  sampleData?: string;
  steps?: FlowApiItem['steps'];
};

export const flowApiStore = {
  getAll(): FlowApiItem[] {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getByProjectId(projectId: string): FlowApiItem[] {
    return readAll().filter(a => a.projectId === projectId);
  },

  getById(id: string): FlowApiItem | null {
    return readAll().find(a => a.id === id) ?? null;
  },

  create(data: CreateApiData): FlowApiItem {
    const now = new Date().toISOString();
    const item: FlowApiItem = {
      id: generateId(),
      sampleData: '',
      steps: [],
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), item]);
    return item;
  },

  update(id: string, data: Partial<Omit<FlowApiItem, 'id' | 'createdAt' | 'updatedAt'>>): FlowApiItem | null {
    const items = readAll();
    const idx = items.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const updated: FlowApiItem = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    writeAll(items);
    return updated;
  },

  remove(id: string) {
    writeAll(readAll().filter(a => a.id !== id));
  },
};
