'use client';
import { useState } from 'react';
import type { Edge } from '@xyflow/react';
import type {
  UisGenActorNodeData, UisGenPageNodeData, UisGenContentNodeData, UisGenModalNodeData, UisGenAlertNodeData,
  UisGenConditionNodeData, ModalPosition, AlertType,
} from '@/types/uisGen';
import { MODAL_POSITIONS, ALERT_TYPES } from '@/types/uisGen';
import PageDesignerModal from './PageDesignerModal';
import { ActionTarget } from './design/ActionStepsEditor';
import type { CanvasNode } from './SitemapCanvas';

interface NodeInspectorProps {
  node: CanvasNode;
  allNodes: CanvasNode[];
  edges: Edge[];
  onUpdate: (updater: (data: CanvasNode['data']) => void) => void;
  onToggleActorAccess: (actorNodeId: string, granted: boolean) => void;
  onClose: () => void;
}

const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white";
const labelCls = "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";

const TYPE_TITLES: Record<CanvasNode['type'], string> = {
  actor: 'Actor',
  page: 'Page',
  content: 'Content Page',
  modal: 'Modal',
  alert: 'Alert',
  condition: 'Condition',
};

function ActorAccessList({ node, allNodes, edges, onToggleActorAccess }: {
  node: CanvasNode; allNodes: CanvasNode[]; edges: Edge[]; onToggleActorAccess: (actorNodeId: string, granted: boolean) => void;
}) {
  const actors = allNodes.filter(n => n.type === 'actor');
  if (actors.length === 0) {
    return <p className="text-[11px] text-slate-400">ยังไม่มี Actor ใน Sitemap — ลากเพิ่มได้จาก palette ด้านซ้าย (ไม่กำหนด = เข้าถึงได้ทุกคน)</p>;
  }
  return (
    <div className="space-y-1.5">
      {actors.map(actor => {
        const granted = edges.some(e => e.source === actor.id && e.target === node.id);
        return (
          <label key={actor.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={granted} onChange={e => onToggleActorAccess(actor.id, e.target.checked)} />
            {(actor.data as UisGenActorNodeData).name || 'ยังไม่ตั้งชื่อ'}
          </label>
        );
      })}
      <p className="text-[11px] text-slate-400 pt-1">ไม่เลือก Actor เลย = เข้าถึงได้ทุกคน (public)</p>
    </div>
  );
}

export default function NodeInspector({ node, allNodes, edges, onUpdate, onToggleActorAccess, onClose }: NodeInspectorProps) {
  const [designerOpen, setDesignerOpen] = useState(false);

  const targets: ActionTarget[] = allNodes
    .filter(n => n.type === 'modal' || n.type === 'alert')
    .map(n => ({ id: n.id, name: (n.data as UisGenModalNodeData | UisGenAlertNodeData).name || 'ยังไม่ตั้งชื่อ', kind: n.type as 'modal' | 'alert' }));

  return (
    <div className="w-80 flex-shrink-0 rounded-2xl border border-slate-100 bg-white p-4 overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{TYPE_TITLES[node.type]}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm" title="ปิด">✕</button>
      </div>

      {node.type === 'actor' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ชื่อ Actor</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenActorNodeData).name}
              placeholder="เช่น Admin, Member"
              onChange={e => onUpdate(d => { (d as UisGenActorNodeData).name = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>สี</label>
            <input
              type="color"
              className="w-full h-9 rounded-lg border border-slate-200"
              value={(node.data as UisGenActorNodeData).color}
              onChange={e => onUpdate(d => { (d as UisGenActorNodeData).color = e.target.value; })}
            />
          </div>
        </div>
      )}

      {(node.type === 'page' || node.type === 'content') && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ชื่อ</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenPageNodeData | UisGenContentNodeData).name}
              onChange={e => onUpdate(d => { (d as UisGenPageNodeData).name = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>Route Path</label>
            <input
              type="text"
              className={`${inputCls} font-mono`}
              value={(node.data as UisGenPageNodeData | UisGenContentNodeData).routePath}
              placeholder="/product"
              onChange={e => onUpdate(d => { (d as UisGenPageNodeData).routePath = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>Actor ที่เข้าถึงได้</label>
            <ActorAccessList node={node} allNodes={allNodes} edges={edges} onToggleActorAccess={onToggleActorAccess} />
          </div>
          <button
            type="button"
            onClick={() => setDesignerOpen(true)}
            className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ออกแบบหน้านี้
          </button>
        </div>
      )}

      {node.type === 'modal' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ชื่อ</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenModalNodeData).name}
              onChange={e => onUpdate(d => { (d as UisGenModalNodeData).name = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>ตำแหน่งแสดง</label>
            <select
              className={inputCls}
              value={(node.data as UisGenModalNodeData).modalPosition}
              onChange={e => onUpdate(d => { (d as UisGenModalNodeData).modalPosition = e.target.value as ModalPosition; })}
            >
              {MODAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setDesignerOpen(true)}
            className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            ออกแบบ Modal
          </button>
        </div>
      )}

      {node.type === 'alert' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ชื่อ</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenAlertNodeData).name}
              onChange={e => onUpdate(d => { (d as UisGenAlertNodeData).name = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>ประเภท</label>
            <select
              className={inputCls}
              value={(node.data as UisGenAlertNodeData).alertType}
              onChange={e => onUpdate(d => { (d as UisGenAlertNodeData).alertType = e.target.value as AlertType; })}
            >
              {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenAlertNodeData).title}
              onChange={e => onUpdate(d => { (d as UisGenAlertNodeData).title = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>Message</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={(node.data as UisGenAlertNodeData).message}
              onChange={e => onUpdate(d => { (d as UisGenAlertNodeData).message = e.target.value; })}
            />
          </div>
        </div>
      )}

      {node.type === 'condition' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ชื่อ</label>
            <input
              type="text"
              className={inputCls}
              value={(node.data as UisGenConditionNodeData).name}
              onChange={e => onUpdate(d => { (d as UisGenConditionNodeData).name = e.target.value; })}
            />
          </div>
          <div>
            <label className={labelCls}>เงื่อนไข (label)</label>
            <input
              type="text"
              className={`${inputCls} font-mono`}
              value={(node.data as UisGenConditionNodeData).label}
              placeholder="เช่น role === 'admin'"
              onChange={e => onUpdate(d => { (d as UisGenConditionNodeData).label = e.target.value; })}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            เชื่อมต่อ output &ldquo;True&rdquo;/&ldquo;False&rdquo; ไปยัง node ถัดไปตามเงื่อนไข — ใช้สำหรับวาด flow บน sitemap
            (การตรวจสอบเงื่อนไขจริงตั้งค่าได้ที่ Step &ldquo;If / Else If / Else&rdquo; ในปุ่ม Action)
          </p>
        </div>
      )}

      {designerOpen && (node.type === 'page' || node.type === 'content' || node.type === 'modal') && (
        <PageDesignerModal
          title={`ออกแบบ — ${(node.data as UisGenPageNodeData).name || TYPE_TITLES[node.type]}`}
          schema={(node.data as UisGenPageNodeData).schema}
          uiSchema={(node.data as UisGenPageNodeData).uiSchema}
          data={(node.data as UisGenPageNodeData).data}
          nodes={allNodes.map(n => ({ id: n.id, type: n.type, data: n.data }))}
          targets={targets}
          onSchemaChange={schema => onUpdate(d => { (d as UisGenPageNodeData).schema = schema; })}
          onUiSchemaChange={uiSchema => onUpdate(d => { (d as UisGenPageNodeData).uiSchema = uiSchema; })}
          onDataChange={data => onUpdate(d => { (d as UisGenPageNodeData).data = data; })}
          onClose={() => setDesignerOpen(false)}
        />
      )}
    </div>
  );
}
