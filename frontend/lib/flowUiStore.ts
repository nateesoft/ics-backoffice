'use client';
import { FlowUiItem, DEFAULT_JSON_SCHEMA, DEFAULT_UI_SCHEMA, DEFAULT_FORM_DATA } from '@/types/flowUi';

const STORAGE_KEY = 'ics-backoffice:flow-generate-uis-v2';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readAll(): FlowUiItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: FlowUiItem[] = raw ? JSON.parse(raw) : [];
    return items.map(item => ({
      ...item,
      roles: item.roles ?? [],
      schema: item.schema ?? DEFAULT_JSON_SCHEMA,
      uiSchema: item.uiSchema ?? DEFAULT_UI_SCHEMA,
      data: item.data ?? DEFAULT_FORM_DATA,
    }));
  } catch {
    return [];
  }
}

function writeAll(items: FlowUiItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type CreateUiData = {
  projectId: string;
  name: string;
  description: string;
  uiType: FlowUiItem['uiType'];
  pageKind: FlowUiItem['pageKind'];
  uiPath: FlowUiItem['uiPath'];
  roles: FlowUiItem['roles'];
  schema?: FlowUiItem['schema'];
  uiSchema?: FlowUiItem['uiSchema'];
  data?: FlowUiItem['data'];
};

export const flowUiStore = {
  getAll(): FlowUiItem[] {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getByProjectId(projectId: string): FlowUiItem[] {
    return readAll().filter(u => u.projectId === projectId);
  },

  getById(id: string): FlowUiItem | null {
    return readAll().find(u => u.id === id) ?? null;
  },

  create(data: CreateUiData): FlowUiItem {
    const now = new Date().toISOString();
    const item: FlowUiItem = {
      id: generateId(),
      schema: DEFAULT_JSON_SCHEMA,
      uiSchema: DEFAULT_UI_SCHEMA,
      data: DEFAULT_FORM_DATA,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), item]);
    return item;
  },

  update(id: string, data: Partial<Omit<FlowUiItem, 'id' | 'createdAt' | 'updatedAt'>>): FlowUiItem | null {
    const items = readAll();
    const idx = items.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const updated: FlowUiItem = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    writeAll(items);
    return updated;
  },

  remove(id: string) {
    writeAll(readAll().filter(u => u.id !== id));
  },
};
