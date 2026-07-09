'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import Link from 'next/link';
import { FlowUiItem } from '@/types/flowUi';
import { FlowApiItem } from '@/types/flowApi';
import { METHOD_COLORS } from './methodBadge';

export interface UiNodeData extends Record<string, unknown> {
  item: FlowUiItem;
  onRemove: (nodeId: string) => void;
}

export interface ApiNodeData extends Record<string, unknown> {
  item: FlowApiItem;
  onRemove: (nodeId: string) => void;
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  onRemove: (nodeId: string) => void;
  onLabelChange: (nodeId: string, label: string) => void;
}

export type UiFlowNodeType = Node<UiNodeData, 'ui'>;
export type ApiFlowNodeType = Node<ApiNodeData, 'api'>;
export type ConditionFlowNodeType = Node<ConditionNodeData, 'condition'>;

const removeBtnCls = "nodrag text-slate-300 hover:text-red-500 transition -mt-0.5 -mr-0.5 flex-shrink-0";
const linkCls = "nodrag text-[11px] text-indigo-500 hover:text-indigo-700 font-medium mt-1.5 inline-block";

function RemoveIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function UiFlowNode({ id, data, selected }: NodeProps<UiFlowNodeType>) {
  const { item, onRemove } = data;
  return (
    <div className={`min-w-[180px] max-w-[220px] rounded-xl border-2 bg-white shadow-sm px-3 py-2.5 ${selected ? 'border-teal-500 shadow-md' : 'border-teal-200'}`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-teal-500 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-teal-500 !border-white" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 uppercase tracking-wide truncate">
          {item.uiType === 'Component' ? 'Component' : item.pageKind}
        </span>
        <button onClick={() => onRemove(id)} className={removeBtnCls} title="ลบออกจาก flow">
          <RemoveIcon />
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={item.name}>{item.name}</p>
      {item.uiPath && <p className="text-xs font-mono text-slate-400 truncate">{item.uiPath}</p>}
      <Link href={`/flow-generate/uis/${item.id}`} className={linkCls}>
        เปิดรายละเอียด →
      </Link>
    </div>
  );
}

export function ApiFlowNode({ id, data, selected }: NodeProps<ApiFlowNodeType>) {
  const { item, onRemove } = data;
  return (
    <div className={`min-w-[180px] max-w-[220px] rounded-xl border-2 bg-white shadow-sm px-3 py-2.5 ${selected ? 'border-indigo-500 shadow-md' : 'border-indigo-200'}`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-white" />
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${METHOD_COLORS[item.method]}`}>
          {item.method}
        </span>
        <button onClick={() => onRemove(id)} className={removeBtnCls} title="ลบออกจาก flow">
          <RemoveIcon />
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-800 mt-1 truncate" title={item.name}>{item.name}</p>
      <p className="text-xs font-mono text-slate-400 truncate">{item.path}</p>
      <Link href={`/flow-generate/apis/${item.id}`} className={linkCls}>
        เปิดรายละเอียด →
      </Link>
    </div>
  );
}

export function ConditionFlowNode({ id, data, selected }: NodeProps<ConditionFlowNodeType>) {
  const { label, onRemove, onLabelChange } = data;
  return (
    <div className={`min-w-[190px] max-w-[230px] rounded-xl border-2 bg-amber-50 shadow-sm px-3 py-2.5 ${selected ? 'border-amber-500 shadow-md' : 'border-amber-300'}`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-500 !border-white" />

      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
          Condition
        </span>
        <button onClick={() => onRemove(id)} className={removeBtnCls} title="ลบออกจาก flow">
          <RemoveIcon />
        </button>
      </div>

      <input
        type="text"
        className="nodrag w-full mt-1.5 px-2 py-1 rounded-md border border-amber-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={label}
        placeholder="เช่น status === 'success'"
        onChange={e => onLabelChange(id, e.target.value)}
      />

      <div className="mt-2 flex flex-col gap-1.5 text-[10px] font-semibold">
        <div className="flex items-center justify-end gap-1.5 text-green-600">
          True
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center justify-end gap-1.5 text-red-600">
          False
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="true" style={{ top: '72%' }} className="!w-2.5 !h-2.5 !bg-green-500 !border-white" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '90%' }} className="!w-2.5 !h-2.5 !bg-red-500 !border-white" />
    </div>
  );
}
