'use client';
import { UisGenSitemapState } from '@/types/uisGen';

const STORAGE_KEY = 'ics-backoffice:uis-gen-sitemap-v1';

function readAll(): Record<string, UisGenSitemapState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, UisGenSitemapState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export const uisGenSitemapStore = {
  getByProjectId(projectId: string): UisGenSitemapState {
    const all = readAll();
    return all[projectId] ?? { nodes: [], edges: [] };
  },

  save(projectId: string, state: UisGenSitemapState) {
    const all = readAll();
    all[projectId] = state;
    writeAll(all);
  },

  remove(projectId: string) {
    const all = readAll();
    delete all[projectId];
    writeAll(all);
  },
};
