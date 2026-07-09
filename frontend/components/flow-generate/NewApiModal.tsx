'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FlowApiItem, HTTP_METHODS, API_AUTH_TYPES, API_KINDS, HttpMethod, ApiAuthType, ApiKind } from '@/types/flowApi';
import { FlowProject } from '@/types/flowProject';
import { flowProjectsStore } from '@/lib/flowItemsStore';
import { flowApiStore } from '@/lib/flowApiStore';

interface NewApiModalProps {
  onClose: () => void;
  onCreated: (api: FlowApiItem) => void;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

function isValidJson(text: string) {
  if (!text.trim()) return true;
  try { JSON.parse(text); return true; } catch { return false; }
}

export default function NewApiModal({ onClose, onCreated }: NewApiModalProps) {
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('');
  const [payload, setPayload] = useState('');
  const [authType, setAuthType] = useState<ApiAuthType>('None');
  const [apiType, setApiType] = useState<ApiKind>('REST API');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<FlowApiItem | null>(null);

  useEffect(() => {
    setProjects(flowProjectsStore.getAll());
  }, []);

  function handleSave() {
    if (!projectId) { setError('กรุณาเลือกโปรเจค'); return; }
    if (!name.trim()) { setError('กรุณากรอก API Name'); return; }
    if (!path.trim()) { setError('กรุณากรอก Path'); return; }
    if (!isValidJson(payload)) { setError('Payload ต้องเป็น JSON ที่ถูกต้อง'); return; }
    setError('');
    const api = flowApiStore.create({
      projectId,
      name: name.trim(),
      description: description.trim(),
      method,
      path: path.trim(),
      payload: payload.trim(),
      authType,
      apiType,
    });
    setCreated(api);
  }

  if (created) {
    return (
      <Modal title="สร้าง API สำเร็จ" onClose={() => onCreated(created)} size="md">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            สร้าง API &ldquo;{created.name}&rdquo; สำเร็จแล้ว
          </p>
          <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อเข้าไปยังหน้ารายละเอียด API</p>
          <button
            onClick={() => onCreated(created)}
            className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ไปยังหน้า API
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="New API" onClose={onClose} size="md">
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
          <label className={labelCls}>API Name</label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น Get User List"
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
            placeholder="อธิบายรายละเอียด API..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Method</label>
            <select className={inputCls} value={method} onChange={e => setMethod(e.target.value as HttpMethod)}>
              {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>ประเภท API</label>
            <select className={inputCls} value={apiType} onChange={e => setApiType(e.target.value as ApiKind)}>
              {API_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Path</label>
          <input
            type="text"
            className={`${inputCls} font-mono`}
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/api/users/:id"
          />
        </div>

        <div>
          <label className={labelCls}>Payload (JSON)</label>
          <textarea
            className={`${inputCls} resize-none font-mono`}
            rows={4}
            value={payload}
            onChange={e => setPayload(e.target.value)}
            placeholder={'{\n  "name": "string"\n}'}
          />
        </div>

        <div>
          <label className={labelCls}>Authentication</label>
          <select className={inputCls} value={authType} onChange={e => setAuthType(e.target.value as ApiAuthType)}>
            {API_AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
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
