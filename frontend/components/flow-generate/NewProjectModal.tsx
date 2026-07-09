'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FlowProject } from '@/types/flowProject';
import { FLOW_TEMPLATES, getFlowTemplate } from '@/lib/flowTemplates';
import { flowProjectsStore } from '@/lib/flowProjectsStore';

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: (project: FlowProject) => void;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

export default function NewProjectModal({ onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<FlowProject | null>(null);

  const selectedTemplate = templateId ? getFlowTemplate(templateId) : null;

  function handleSave() {
    if (!name.trim()) { setError('กรุณากรอกชื่อโปรเจค'); return; }
    if (!templateId) { setError('กรุณาเลือก Template'); return; }
    setError('');
    const project = flowProjectsStore.create({
      name: name.trim(),
      description: description.trim(),
      templateId,
    });
    setCreated(project);
  }

  if (created) {
    return (
      <Modal title="สร้างโปรเจคสำเร็จ" onClose={() => onCreated(created)} size="md">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            สร้างโปรเจค &ldquo;{created.name}&rdquo; สำเร็จแล้ว
          </p>
          <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อเข้าไปยังหน้ารายละเอียดโปรเจค</p>
          <button
            onClick={() => onCreated(created)}
            className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ไปยังหน้าโปรเจค
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="New Project" onClose={onClose} size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Project ID</label>
          <input type="text" className={`${inputCls} bg-slate-50 text-slate-400`} value="จะถูกสร้างอัตโนมัติ (UUID)" disabled />
        </div>

        <div>
          <label className={labelCls}>ชื่อโปรเจค</label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น Inventory Management"
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
            placeholder="อธิบายรายละเอียดโปรเจค..."
          />
        </div>

        <div>
          <label className={labelCls}>Template สำหรับ Clone</label>
          <div className="flex items-center gap-2">
            <div className={`${inputCls} bg-slate-50 flex-1 truncate`}>
              {selectedTemplate ? (
                <span className="text-slate-700">{selectedTemplate.name} <span className="text-slate-400">({selectedTemplate.templateId})</span></span>
              ) : (
                <span className="text-slate-400">ยังไม่ได้เลือก Template</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(v => !v)}
              className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition flex-shrink-0"
            >
              Browse
            </button>
          </div>

          {showTemplates && (
            <div className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {FLOW_TEMPLATES.map(t => (
                <button
                  key={t.templateId}
                  type="button"
                  onClick={() => { setTemplateId(t.templateId); setShowTemplates(false); }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition ${templateId === t.templateId ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${templateId === t.templateId ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <span className="text-sm font-medium text-slate-800">{t.name}</span>
                    <span className="text-xs text-slate-400">{t.templateId}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-4">{t.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

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
