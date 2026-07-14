'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import type {
  UisGenActorNodeData, UisGenPageNodeData, UisGenContentNodeData, UisGenModalNodeData, UisGenAlertNodeData,
  UisGenConditionNodeData,
} from '@/types/uisGen';

// Each xyflow node's `data` carries the *complete* persisted payload for that node (including
// schema/uiSchema/data for page-like/modal nodes) plus an `onRemove` callback for the card UI —
// so SitemapCanvas's node state is the single source of truth, no parallel store needed.
export interface ActorNodeData extends UisGenActorNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}
export interface PageNodeData extends UisGenPageNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}
export interface ContentNodeData extends UisGenContentNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}
export interface ModalNodeData extends UisGenModalNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}
export interface AlertNodeData extends UisGenAlertNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}
export interface ConditionNodeData extends UisGenConditionNodeData, Record<string, unknown> {
  onRemove: (nodeId: string) => void;
}

export type ActorFlowNodeType = Node<ActorNodeData, 'actor'>;
export type PageFlowNodeType = Node<PageNodeData, 'page'>;
export type ContentFlowNodeType = Node<ContentNodeData, 'content'>;
export type ModalFlowNodeType = Node<ModalNodeData, 'modal'>;
export type AlertFlowNodeType = Node<AlertNodeData, 'alert'>;
export type ConditionFlowNodeType = Node<ConditionNodeData, 'condition'>;

const removeBtnCls = "nodrag text-slate-300 hover:text-red-500 transition -mt-0.5 -mr-0.5 flex-shrink-0";

function RemoveIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StickManIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="15" />
      <line x1="5" y1="11" x2="19" y2="11" />
      <line x1="12" y1="15" x2="6" y2="22" />
      <line x1="12" y1="15" x2="18" y2="22" />
    </svg>
  );
}

// Every node gets 2 target (input) ports — ids 'in1'/'in2' at 35%/65% down the left edge — and 2
// source (output) ports — ids 'out1'/'out2' at 35%/65% down the right edge — so a single node can
// wire multiple distinct incoming/outgoing edges without them all bunching on one point. Plain
// nodes leave the ports unlabeled (generic wiring flexibility); Condition labels its two outputs
// True/False (see ConditionFlowNode below).
function InOutHandles({ color, outputLabels }: { color: string; outputLabels?: [string, string] }) {
  return (
    <>
      <Handle id="in1" type="target" position={Position.Left} style={{ top: '35%' }} className={`!w-2.5 !h-2.5 ${color} !border-white`} />
      <Handle id="in2" type="target" position={Position.Left} style={{ top: '65%' }} className={`!w-2.5 !h-2.5 ${color} !border-white`} />
      <Handle id="out1" type="source" position={Position.Right} style={{ top: '35%' }} className={`!w-2.5 !h-2.5 ${outputLabels ? '!bg-emerald-500' : color} !border-white`} />
      <Handle id="out2" type="source" position={Position.Right} style={{ top: '65%' }} className={`!w-2.5 !h-2.5 ${outputLabels ? '!bg-red-500' : color} !border-white`} />
      {outputLabels && (
        <>
          <span className="absolute text-[9px] font-semibold text-emerald-600" style={{ top: '35%', right: 10, transform: 'translateY(-140%)' }}>{outputLabels[0]}</span>
          <span className="absolute text-[9px] font-semibold text-red-600" style={{ top: '65%', right: 10, transform: 'translateY(-140%)' }}>{outputLabels[1]}</span>
        </>
      )}
    </>
  );
}

function CardShell({
  id, selected, borderColor, badgeClass, badge, onRemove, children, outputLabels,
}: {
  id: string;
  selected?: boolean;
  borderColor: string;
  badgeClass: string;
  badge: string;
  onRemove: (nodeId: string) => void;
  children: React.ReactNode;
  outputLabels?: [string, string];
}) {
  return (
    <div className={`relative min-w-[180px] max-w-[220px] rounded-xl border-2 bg-white shadow-sm px-3 py-2.5 ${selected ? `${borderColor} shadow-md` : 'border-slate-200'}`}>
      <InOutHandles color="!bg-slate-400" outputLabels={outputLabels} />
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide truncate ${badgeClass}`}>{badge}</span>
        <button onClick={() => onRemove(id)} className={removeBtnCls} title="ลบออกจาก sitemap">
          <RemoveIcon />
        </button>
      </div>
      {children}
    </div>
  );
}

export function ActorFlowNode({ id, data, selected }: NodeProps<ActorFlowNodeType>) {
  return (
    <div className={`relative min-w-[150px] max-w-[180px] rounded-xl border-2 bg-white shadow-sm px-3 pt-2.5 pb-2.5 flex flex-col items-center text-center ${selected ? 'border-violet-500 shadow-md' : 'border-violet-300'}`}>
      <InOutHandles color="!bg-violet-500" />
      <button onClick={() => data.onRemove(id)} className={`${removeBtnCls} absolute top-1.5 right-1.5`} title="ลบออกจาก sitemap">
        <RemoveIcon />
      </button>
      <StickManIcon className="w-8 h-8 text-violet-500" />
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wide mt-0.5">Actor</span>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate w-full" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
    </div>
  );
}

export function PageFlowNode({ id, data, selected }: NodeProps<PageFlowNodeType>) {
  return (
    <CardShell id={id} selected={selected} borderColor="border-teal-500" badgeClass="bg-teal-50 text-teal-600" badge="Page" onRemove={data.onRemove}>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
      <p className="text-xs font-mono text-slate-400 truncate">{data.routePath || '/'}</p>
      <p className="text-[10px] text-slate-400 mt-1">Full-screen — ไม่ใช้ Shell หลัก</p>
    </CardShell>
  );
}

export function ContentFlowNode({ id, data, selected }: NodeProps<ContentFlowNodeType>) {
  return (
    <CardShell id={id} selected={selected} borderColor="border-indigo-500" badgeClass="bg-indigo-50 text-indigo-600" badge="Content" onRemove={data.onRemove}>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
      <p className="text-xs font-mono text-slate-400 truncate">{data.routePath || '/'}</p>
      <p className="text-[10px] text-slate-400 mt-1">แสดงใน Content Slot ของ Shell หลัก</p>
    </CardShell>
  );
}

export function ModalFlowNode({ id, data, selected }: NodeProps<ModalFlowNodeType>) {
  return (
    <CardShell id={id} selected={selected} borderColor="border-amber-500" badgeClass="bg-amber-50 text-amber-700" badge="Modal" onRemove={data.onRemove}>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
      <p className="text-[10px] text-slate-400 mt-1">ตำแหน่ง: {data.modalPosition}</p>
    </CardShell>
  );
}

export function AlertFlowNode({ id, data, selected }: NodeProps<AlertFlowNodeType>) {
  return (
    <CardShell id={id} selected={selected} borderColor="border-rose-500" badgeClass="bg-rose-50 text-rose-600" badge="Alert" onRemove={data.onRemove}>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
      <p className="text-[10px] text-slate-400 mt-1 capitalize">ประเภท: {data.alertType}</p>
    </CardShell>
  );
}

export function ConditionFlowNode({ id, data, selected }: NodeProps<ConditionFlowNodeType>) {
  return (
    <CardShell id={id} selected={selected} borderColor="border-amber-500" badgeClass="bg-amber-100 text-amber-700" badge="Condition" onRemove={data.onRemove} outputLabels={['True', 'False']}>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={data.name}>{data.name || 'ยังไม่ตั้งชื่อ'}</p>
      <p className="text-xs text-slate-500 mt-1 truncate" title={data.label}>{data.label || 'เงื่อนไข...'}</p>
    </CardShell>
  );
}
