'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FlowUiItem, UI_TYPES, PAGE_KINDS, UiType, PageKind } from '@/types/flowUi';
import { FlowProject } from '@/types/flowProject';
import { flowProjectsStore } from '@/lib/flowItemsStore';
import { flowUiStore } from '@/lib/flowUiStore';

interface NewUiModalProps {
  onClose: () => void;
  onCreated: (ui: FlowUiItem) => void;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

export default function NewUiModal({ onClose, onCreated }: NewUiModalProps) {
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uiType, setUiType] = useState<UiType>('Page');
  const [pageKind, setPageKind] = useState<PageKind>('Main Page');
  const [uiPath, setUiPath] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<FlowUiItem | null>(null);

  useEffect(() => {
    setProjects(flowProjectsStore.getAll());
  }, []);

  const showPageKind = uiType === 'Page';
  const showUiPath = uiType === 'Page' && pageKind === 'Main Page';

  function handleSave() {
    if (!projectId) { setError('กรุณาเลือกโปรเจค'); return; }
    if (!name.trim()) { setError('กรุณากรอก UI Name'); return; }
    if (showUiPath && !uiPath.trim()) { setError('กรุณากรอก UI Path'); return; }
    setError('');
    const ui = flowUiStore.create({
      projectId,
      name: name.trim(),
      description: description.trim(),
      uiType,
      pageKind: showPageKind ? pageKind : null,
      uiPath: showUiPath ? uiPath.trim() : null,
    });
    setCreated(ui);
  }

  if (created) {
    return (
      <Modal title="สร้าง UI สำเร็จ" onClose={() => onCreated(created)} size="md">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            สร้าง UI &ldquo;{created.name}&rdquo; สำเร็จแล้ว
          </p>
          <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อเข้าไปยังหน้ารายละเอียด UI</p>
          <button
            onClick={() => onCreated(created)}
            className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ไปยังหน้า UI
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="New UI" onClose={onClose} size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Project</label>
          {projects.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ยังไม่มีโปรเจค — กรุณาสร้างโปรเจคที่หน้า Flow Generate ก่อน
            </p>
          ) : (
            <select className={inputCls} value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">-- เลือกโปรเจค --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={labelCls}>UI Name</label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น User List Page"
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="อธิบายรายละเอียด UI..."
          />
        </div>

        <div>
          <label className={labelCls}>ประเภท UI</label>
          <select className={inputCls} value={uiType} onChange={e => setUiType(e.target.value as UiType)}>
            {UI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {showPageKind && (
          <div>
            <label className={labelCls}>ประเภท Page</label>
            <select className={inputCls} value={pageKind} onChange={e => setPageKind(e.target.value as PageKind)}>
              {PAGE_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        {showUiPath && (
          <div>
            <label className={labelCls}>UI Path</label>
            <input
              type="text"
              className={`${inputCls} font-mono`}
              value={uiPath}
              onChange={e => setUiPath(e.target.value)}
              placeholder="/products"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
}
