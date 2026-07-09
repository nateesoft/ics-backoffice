'use client';
import { useCallback, useEffect, useRef, useState, DragEvent } from 'react';
import Link from 'next/link';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, MarkerType, useReactFlow,
  Connection, Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowUiItem } from '@/types/flowUi';
import { FlowApiItem } from '@/types/flowApi';
import { flowUiStore } from '@/lib/flowUiStore';
import { flowApiStore } from '@/lib/flowApiStore';
import { flowCanvasStore } from '@/lib/flowCanvasStore';
import { METHOD_COLORS } from './methodBadge';
import { UiFlowNode, ApiFlowNode, ConditionFlowNode, UiNodeData, ApiNodeData, ConditionNodeData } from './FlowCanvasNodes';
import { LabeledEdge, LabeledEdgeData, LabeledEdgeType } from './FlowCanvasEdges';

const nodeTypes = { ui: UiFlowNode, api: ApiFlowNode, condition: ConditionFlowNode };
const edgeTypes = { labeled: LabeledEdge };

type FlowNodeRefType = 'ui' | 'api' | 'condition';

const EDGE_COLORS: Record<string, string> = { true: '#16a34a', false: '#dc2626' };
const DEFAULT_EDGE_COLOR = '#6366f1';

function edgeAppearance(sourceHandle?: string | null) {
  const color = (sourceHandle && EDGE_COLORS[sourceHandle]) || DEFAULT_EDGE_COLOR;
  return {
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

const defaultEdgeOptions = { type: 'labeled' as const };

type CanvasNode = Node<UiNodeData, 'ui'> | Node<ApiNodeData, 'api'> | Node<ConditionNodeData, 'condition'>;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

interface FlowCanvasEditorProps {
  projectId: string;
}

function PaletteItem({
  label, sublabel, badge, badgeClass, onDragStart,
}: {
  label: string;
  sublabel?: string | null;
  badge: string;
  badgeClass: string;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white px-2.5 py-2 hover:border-indigo-300 hover:shadow-sm transition"
      title="ลากไปวางบน flow canvas"
    >
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}>{badge}</span>
      <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{label}</p>
      {sublabel && <p className="text-[10px] font-mono text-slate-400 truncate">{sublabel}</p>}
    </div>
  );
}

function FlowCanvasInner({ projectId }: FlowCanvasEditorProps) {
  const [uis, setUis] = useState<FlowUiItem[]>([]);
  const [apis, setApis] = useState<FlowApiItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LabeledEdgeType>([]);
  const { screenToFlowPosition } = useReactFlow();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleLabelChange = useCallback((nodeId: string, label: string) => {
    setNodes(nds => nds.map(n => (n.id === nodeId && n.type === 'condition' ? { ...n, data: { ...n.data, label } } : n)));
  }, [setNodes]);

  const handleEdgeLabelChange = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => (e.id === edgeId ? { ...e, data: { ...(e.data as LabeledEdgeData), label } } : e)));
  }, [setEdges]);

  useEffect(() => {
    const allUis = flowUiStore.getByProjectId(projectId);
    const allApis = flowApiStore.getByProjectId(projectId);
    setUis(allUis.filter(u => u.uiType === 'Page'));
    setApis(allApis);

    const uisById = new Map(allUis.map(u => [u.id, u]));
    const apisById = new Map(allApis.map(a => [a.id, a]));
    const saved = flowCanvasStore.getByProjectId(projectId);

    const restoredNodes: CanvasNode[] = [];
    for (const n of saved.nodes) {
      if (n.refType === 'ui') {
        const item = n.refId ? uisById.get(n.refId) : undefined;
        if (!item) continue;
        restoredNodes.push({ id: n.id, type: 'ui', position: n.position, data: { item, onRemove: handleRemoveNode } });
      } else if (n.refType === 'api') {
        const item = n.refId ? apisById.get(n.refId) : undefined;
        if (!item) continue;
        restoredNodes.push({ id: n.id, type: 'api', position: n.position, data: { item, onRemove: handleRemoveNode } });
      } else {
        restoredNodes.push({
          id: n.id, type: 'condition', position: n.position,
          data: { label: n.label ?? '', onRemove: handleRemoveNode, onLabelChange: handleLabelChange },
        });
      }
    }
    const nodeIds = new Set(restoredNodes.map(n => n.id));
    const restoredEdges: LabeledEdgeType[] = saved.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: e.sourceHandle ?? undefined, targetHandle: e.targetHandle ?? undefined,
        type: 'labeled',
        ...edgeAppearance(e.sourceHandle),
        data: { label: e.label ?? '', onLabelChange: handleEdgeLabelChange },
      }));

    setNodes(restoredNodes);
    setEdges(restoredEdges);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, handleRemoveNode, handleLabelChange, handleEdgeLabelChange]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flowCanvasStore.save(projectId, {
        nodes: nodes.map(n => ({
          id: n.id,
          refType: n.type as FlowNodeRefType,
          refId: n.type === 'condition' ? null : n.data.item.id,
          position: n.position,
          label: n.type === 'condition' ? n.data.label : undefined,
        })),
        edges: edges.map(e => ({
          id: e.id, source: e.source, target: e.target,
          sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
          label: e.data?.label,
        })),
      });
    }, 250);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [nodes, edges, loaded, projectId]);

  const isValidConnection = useCallback((conn: LabeledEdgeType | Connection) => {
    if (conn.source === conn.target) return false;
    const sourceHandle = conn.sourceHandle ?? null;
    const targetHandle = conn.targetHandle ?? null;
    return !edges.some(e =>
      e.source === conn.source && e.target === conn.target &&
      (e.sourceHandle ?? null) === sourceHandle && (e.targetHandle ?? null) === targetHandle,
    );
  }, [edges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection,
      id: genId(),
      type: 'labeled',
      ...edgeAppearance(connection.sourceHandle),
      data: { label: '', onLabelChange: handleEdgeLabelChange },
    }, eds));
  }, [setEdges, handleEdgeLabelChange]);

  const addNodeFromDrag = useCallback((refType: FlowNodeRefType, refId: string, clientX: number, clientY: number) => {
    const position = screenToFlowPosition({ x: clientX, y: clientY });
    if (refType === 'ui') {
      const item = uis.find(u => u.id === refId) ?? flowUiStore.getById(refId);
      if (!item) return;
      const node: CanvasNode = { id: `ui-${genId()}`, type: 'ui', position, data: { item, onRemove: handleRemoveNode } };
      setNodes(nds => nds.concat(node));
    } else if (refType === 'api') {
      const item = apis.find(a => a.id === refId) ?? flowApiStore.getById(refId);
      if (!item) return;
      const node: CanvasNode = { id: `api-${genId()}`, type: 'api', position, data: { item, onRemove: handleRemoveNode } };
      setNodes(nds => nds.concat(node));
    } else {
      const node: CanvasNode = {
        id: `condition-${genId()}`, type: 'condition', position,
        data: { label: '', onRemove: handleRemoveNode, onLabelChange: handleLabelChange },
      };
      setNodes(nds => nds.concat(node));
    }
  }, [uis, apis, screenToFlowPosition, setNodes, handleRemoveNode, handleLabelChange]);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/flow-node');
    if (!raw) return;
    try {
      const { refType, refId } = JSON.parse(raw) as { refType: FlowNodeRefType; refId: string };
      addNodeFromDrag(refType, refId, e.clientX, e.clientY);
    } catch {
      // ignore malformed drag payload
    }
  }, [addNodeFromDrag]);

  function makePaletteDragStart(refType: FlowNodeRefType, refId: string) {
    return (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/flow-node', JSON.stringify({ refType, refId }));
      e.dataTransfer.effectAllowed = 'move';
    };
  }

  return (
    <div className="flex gap-3 h-[calc(100vh-260px)] min-h-[520px]">
      <div className="relative w-[85%] rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="!bg-white"
            nodeColor={n => (n.type === 'api' ? '#6366f1' : n.type === 'condition' ? '#f59e0b' : '#14b8a6')}
          />
        </ReactFlow>
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400 bg-white/80 px-4 py-2 rounded-lg border border-slate-100">
              ลาก Page, API หรือ Condition จากด้านขวามาวางที่นี่เพื่อเริ่มสร้าง flow
            </p>
          </div>
        )}
      </div>

      <div className="w-[15%] min-w-[190px] flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Logic</h3>
          <PaletteItem
            label="Condition"
            sublabel="แตกเงื่อนไข True / False"
            badge="IF"
            badgeClass="bg-amber-50 text-amber-600"
            onDragStart={makePaletteDragStart('condition', 'condition')}
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pages</h3>
            <Link href="/flow-generate/uis" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">+ New</Link>
          </div>
          {uis.length === 0 ? (
            <p className="text-[11px] text-slate-400">ยังไม่มี Page</p>
          ) : (
            <div className="space-y-2">
              {uis.map(u => (
                <PaletteItem
                  key={u.id}
                  label={u.name}
                  sublabel={u.uiPath}
                  badge={u.pageKind ?? 'Page'}
                  badgeClass="bg-teal-50 text-teal-600"
                  onDragStart={makePaletteDragStart('ui', u.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Node (APIs)</h3>
            <Link href="/flow-generate/apis" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">+ New</Link>
          </div>
          {apis.length === 0 ? (
            <p className="text-[11px] text-slate-400">ยังไม่มี API</p>
          ) : (
            <div className="space-y-2">
              {apis.map(a => (
                <PaletteItem
                  key={a.id}
                  label={a.name}
                  sublabel={a.path}
                  badge={a.method}
                  badgeClass={METHOD_COLORS[a.method]}
                  onDragStart={makePaletteDragStart('api', a.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlowCanvasEditor({ projectId }: FlowCanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner projectId={projectId} />
    </ReactFlowProvider>
  );
}
