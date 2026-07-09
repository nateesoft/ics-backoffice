'use client';
import { FlowCanvasState } from '@/types/flowCanvas';

const STORAGE_KEY = 'ics-backoffice:flow-generate-canvas-v1';

function readAll(): Record<string, FlowCanvasState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, FlowCanvasState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export const flowCanvasStore = {
  getByProjectId(projectId: string): FlowCanvasState {
    const all = readAll();
    return all[projectId] ?? { nodes: [], edges: [] };
  },

  save(projectId: string, state: FlowCanvasState) {
    const all = readAll();
    all[projectId] = state;
    writeAll(all);
  },
};
