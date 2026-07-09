'use client';
import { useState } from 'react';
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

export interface ActorNodeData extends Record<string, unknown> {
  name: string;
  roles: string[];
  onRemove: (nodeId: string) => void;
  onNameChange: (nodeId: string, name: string) => void;
  onRolesChange: (nodeId: string, roles: string[]) => void;
}

export type UiFlowNodeType = Node<UiNodeData, 'ui'>;
export type ApiFlowNodeType = Node<ApiNodeData, 'api'>;
export type ConditionFlowNodeType = Node<ConditionNodeData, 'condition'>;
export type ActorFlowNodeType = Node<ActorNodeData, 'actor'>;

const removeBtnCls = "nodrag text-slate-300 hover:text-red-500 transition -mt-0.5 -mr-0.5 flex-shrink-0";
const linkCls = "nodrag text-[11px] text-indigo-500 hover:text-indigo-700 font-medium mt-1.5 inline-block";

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
      {item.roles && item.roles.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.roles.map(role => (
            <span key={role} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">{role}</span>
          ))}
        </div>
      )}
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

export function ActorFlowNode({ id, data, selected }: NodeProps<ActorFlowNodeType>) {
  const { name, roles, onRemove, onNameChange, onRolesChange } = data;
  const [roleInput, setRoleInput] = useState('');

  const addRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    if (!roles.includes(trimmed)) onRolesChange(id, [...roles, trimmed]);
    setRoleInput('');
  };

  return (
    <div className={`relative min-w-[160px] max-w-[190px] rounded-xl border-2 bg-white shadow-sm px-3 pt-2.5 pb-2.5 flex flex-col items-center text-center ${selected ? 'border-violet-500 shadow-md' : 'border-violet-300'}`}>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-violet-500 !border-white" />

      <button onClick={() => onRemove(id)} className={`${removeBtnCls} absolute top-1.5 right-1.5`} title="ลบออกจาก flow">
        <RemoveIcon />
      </button>

      <StickManIcon className="w-9 h-9 text-violet-500" />
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wide mt-0.5">
        Actor
      </span>

      <input
        type="text"
        className="nodrag w-full mt-1.5 px-2 py-1 rounded-md border border-violet-200 bg-white text-xs font-semibold text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-violet-400"
        value={name}
        placeholder="ชื่อ Actor เช่น ลูกค้า, แอดมิน"
        onChange={e => onNameChange(id, e.target.value)}
      />

      {roles.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {roles.map(role => (
            <span key={role} className="nodrag inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {role}
              <button onClick={() => onRolesChange(id, roles.filter(r => r !== role))} className="hover:text-red-500 leading-none" title="ลบ role">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        className="nodrag w-full mt-1.5 px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
        value={roleInput}
        placeholder="+ เพิ่ม role แล้วกด Enter"
        onChange={e => setRoleInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addRole(); }
        }}
        onBlur={addRole}
      />
    </div>
  );
}
