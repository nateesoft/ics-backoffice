'use client';
import { useState, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type NodeType = 'start' | 'end' | 'process' | 'decision';

interface FlowNode { id: string; x: number; y: number; label: string; type: NodeType; }
interface FlowEdge { id: string; from: string; to: string; label?: string; }
interface FlowchartData { nodes: FlowNode[]; edges: FlowEdge[]; }

function uid() { return Math.random().toString(36).slice(2, 8); }

const NW = 140;
const NH = 46;
const CW = 620;
const CH = 460;

const NODE_STYLE: Record<NodeType, { fill: string; stroke: string; text: string; label: string }> = {
  start:    { fill: '#d1fae5', stroke: '#34d399', text: '#065f46', label: 'Start'    },
  end:      { fill: '#fee2e2', stroke: '#f87171', text: '#7f1d1d', label: 'End'      },
  process:  { fill: '#eff6ff', stroke: '#60a5fa', text: '#1e3a8a', label: 'Process'  },
  decision: { fill: '#fef9c3', stroke: '#facc15', text: '#713f12', label: 'Decision' },
};

function parseData(v: string): FlowchartData {
  try {
    const d = JSON.parse(v);
    if (Array.isArray(d?.nodes) && Array.isArray(d?.edges)) return d;
  } catch {}
  return {
    nodes: [
      { id: 'n1', x: 240, y: 30,  label: 'Start',   type: 'start'    },
      { id: 'n2', x: 240, y: 145, label: 'Process',  type: 'process'  },
      { id: 'n3', x: 240, y: 260, label: 'Decision', type: 'decision' },
      { id: 'n4', x: 100, y: 360, label: 'End',      type: 'end'      },
      { id: 'n5', x: 380, y: 360, label: 'End',      type: 'end'      },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'Yes' },
      { id: 'e4', from: 'n3', to: 'n5', label: 'No'  },
    ],
  };
}

// Center of a node
function nc(node: FlowNode) { return { x: node.x + NW / 2, y: node.y + NH / 2 }; }

// Clamp edge endpoint to node border (rectangle approximation)
function clipToBorder(from: { x: number; y: number }, to: { x: number; y: number }, nw: number, nh: number): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hw = nw / 2 + 1, hh = nh / 2 + 1;
  const tx = ux !== 0 ? hw / Math.abs(ux) : Infinity;
  const ty = uy !== 0 ? hh / Math.abs(uy) : Infinity;
  const t  = Math.min(tx, ty);
  return { x: from.x + ux * t, y: from.y + uy * t };
}

// ─── Node Shape (SVG) ─────────────────────────────────────────────────────────
function NodeShape({ node, selected, connecting, onClick, onPointerDown, readOnly }: {
  node: FlowNode; selected: boolean; connecting: boolean;
  onClick: () => void; onPointerDown: (e: React.PointerEvent) => void; readOnly: boolean;
}) {
  const s  = NODE_STYLE[node.type];
  const cx = node.x + NW / 2;
  const cy = node.y + NH / 2;

  const ring = selected ? '#6366f1' : connecting ? '#10b981' : s.stroke;
  const sw   = selected || connecting ? 2.5 : 1.5;

  let shape: React.ReactNode;
  if (node.type === 'start' || node.type === 'end') {
    shape = <rect x={node.x} y={node.y} width={NW} height={NH} rx={NH / 2} fill={s.fill} stroke={ring} strokeWidth={sw} />;
  } else if (node.type === 'decision') {
    const hw = NW / 2 + 14, hh = NH / 2 + 8;
    shape = (
      <polygon
        points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
        fill={s.fill} stroke={ring} strokeWidth={sw}
      />
    );
  } else {
    shape = <rect x={node.x} y={node.y} width={NW} height={NH} rx={8} fill={s.fill} stroke={ring} strokeWidth={sw} />;
  }

  return (
    <g
      onClick={e => { e.stopPropagation(); onClick(); }}
      onPointerDown={readOnly ? undefined : e => { e.stopPropagation(); onPointerDown(e); }}
      style={{ cursor: readOnly ? 'default' : 'grab', userSelect: 'none' }}
    >
      {shape}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fontWeight={600} fill={s.text}
        style={{ pointerEvents: 'none' }}>
        {node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label}
      </text>
    </g>
  );
}

// ─── Edge label inline edit ───────────────────────────────────────────────────
function EdgeLabel({ edge, mx, my, onUpdate, readOnly }: {
  edge: FlowEdge; mx: number; my: number;
  onUpdate: (id: string, label: string) => void; readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(edge.label ?? '');

  if (readOnly) {
    return edge.label ? (
      <text x={mx} y={my - 6} textAnchor="middle" fontSize={10} fill="#64748b">{edge.label}</text>
    ) : null;
  }

  if (editing) {
    return (
      <foreignObject x={mx - 36} y={my - 18} width={72} height={22}>
        <input
          autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { setEditing(false); onUpdate(edge.id, val); }}
          onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onUpdate(edge.id, val); } }}
          style={{ width: '100%', fontSize: 10, border: '1px solid #a5b4fc', borderRadius: 4, padding: '1px 4px', outline: 'none' }}
        />
      </foreignObject>
    );
  }

  return (
    <text x={mx} y={my - 6} textAnchor="middle" fontSize={10} fill="#64748b"
      style={{ cursor: 'text' }} onClick={e => { e.stopPropagation(); setEditing(true); }}>
      {val || '+ label'}
    </text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FlowchartEditor({
  value, onChange, readOnly = false,
}: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean;
}) {
  const [data, _setData]        = useState<FlowchartData>(() => parseData(value));
  const dataRef                  = useRef(data);
  const [selected, setSelected]  = useState<string | null>(null);
  const [connFrom, setConnFrom]  = useState<string | null>(null);
  const [dragging, setDragging]  = useState<{ id: string; ox: number; oy: number } | null>(null);
  const svgRef                   = useRef<SVGSVGElement>(null);

  function setData(next: FlowchartData) {
    dataRef.current = next;
    _setData(next);
  }

  function save(next: FlowchartData) { setData(next); onChange?.(JSON.stringify(next)); }

  function addNode(type: NodeType) {
    const node: FlowNode = {
      id: `n${uid()}`, type,
      x: 60  + Math.floor(Math.random() * 380),
      y: 60  + Math.floor(Math.random() * 300),
      label: NODE_STYLE[type].label,
    };
    save({ ...dataRef.current, nodes: [...dataRef.current.nodes, node] });
    setSelected(node.id);
    setConnFrom(null);
  }

  function deleteSelected() {
    if (!selected) return;
    save({ nodes: dataRef.current.nodes.filter(n => n.id !== selected), edges: dataRef.current.edges.filter(e => e.from !== selected && e.to !== selected) });
    setSelected(null);
  }

  function deleteEdge(id: string) {
    save({ ...dataRef.current, edges: dataRef.current.edges.filter(e => e.id !== id) });
  }

  function handleNodeClick(nodeId: string) {
    if (connFrom !== null) {
      if (connFrom !== nodeId) {
        const exists = dataRef.current.edges.some(e => e.from === connFrom && e.to === nodeId);
        if (!exists) save({ ...dataRef.current, edges: [...dataRef.current.edges, { id: `e${uid()}`, from: connFrom, to: nodeId }] });
      }
      setConnFrom(null);
      return;
    }
    setSelected(nodeId === selected ? null : nodeId);
  }

  function svgCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect  = svg.getBoundingClientRect();
    const scale = CW / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  }

  function handlePointerDown(e: React.PointerEvent, nodeId: string) {
    if (connFrom !== null) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const node = dataRef.current.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging({ id: nodeId, ox: x - node.x, oy: y - node.y });
    setSelected(nodeId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const nx = Math.max(0, Math.min(CW - NW, x - dragging.ox));
    const ny = Math.max(0, Math.min(CH - NH, y - dragging.oy));
    const next = { ...dataRef.current, nodes: dataRef.current.nodes.map(n => n.id === dragging.id ? { ...n, x: nx, y: ny } : n) };
    setData(next);
  }

  function handlePointerUp() {
    if (dragging) { onChange?.(JSON.stringify(dataRef.current)); setDragging(null); }
  }

  function updateLabel(id: string, label: string) {
    const node = dataRef.current.nodes.find(n => n.id === id);
    if (node) save({ ...dataRef.current, nodes: dataRef.current.nodes.map(n => n.id === id ? { ...n, label } : n) });
  }

  function updateEdgeLabel(id: string, label: string) {
    save({ ...dataRef.current, edges: dataRef.current.edges.map(e => e.id === id ? { ...e, label } : e) });
  }

  function changeType(id: string, type: NodeType) {
    save({ ...dataRef.current, nodes: dataRef.current.nodes.map(n => n.id === id ? { ...n, type } : n) });
  }

  const selNode = data.nodes.find(n => n.id === selected);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-0.5">Add</span>
          {(Object.keys(NODE_STYLE) as NodeType[]).map(type => {
            const s = NODE_STYLE[type];
            return (
              <button key={type} type="button" onClick={() => addNode(type)}
                className="px-2.5 py-1 text-xs font-semibold rounded-full border transition hover:opacity-80 active:scale-95"
                style={{ backgroundColor: s.fill, borderColor: s.stroke, color: s.text }}>
                + {s.label}
              </button>
            );
          })}

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Connect mode */}
          <button type="button"
            onClick={() => setConnFrom(connFrom ? null : (selected ?? 'pick'))}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition
              ${connFrom ? 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-pulse' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {connFrom ? (connFrom === 'pick' ? 'Click source…' : 'Click target…') : 'Connect'}
          </button>

          {selected && (
            <button type="button" onClick={deleteSelected}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete node
            </button>
          )}
        </div>
      )}

      {/* Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full bg-white"
        style={{ height: readOnly ? undefined : 460, cursor: connFrom ? 'crosshair' : 'default', touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => { setSelected(null); setConnFrom(null); }}
      >
        {/* Dot grid */}
        <defs>
          <pattern id="fc-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
          </pattern>
          <marker id="fc-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker id="fc-arrow-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
          </marker>
        </defs>
        <rect width={CW} height={CH} fill="url(#fc-grid)" />

        {/* Edges */}
        {data.edges.map(edge => {
          const fn = data.nodes.find(n => n.id === edge.from);
          const tn = data.nodes.find(n => n.id === edge.to);
          if (!fn || !tn) return null;

          const fc = nc(fn), tc = nc(tn);
          const start = clipToBorder(fc, tc, NW, NH);
          const end   = clipToBorder(tc, fc, NW, NH);
          const mx    = (start.x + end.x) / 2;
          const my    = (start.y + end.y) / 2 - 12;

          return (
            <g key={edge.id}>
              <path
                d={`M ${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`}
                fill="none" stroke="#94a3b8" strokeWidth={1.5}
                markerEnd="url(#fc-arrow)"
              />
              <EdgeLabel edge={edge} mx={(start.x + end.x) / 2} my={(start.y + end.y) / 2 - 8}
                onUpdate={updateEdgeLabel} readOnly={readOnly} />
              {!readOnly && (
                <path
                  d={`M ${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`}
                  fill="none" stroke="transparent" strokeWidth={12}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); if (confirm('Delete this connection?')) deleteEdge(edge.id); }}
                />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {data.nodes.map(node => (
          <NodeShape key={node.id} node={node}
            selected={node.id === selected}
            connecting={connFrom !== null && connFrom !== 'pick' && connFrom !== node.id}
            readOnly={readOnly}
            onClick={() => {
              if (connFrom === 'pick') { setConnFrom(node.id); return; }
              handleNodeClick(node.id);
            }}
            onPointerDown={e => handlePointerDown(e, node.id)}
          />
        ))}
      </svg>

      {/* Node editor panel */}
      {!readOnly && selNode && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Selected node</span>
          <input
            value={selNode.label}
            onChange={e => updateLabel(selNode.id, e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            placeholder="Label"
          />
          <select
            value={selNode.type}
            onChange={e => changeType(selNode.id, e.target.value as NodeType)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {(Object.keys(NODE_STYLE) as NodeType[]).map(t => (
              <option key={t} value={t}>{NODE_STYLE[t].label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">({Math.round(selNode.x)}, {Math.round(selNode.y)})</span>
        </div>
      )}

      {!readOnly && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 text-[10px] text-slate-400 flex gap-4">
          <span>Drag nodes to move</span>
          <span>Click <strong>Connect</strong> then click source → target to add arrow</span>
          <span>Click arrow to delete</span>
          <span>Click edge label to edit</span>
        </div>
      )}
    </div>
  );
}
