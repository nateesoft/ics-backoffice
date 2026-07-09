'use client';
import { FlowProject } from '@/types/flowProject';

const STORAGE_KEY = 'ics-backoffice:flow-generate-projects';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readAll(): FlowProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(projects: FlowProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const flowProjectsStore = {
  getAll(): FlowProject[] {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getById(id: string): FlowProject | null {
    return readAll().find(p => p.id === id) ?? null;
  },

  create(data: { name: string; description: string; templateId: string }): FlowProject {
    const now = new Date().toISOString();
    const project: FlowProject = {
      id: generateId(),
      name: data.name,
      description: data.description,
      templateId: data.templateId,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), project]);
    return project;
  },

  update(id: string, data: Partial<Pick<FlowProject, 'name' | 'description' | 'templateId'>>): FlowProject | null {
    const projects = readAll();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated: FlowProject = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
    projects[idx] = updated;
    writeAll(projects);
    return updated;
  },

  remove(id: string) {
    writeAll(readAll().filter(p => p.id !== id));
  },
};
