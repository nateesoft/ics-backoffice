'use client';
import { useState, useRef } from 'react';

type AttrType = 'INT' | 'VARCHAR' | 'TEXT' | 'DATETIME' | 'DATE' | 'BOOLEAN' | 'FLOAT' | 'UUID';
type ERAttr   = { id: string; name: string; type: AttrType; isPK: boolean; isFK: boolean; };
type EREntity = { id: string; name: string; x: number; y: number; attrs: ERAttr[]; };
type Cardinality = '1' | 'N' | 'M';
type ERRelation  = { id: string; fromId: string; toId: string; label: string; fromCard: Cardinality; toCard: Cardinality; };
type ERData = { entities: EREntity[]; relations: ERRelation[]; };

const ATTR_TYPES: AttrType[] = ['INT', 'VARCHAR', 'TEXT', 'DATETIME', 'DATE', 'BOOLEAN', 'FLOAT', 'UUID'];
const CARDS: Cardinality[] = ['1', 'N', 'M'];

const ENT_W  = 180;
const HEAD_H = 38;
const ATTR_H = 26;
const CW = 740, CH = 500;

function uid() { return Math.random().toString(36).slice(2, 8); }
function entH(e: EREntity) { return HEAD_H + Math.max(1, e.attrs.length) * ATTR_H + 6; }
function entCx(e: EREntity) { return e.x + ENT_W / 2; }
function entCy(e: EREntity) { return e.y + entH(e) / 2; }

function connPoint(ent: EREntity, tx: number, ty: number) {
  const cx = entCx(ent), cy = entCy(ent);
  return tx >= cx
    ? { x: ent.x + ENT_W, y: cy }
    : { x: ent.x, y: cy };
}

function parseData(v: string): ERData {
  try {
    const d = JSON.parse(v);
    if (Array.isArray(d?.entities) && Array.isArray(d?.relations)) return d;
  } catch {}
  return {
    entities: [
      {
        id: 'e1', name: 'users', x: 60, y: 100,
        attrs: [
          { id: 'a1', name: 'id', type: 'INT', isPK: true, isFK: false },
          { id: 'a2', name: 'username', type: 'VARCHAR', isPK: false, isFK: false },
          { id: 'a3', name: 'email', type: 'VARCHAR', isPK: false, isFK: false },
          { id: 'a4', name: 'created_at', type: 'DATETIME', isPK: false, isFK: false },
        ],
      },
      {
        id: 'e2', name: 'orders', x: 450, y: 100,
        attrs: [
          { id: 'b1', name: 'id', type: 'INT', isPK: true, isFK: false },
          { id: 'b2', name: 'user_id', type: 'INT', isPK: false, isFK: true },
          { id: 'b3', name: 'amount', type: 'FLOAT', isPK: false, isFK: false },
          { id: 'b4', name: 'created_at', type: 'DATETIME', isPK: false, isFK: false },
        ],
      },
    ],
    relations: [
      { id: 'r1', fromId: 'e1', toId: 'e2', label: 'has', fromCard: '1', toCard: 'N' },
    ],
  };
}

// ─── Entity box (SVG) ─────────────────────────────────────────────────────────
function EntityBox({ ent, selected, readOnly, onClick, onPointerDown }: {
  ent: EREntity; selected: boolean; readOnly: boolean;
  onClick: () => void; onPointerDown: (e: React.PointerEvent) => void;
}) {
  const h = entH(ent);
  return (
    <g
      onClick={e => { e.stopPropagation(); onClick(); }}
      onPointerDown={readOnly ? undefined : e => { e.stopPropagation(); onPointerDown(e); }}
      style={{ cursor: readOnly ? 'default' : 'grab', userSelect: 'none' }}
    >
      {/* Shadow */}
      <rect x={ent.x + 2} y={ent.y + 2} width={ENT_W} height={h} rx={8} fill="#00000014" />
      {/* Body */}
      <rect x={ent.x} y={ent.y} width={ENT_W} height={h} rx={8}
        fill="white" stroke={selected ? '#6366f1' : '#cbd5e1'} strokeWidth={selected ? 2 : 1.5} />
      {/* Header bg */}
      <rect x={ent.x} y={ent.y} width={ENT_W} height={HEAD_H} rx={8} fill={selected ? '#eef2ff' : '#f8fafc'} />
      <rect x={ent.x} y={ent.y + HEAD_H - 8} width={ENT_W} height={8} fill={selected ? '#eef2ff' : '#f8fafc'} />
      <line x1={ent.x} y1={ent.y + HEAD_H} x2={ent.x + ENT_W} y2={ent.y + HEAD_H}
        stroke={selected ? '#a5b4fc' : '#e2e8f0'} strokeWidth={1} />
      {/* Entity name */}
      <text x={ent.x + ENT_W / 2} y={ent.y + HEAD_H / 2 + 5}
        textAnchor="middle" fontSize={13} fontWeight={700}
        fill={selected ? '#4338ca' : '#334155'}
        style={{ pointerEvents: 'none' }}>
        {ent.name.length > 18 ? ent.name.slice(0, 16) + '…' : ent.name}
      </text>

      {/* Attributes */}
      {ent.attrs.length === 0 && (
        <text x={ent.x + ENT_W / 2} y={ent.y + HEAD_H + ATTR_H / 2 + 4}
          textAnchor="middle" fontSize={10} fill="#94a3b8" fontStyle="italic"
          style={{ pointerEvents: 'none' }}>
          (no attributes)
        </text>
      )}
      {ent.attrs.map((attr, i) => {
        const ay = ent.y + HEAD_H + i * ATTR_H;
        const isPK = attr.isPK, isFK = attr.isFK;
        return (
          <g key={attr.id}>
            {i > 0 && <line x1={ent.x + 8} y1={ay} x2={ent.x + ENT_W - 8} y2={ay} stroke="#f1f5f9" strokeWidth={1} />}
            {/* PK/FK badge */}
            {isPK && (
              <text x={ent.x + 10} y={ay + ATTR_H / 2 + 4} fontSize={9} fontWeight={700} fill="#f59e0b"
                style={{ pointerEvents: 'none' }}>PK</text>
            )}
            {isFK && !isPK && (
              <text x={ent.x + 10} y={ay + ATTR_H / 2 + 4} fontSize={9} fontWeight={700} fill="#8b5cf6"
                style={{ pointerEvents: 'none' }}>FK</text>
            )}
            {/* Attr name */}
            <text x={ent.x + 30} y={ay + ATTR_H / 2 + 4}
              fontSize={11} fontWeight={isPK ? 600 : 400}
              fill={isPK ? '#1e293b' : '#475569'}
              style={{ pointerEvents: 'none' }}>
              {attr.name.length > 14 ? attr.name.slice(0, 12) + '…' : attr.name}
            </text>
            {/* Type */}
            <text x={ent.x + ENT_W - 8} y={ay + ATTR_H / 2 + 4}
              textAnchor="end" fontSize={10} fill="#94a3b8"
              style={{ pointerEvents: 'none' }}>
              {attr.type}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ERDiagramEditor({ value, onChange, readOnly = false }: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean;
}) {
  const [data, _setData]      = useState<ERData>(() => parseData(value));
  const dataRef               = useRef(data);
  const [selEnt, setSelEnt]   = useState<string | null>(null);
  const [selRel, setSelRel]   = useState<string | null>(null);
  const [connFrom, setConnFrom] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const svgRef                = useRef<SVGSVGElement>(null);

  function setData(next: ERData) { dataRef.current = next; _setData(next); }
  function save(next: ERData)    { setData(next); onChange?.(JSON.stringify(next)); }

  function svgCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = CW / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  }

  function addEntity() {
    const ent: EREntity = {
      id: `e${uid()}`, name: 'new_table',
      x: 60 + Math.floor(Math.random() * 400),
      y: 60 + Math.floor(Math.random() * 300),
      attrs: [{ id: `a${uid()}`, name: 'id', type: 'INT', isPK: true, isFK: false }],
    };
    const next = { ...dataRef.current, entities: [...dataRef.current.entities, ent] };
    save(next);
    setSelEnt(ent.id);
    setSelRel(null);
  }

  function deleteEntity(id: string) {
    save({
      entities: dataRef.current.entities.filter(e => e.id !== id),
      relations: dataRef.current.relations.filter(r => r.fromId !== id && r.toId !== id),
    });
    setSelEnt(null);
  }

  function deleteRelation(id: string) {
    save({ ...dataRef.current, relations: dataRef.current.relations.filter(r => r.id !== id) });
    setSelRel(null);
  }

  function updateEntityName(id: string, name: string) {
    save({ ...dataRef.current, entities: dataRef.current.entities.map(e => e.id === id ? { ...e, name } : e) });
  }

  function addAttr(entId: string) {
    save({
      ...dataRef.current,
      entities: dataRef.current.entities.map(e =>
        e.id === entId
          ? { ...e, attrs: [...e.attrs, { id: `a${uid()}`, name: 'field', type: 'VARCHAR', isPK: false, isFK: false }] }
          : e,
      ),
    });
  }

  function updateAttr(entId: string, attrId: string, patch: Partial<ERAttr>) {
    save({
      ...dataRef.current,
      entities: dataRef.current.entities.map(e =>
        e.id === entId
          ? { ...e, attrs: e.attrs.map(a => a.id === attrId ? { ...a, ...patch } : a) }
          : e,
      ),
    });
  }

  function removeAttr(entId: string, attrId: string) {
    save({
      ...dataRef.current,
      entities: dataRef.current.entities.map(e =>
        e.id === entId ? { ...e, attrs: e.attrs.filter(a => a.id !== attrId) } : e,
      ),
    });
  }

  function updateRelation(id: string, patch: Partial<ERRelation>) {
    save({ ...dataRef.current, relations: dataRef.current.relations.map(r => r.id === id ? { ...r, ...patch } : r) });
  }

  function handleEntityClick(id: string) {
    if (connFrom !== null) {
      if (connFrom !== id) {
        const exists = dataRef.current.relations.some(r => r.fromId === connFrom && r.toId === id);
        if (!exists) {
          save({ ...dataRef.current, relations: [...dataRef.current.relations, { id: `r${uid()}`, fromId: connFrom, toId: id, label: '', fromCard: '1', toCard: 'N' }] });
        }
      }
      setConnFrom(null);
      return;
    }
    setSelEnt(id === selEnt ? null : id);
    setSelRel(null);
  }

  function handlePointerDown(e: React.PointerEvent, entId: string) {
    if (connFrom !== null) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const ent = dataRef.current.entities.find(en => en.id === entId);
    if (!ent) return;
    setDragging({ id: entId, ox: x - ent.x, oy: y - ent.y });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const { x, y } = svgCoords(e.clientX, e.clientY);
    const nx = Math.max(0, Math.min(CW - ENT_W, x - dragging.ox));
    const ny = Math.max(0, Math.min(CH - 60, y - dragging.oy));
    setData({ ...dataRef.current, entities: dataRef.current.entities.map(e => e.id === dragging.id ? { ...e, x: nx, y: ny } : e) });
  }

  function handlePointerUp() {
    if (dragging) { onChange?.(JSON.stringify(dataRef.current)); setDragging(null); }
  }

  const selectedEnt = data.entities.find(e => e.id === selEnt);
  const selectedRel = data.relations.find(r => r.id === selRel);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <button type="button" onClick={addEntity}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entity
          </button>

          <button type="button"
            onClick={() => setConnFrom(connFrom ? null : (selEnt ?? 'pick'))}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition
              ${connFrom ? 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-pulse' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {connFrom ? (connFrom === 'pick' ? 'Click source…' : 'Click target…') : 'Relate'}
          </button>

          {selEnt && (
            <button type="button" onClick={() => deleteEntity(selEnt)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Entity
            </button>
          )}

          {selRel && (
            <button type="button" onClick={() => deleteRelation(selRel)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete Relation
            </button>
          )}
        </div>
      )}

      {/* Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full bg-white"
        style={{ height: readOnly ? undefined : 500, touchAction: 'none', cursor: connFrom ? 'crosshair' : 'default' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => { setSelEnt(null); setSelRel(null); setConnFrom(null); }}
      >
        <defs>
          <pattern id="er-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
          </pattern>
          <marker id="er-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker id="er-arrow-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
          </marker>
        </defs>
        <rect width={CW} height={CH} fill="url(#er-grid)" />

        {/* Relations */}
        {data.relations.map(rel => {
          const fromEnt = data.entities.find(e => e.id === rel.fromId);
          const toEnt   = data.entities.find(e => e.id === rel.toId);
          if (!fromEnt || !toEnt) return null;
          const toCx = entCx(toEnt), toCy = entCy(toEnt);
          const fromCx = entCx(fromEnt), fromCy = entCy(fromEnt);
          const fp = connPoint(fromEnt, toCx, toCy);
          const tp = connPoint(toEnt, fromCx, fromCy);
          const mx = (fp.x + tp.x) / 2;
          const my = (fp.y + tp.y) / 2;
          const isSelRel = rel.id === selRel;
          const stroke = isSelRel ? '#6366f1' : '#94a3b8';
          const marker = isSelRel ? 'url(#er-arrow-sel)' : 'url(#er-arrow)';

          return (
            <g key={rel.id}>
              {/* Invisible wide hit area */}
              <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                stroke="transparent" strokeWidth={14}
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setSelRel(rel.id === selRel ? null : rel.id); setSelEnt(null); }}
              />
              <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                stroke={stroke} strokeWidth={isSelRel ? 2 : 1.5}
                markerEnd={marker}
              />
              {/* From cardinality */}
              <text x={fp.x + (tp.x > fp.x ? 10 : -10)} y={fp.y - 5}
                textAnchor="middle" fontSize={11} fontWeight={700} fill={stroke}
                style={{ pointerEvents: 'none' }}>
                {rel.fromCard}
              </text>
              {/* To cardinality */}
              <text x={tp.x + (fp.x > tp.x ? 10 : -10)} y={tp.y - 5}
                textAnchor="middle" fontSize={11} fontWeight={700} fill={stroke}
                style={{ pointerEvents: 'none' }}>
                {rel.toCard}
              </text>
              {/* Relation label */}
              {rel.label && (
                <text x={mx} y={my - 6}
                  textAnchor="middle" fontSize={10} fill="#64748b"
                  style={{ pointerEvents: 'none' }}>
                  {rel.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Entities */}
        {data.entities.map(ent => (
          <EntityBox key={ent.id} ent={ent}
            selected={ent.id === selEnt}
            readOnly={readOnly}
            onClick={() => {
              if (connFrom === 'pick') { setConnFrom(ent.id); return; }
              handleEntityClick(ent.id);
            }}
            onPointerDown={e => handlePointerDown(e, ent.id)}
          />
        ))}
      </svg>

      {/* Entity editor panel */}
      {!readOnly && selectedEnt && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Entity</span>
            <input
              value={selectedEnt.name}
              onChange={e => updateEntityName(selectedEnt.id, e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white font-mono"
              placeholder="table_name"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attributes</span>
              <button type="button" onClick={() => addAttr(selectedEnt.id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {selectedEnt.attrs.map(attr => (
              <div key={attr.id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-2.5 py-1.5">
                <input
                  value={attr.name}
                  onChange={e => updateAttr(selectedEnt.id, attr.id, { name: e.target.value })}
                  className="flex-1 text-xs font-mono border-none outline-none bg-transparent text-slate-700 min-w-0"
                  placeholder="column_name"
                />
                <select
                  value={attr.type}
                  onChange={e => updateAttr(selectedEnt.id, attr.id, { type: e.target.value as AttrType })}
                  className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  {ATTR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => updateAttr(selectedEnt.id, attr.id, { isPK: !attr.isPK, isFK: false })}
                  title="Primary Key"
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${attr.isPK ? 'bg-amber-100 text-amber-700' : 'text-slate-300 hover:text-amber-500'}`}
                >PK</button>
                <button
                  type="button"
                  onClick={() => updateAttr(selectedEnt.id, attr.id, { isFK: !attr.isFK, isPK: false })}
                  title="Foreign Key"
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${attr.isFK ? 'bg-violet-100 text-violet-700' : 'text-slate-300 hover:text-violet-500'}`}
                >FK</button>
                <button type="button" onClick={() => removeAttr(selectedEnt.id, attr.id)}
                  className="text-slate-300 hover:text-red-400 transition ml-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relation editor panel */}
      {!readOnly && selectedRel && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Relation</span>
            <input
              value={selectedRel.label}
              onChange={e => updateRelation(selectedRel.id, { label: e.target.value })}
              className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="label (optional)"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">From</span>
              <select value={selectedRel.fromCard}
                onChange={e => updateRelation(selectedRel.id, { fromCard: e.target.value as Cardinality })}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
                {CARDS.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className="text-xs text-slate-400">To</span>
              <select value={selectedRel.toCard}
                onChange={e => updateRelation(selectedRel.id, { toCard: e.target.value as Cardinality })}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
                {CARDS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 text-[10px] text-slate-400 flex gap-4">
          <span>Click entity to select · Drag to move</span>
          <span>Click <strong>Relate</strong> then click source → target to add relation</span>
          <span>Click line to select relation</span>
        </div>
      )}
    </div>
  );
}
