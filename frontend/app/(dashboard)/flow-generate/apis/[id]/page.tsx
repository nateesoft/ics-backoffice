'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import { METHOD_COLORS } from '@/components/flow-generate/methodBadge';
import { FlowApiItem, HTTP_METHODS, API_AUTH_TYPES, API_KINDS, HttpMethod, ApiAuthType, ApiKind } from '@/types/flowApi';
import { flowApiStore } from '@/lib/flowApiStore';
import { flowProjectsStore } from '@/lib/flowItemsStore';

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

function isValidJson(text: string) {
  if (!text.trim()) return true;
  try { JSON.parse(text); return true; } catch { return false; }
}

export default function FlowApiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [api, setApi] = useState<FlowApiItem | null | undefined>(undefined);
  const [projectName, setProjectName] = useState('Unknown Project');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('');
  const [payload, setPayload] = useState('');
  const [authType, setAuthType] = useState<ApiAuthType>('None');
  const [apiType, setApiType] = useState<ApiKind>('REST API');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const a = flowApiStore.getById(params.id);
    setApi(a);
    if (a) {
      setName(a.name);
      setDescription(a.description);
      setMethod(a.method);
      setPath(a.path);
      setPayload(a.payload);
      setAuthType(a.authType);
      setApiType(a.apiType);
      const project = flowProjectsStore.getById(a.projectId);
      setProjectName(project ? project.name : 'Unknown Project');
    }
  }, [params.id]);

  function handleSave() {
    if (!api) return;
    if (!name.trim()) { setError('กรุณากรอก API Name'); return; }
    if (!path.trim()) { setError('กรุณากรอก Path'); return; }
    if (!isValidJson(payload)) { setError('Payload ต้องเป็น JSON ที่ถูกต้อง'); return; }
    setError('');
    const updated = flowApiStore.update(api.id, {
      name: name.trim(),
      description: description.trim(),
      method,
      path: path.trim(),
      payload: payload.trim(),
      authType,
      apiType,
    });
    if (updated) {
      setApi(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  if (api === undefined) return null;

  if (api === null) {
    return (
      <div className="space-y-5">
        <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'APIs', href: '/flow-generate/apis' }, { label: 'Not Found' }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">ไม่พบ API นี้</h2>
          <button
            onClick={() => router.push('/flow-generate/apis')}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            กลับไปหน้ารายการ API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <FlowBreadcrumb items={[{ label: 'Flow Generate', href: '/flow-generate' }, { label: 'APIs', href: '/flow-generate/apis' }, { label: api.name }]} />

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800">แก้ไขรายละเอียด API</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${METHOD_COLORS[api.method]}`}>{api.method}</span>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">Project: <span className="font-medium text-slate-600">{projectName}</span></p>
        <p className="text-slate-400 text-xs mt-0.5">API ID: <span className="font-mono">{api.id}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <label className={labelCls}>API Name</label>
          <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
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
          <input type="text" className={`${inputCls} font-mono`} value={path} onChange={e => setPath(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Payload (JSON)</label>
          <textarea className={`${inputCls} resize-none font-mono`} rows={4} value={payload} onChange={e => setPayload(e.target.value)} />
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

        <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
          {saved && <span className="text-sm text-green-600 font-medium">บันทึกแล้ว</span>}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
