'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FlowApiItem } from '@/types/flowApi';
import { flowApiStore } from '@/lib/flowApiStore';
import { METHOD_COLORS } from '../methodBadge';

interface ActionPickerModalProps {
  projectId?: string;
  onClose: () => void;
  onSelect: (api: FlowApiItem) => void;
}

// Only ever mounted client-side after a user click (never during SSR/initial hydration), so
// reading the localStorage-backed store in a lazy initializer is safe here.
export default function ActionPickerModal({ projectId, onClose, onSelect }: ActionPickerModalProps) {
  const [apis] = useState<FlowApiItem[]>(() => {
    const scoped = projectId ? flowApiStore.getByProjectId(projectId) : [];
    return scoped.length > 0 ? scoped : flowApiStore.getAll();
  });
  const [query, setQuery] = useState('');

  const filtered = apis.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) || a.path.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal title="เลือก API" onClose={onClose} size="md">
      <div className="space-y-3">
        <input
          type="text"
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
          placeholder="ค้นหา API..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            {apis.length === 0 ? 'ยังไม่มี API — สร้างได้ที่เมนู Flow Generate > APIs' : 'ไม่พบ API ที่ค้นหา'}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {filtered.map(api => (
              <button
                key={api.id}
                type="button"
                onClick={() => onSelect(api)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-left transition"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${METHOD_COLORS[api.method]}`}>{api.method}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{api.name}</p>
                  <p className="text-xs font-mono text-slate-400 truncate">{api.path}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
