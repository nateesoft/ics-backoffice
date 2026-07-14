'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { UISGEN_TEMPLATES } from '@/lib/uisGenTemplates';
import { uisGenProjectStore } from '@/lib/uisGenProjectStore';
import type { NavPosition } from '@/types/uisGen';

interface NewProjectModalProps {
  onClose: () => void;
}

const DEFAULT_THEME_COLOR = '#4f46e5';

const NAV_POSITION_LABELS: Record<NavPosition, string> = {
  left: 'ซ้าย',
  right: 'ขวา',
  top: 'บน',
  bottom: 'ล่าง',
};

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(UISGEN_TEMPLATES[0].templateId);
  const [navPosition, setNavPosition] = useState<NavPosition>(UISGEN_TEMPLATES[0].navPositions[0] ?? 'left');
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [creating, setCreating] = useState(false);

  const template = UISGEN_TEMPLATES.find(t => t.templateId === templateId) ?? UISGEN_TEMPLATES[0];

  function selectTemplate(id: string) {
    setTemplateId(id);
    const t = UISGEN_TEMPLATES.find(x => x.templateId === id);
    if (t && t.navPositions.length > 0 && !t.navPositions.includes(navPosition)) {
      setNavPosition(t.navPositions[0]);
    }
  }

  function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    const project = uisGenProjectStore.create({
      name: name.trim(),
      templateId,
      navPosition: template.hasNav ? navPosition : 'left',
      themeColor,
    });
    router.push(`/uis-gen/${project.id}`);
  }

  return (
    <Modal title="สร้าง Web Application Project" onClose={onClose} size="lg">
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ชื่อ Project</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น Internal Admin Portal"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Template หลัก</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {UISGEN_TEMPLATES.map(t => (
              <button
                key={t.templateId}
                type="button"
                onClick={() => selectTemplate(t.templateId)}
                className={`text-left rounded-xl border-2 p-3 transition ${
                  templateId === t.templateId ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {template.hasNav && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">ตำแหน่งเมนู (Nav Position)</label>
            <div className="flex flex-wrap gap-2">
              {template.navPositions.map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setNavPosition(pos)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                    navPosition === pos ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {NAV_POSITION_LABELS[pos]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">สีหลัก (Theme Color)</label>
          <input
            type="color"
            className="w-24 h-9 rounded-lg border border-slate-200"
            value={themeColor}
            onChange={e => setThemeColor(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition"
          >
            สร้าง Project
          </button>
        </div>
      </div>
    </Modal>
  );
}
