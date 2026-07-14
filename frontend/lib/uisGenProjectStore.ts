'use client';
import { UisGenProject } from '@/types/uisGen';

const STORAGE_KEY = 'ics-backoffice:uis-gen-projects-v1';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readAll(): UisGenProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items: UisGenProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type CreateProjectData = {
  name: string;
  templateId: string;
  navPosition: UisGenProject['navPosition'];
  themeColor: string;
};

export const uisGenProjectStore = {
  getAll(): UisGenProject[] {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getById(id: string): UisGenProject | null {
    return readAll().find(p => p.id === id) ?? null;
  },

  create(data: CreateProjectData): UisGenProject {
    const now = new Date().toISOString();
    const item: UisGenProject = { id: generateId(), sitemapGenerated: false, ...data, createdAt: now, updatedAt: now };
    writeAll([...readAll(), item]);
    return item;
  },

  update(id: string, data: Partial<Omit<UisGenProject, 'id' | 'createdAt' | 'updatedAt'>>): UisGenProject | null {
    const items = readAll();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated: UisGenProject = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    writeAll(items);
    return updated;
  },

  remove(id: string) {
    writeAll(readAll().filter(p => p.id !== id));
  },
};
