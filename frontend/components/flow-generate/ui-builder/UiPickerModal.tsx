'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FlowUiItem } from '@/types/flowUi';
import { flowUiStore } from '@/lib/flowUiStore';

interface UiPickerModalProps {
  projectId?: string;
  excludeUiId?: string;
  onClose: () => void;
  onSelect: (ui: FlowUiItem) => void;
}

function uiTypeBadge(ui: FlowUiItem): string {
  if (ui.uiType === 'Component') return 'Component';
  return `Page · ${ui.pageKind}`;
}

// Only ever mounted client-side after a user click, so reading the localStorage-backed store in
// a lazy initializer is safe here (same pattern as ActionPickerModal).
export default function UiPickerModal({ projectId, excludeUiId, onClose, onSelect }: UiPickerModalProps) {
  const [uis] = useState<FlowUiItem[]>(() => {
    const scoped = projectId ? flowUiStore.getByProjectId(projectId) : flowUiStore.getAll();
    return scoped.filter(u => u.id !== excludeUiId);
  });
  const [query, setQuery] = useState('');

  const filtered = uis.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal title="เลือก UI / Modal" onClose={onClose} size="md">
      <div className="space-y-3">
        <input
          type="text"
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
          placeholder="ค้นหา UI..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            {uis.length === 0 ? 'ยังไม่มี UI อื่นในโปรเจคนี้ — สร้างได้ที่เมนู Flow Generate > UIs' : 'ไม่พบ UI ที่ค้นหา'}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {filtered.map(ui => (
              <button
                key={ui.id}
                type="button"
                onClick={() => onSelect(ui)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-left transition"
              >
                <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 bg-teal-50 text-teal-600">{uiTypeBadge(ui)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{ui.name}</p>
                  {ui.description && <p className="text-xs text-slate-400 truncate">{ui.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
