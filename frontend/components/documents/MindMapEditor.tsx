'use client';
import { useState, useRef } from 'react';

type MindNode = { id: string; label: string; parentId: string | null; x: number; y: number; };
type MindMapData = { nodes: MindNode[]; };

const BRANCH_COLORS = [
  { fill: '#eff6ff', stroke: '#3b82f6', text: '#1d4ed8' },
  { fill: '#f0fdf4', stroke: '#22c55e', text: '#15803d' },
  { fill: '#fdf4ff', stroke: '#a855f7', text: '#7e22ce' },
  { fill: '#fff7ed', stroke: '#f97316', text: '#c2410c' },
  { fill: '#fdf2f8', stroke: '#ec4899', text: '#9d174d' },
  { fill: '#f0fdfa', stroke: '#14b8a6', text: '#0f766e' },
  { fill: '#fefce8', stroke: '#eab308', text: '#854d0e' },
];
const ROOT_STYLE = { fill: '#eef2ff', stroke: '#6366f1', text: '#4338ca' };

const NW = 130, NH = 38;
const CW = 700, CH = 460;

function uid() { return Math.random().toString(36).slice(2, 8); }

function parseData(v: string): MindMapData {
  try {
    const d = JSON.parse(v);
    if (Array.isArray(d?.nodes)) return d;
  } catch {}
  const cx = CW / 2 - NW / 2, cy = CH / 2 - NH / 2;
  return {
    nodes: [
      { id: 'root', label: 'Main Topic', parentId: null, x: cx, y: cy },
      { id: 'n1', label: 'Branch 1', parentId: 'root', x: cx - 230, y: cy - 90 },
      { id: 'n2', label: 'Branch 2', parentId: 'root', x: cx - 230, y: cy + 50 },
      { id: 'n3', label: 'Branch 3', parentId: 'root', x: cx + 230, y: cy - 90 },
      { id: 'n4', label: 'Branch 4', parentId: 'root', x: cx + 230, y: cy + 50 },
    ],
  };
}

function getBranchColor(nodes: MindNode[], nodeId: string) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.parentId === null) return ROOT_STYLE;
  const root = nodes.find(n => n.parentId === null);
  if (!root) return BRANCH_COLORS[0];
  let cur = node;
  while (cur.parentId !== root.id && cur.parentId !== null) {
    const p = nodes.find(n => n.id === cur.parentId);
    if (!p) break;
    cur = p;
  }
  const siblings = nodes.filter(n => n.parentId === root.id);
  const idx = siblings.findIndex(n => n.id === cur.id);
  return BRANCH_COLORS[(idx >= 0 ? idx : 0) % BRANCH_COLORS.length];
}

function nc(n: MindNode) { return { x: n.x + NW / 2, y: n.y + NH / 2 }; }

function edgePath(from: MindNode, to: MindNode): string {
  const f = nc(from), t = nc(to);
  const dx = (t.x - f.x) * 0.5;
  return `M ${f.x} ${f.y} C ${f.x + dx} ${f.y}, ${t.x - dx} ${t.y}, ${t.x} ${t.y}`;
}

export default function MindMapEditor({ value, onChange, readOnly = false }: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean;
}) {
  const [data, _setData] = useState<MindMapData>(() => parseData(value));
  const dataRef = useRef(data);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function setData(next: MindMapData) { dataRef.current = next; _setData(next); }
  function save(next: MindMapData) { setData(next); onChange?.(JSON.stringify(next)); }

  function svgCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = CW / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  }

  function addChild() {
    if (!selected) return;
    const parent = dataRef.current.nodes.find(n => n.id === selected);
    if (!parent) return;
    const side = parent.x > CW / 2 - NW / 2 ? 1 : -1;
    const node: MindNode = {
      id: `n${uid()}`,
      label: 'New Topic',
      parentId: selected,
      x: Math.max(0, Math.min(CW - NW, parent.x + side * 210)),
      y: Math.max(0, Math.min(CH - NH, parent.y + (Math.random() * 100 - 50))),
    };
    const next = { nodes: [...dataRef.current.nodes, node] };
    save(next);
    setSelected(node.id);
    setEditing(node.id);
    setEditVal(node.label);
  }

  function deleteNode(id: string) {
    const toDelete = new Set<string>();
    function collect(nid: string) {
      toDelete.add(nid);
      dataRef.current.nodes.filter(n => n.parentId === nid).forEach(c => collect(c.id));
    }
    collect(id);
    save({ nodes: dataRef.current.nodes.filter(n => !toDelete.has(n.id)) });
    setSelected(null);
  }

  function startEdit(id: string) {
    const node = dataRef.current.nodes.find(n => n.id === id);
    if (!node) return;
    setEditing(id);
    setEditVal(node.label);
  }

  function commitEdit() {
    if (!editing) return;
    save({ nodes: dataRef.current.nodes.map(n => n.id === editing ? { ...n, label: editVal } : n) });
    setEditing(null);
  }

  function handlePointerDown(e: React.PointerEvent, nodeId: string) {
    if (readOnly || editing) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const node = dataRef.current.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging({ id: nodeId, ox: x - node.x, oy: y - node.y });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const nx = Math.max(0, Math.min(CW - NW, x - dragging.ox));
    const ny = Math.max(0, Math.min(CH - NH, y - dragging.oy));
    setData({ nodes: dataRef.current.nodes.map(n => n.id === dragging.id ? { ...n, x: nx, y: ny } : n) });
  }

  function handlePointerUp() {
    if (dragging) { onChange?.(JSON.stringify(dataRef.current)); setDragging(null); }
  }

  const root = data.nodes.find(n => n.parentId === null);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <button type="button" onClick={addChild} disabled={!selected}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition disabled:opacity-40">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Child
          </button>
          {selected && (
            <button type="button" onClick={() => startEdit(selected)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
          )}
          {selected && selected !== root?.id && (
            <button type="button" onClick={() => deleteNode(selected)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{data.nodes.length} nodes</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full bg-white"
        style={{ height: readOnly ? undefined : 460, touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => { if (!editing) setSelected(null); }}
      >
        <defs>
          <pattern id="mm-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect width={CW} height={CH} fill="url(#mm-grid)" />

        {/* Edges */}
        {data.nodes.filter(n => n.parentId !== null).map(node => {
          const parent = data.nodes.find(p => p.id === node.parentId);
          if (!parent) return null;
          const c = getBranchColor(data.nodes, node.id);
          return (
            <path key={`e-${node.id}`}
              d={edgePath(parent, node)}
              fill="none" stroke={c.stroke} strokeWidth={2} opacity={0.65}
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map(node => {
          const c = getBranchColor(data.nodes, node.id);
          const isRoot = node.parentId === null;
          const isSel = node.id === selected;
          const isEditingThis = node.id === editing;

          return (
            <g key={node.id}
              onClick={e => { e.stopPropagation(); if (!editing) setSelected(node.id); }}
              onDoubleClick={e => { e.stopPropagation(); if (!readOnly) startEdit(node.id); }}
              onPointerDown={readOnly ? undefined : e => { e.stopPropagation(); handlePointerDown(e, node.id); }}
              style={{ cursor: readOnly ? 'default' : 'grab', userSelect: 'none' }}
            >
              <rect
                x={node.x} y={node.y} width={NW} height={NH}
                rx={isRoot ? 10 : 7}
                fill={c.fill}
                stroke={isSel ? '#6366f1' : c.stroke}
                strokeWidth={isSel ? 2.5 : isRoot ? 2 : 1.5}
              />
              {isEditingThis && !readOnly ? (
                <foreignObject x={node.x + 4} y={node.y + 7} width={NW - 8} height={NH - 14}>
                  <input
                    autoFocus
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                    style={{
                      width: '100%', fontSize: 12, fontWeight: isRoot ? 700 : 600,
                      border: '1px solid #a5b4fc', borderRadius: 4, padding: '2px 6px',
                      outline: 'none', background: 'white', color: c.text,
                    }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={node.x + NW / 2} y={node.y + NH / 2 + 4}
                  textAnchor="middle" fontSize={isRoot ? 13 : 12}
                  fontWeight={isRoot ? 700 : 600} fill={c.text}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label.length > 15 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!readOnly && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 text-[10px] text-slate-400 flex gap-4">
          <span>Click to select · Double-click to rename · Drag to move</span>
          <span>Select a node then <strong>Add Child</strong> to expand</span>
        </div>
      )}
    </div>
  );
}
