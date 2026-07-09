'use client';
import { FlowProject } from '@/types/flowProject';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface FlowItemsStore {
  getAll(): FlowProject[];
  getById(id: string): FlowProject | null;
  create(data: Omit<FlowProject, 'id' | 'createdAt' | 'updatedAt'>): FlowProject;
  update(id: string, data: Partial<Omit<FlowProject, 'id' | 'createdAt' | 'updatedAt'>>): FlowProject | null;
  remove(id: string): void;
}

export function createFlowItemsStore(storageKey: string): FlowItemsStore {
  function readAll(): FlowProject[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function writeAll(items: FlowProject[]) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  return {
    getAll() {
      return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    getById(id) {
      return readAll().find(p => p.id === id) ?? null;
    },

    create(data) {
      const now = new Date().toISOString();
      const item: FlowProject = { id: generateId(), ...data, createdAt: now, updatedAt: now };
      writeAll([...readAll(), item]);
      return item;
    },

    update(id, data) {
      const items = readAll();
      const idx = items.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const updated: FlowProject = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      items[idx] = updated;
      writeAll(items);
      return updated;
    },

    remove(id) {
      writeAll(readAll().filter(p => p.id !== id));
    },
  };
}

export const flowProjectsStore = createFlowItemsStore('ics-backoffice:flow-generate-projects-v2');
