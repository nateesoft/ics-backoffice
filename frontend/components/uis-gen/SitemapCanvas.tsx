'use client';
import { useCallback, useEffect, useRef, useState, DragEvent } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls,
  useNodesState, useEdgesState, addEdge, MarkerType, useReactFlow,
  Connection, Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  UisGenNodeType, UisGenSitemapNode, UisGenSitemapEdge,
  UisGenActorNodeData, UisGenPageNodeData, UisGenContentNodeData, UisGenModalNodeData, UisGenAlertNodeData,
  UisGenConditionNodeData,
  DEFAULT_UISGEN_SCHEMA, DEFAULT_UISGEN_UI_SCHEMA, DEFAULT_UISGEN_DATA,
} from '@/types/uisGen';
import { uisGenSitemapStore } from '@/lib/uisGenSitemapStore';
import {
  ActorFlowNode, PageFlowNode, ContentFlowNode, ModalFlowNode, AlertFlowNode, ConditionFlowNode,
  ActorNodeData, PageNodeData, ContentNodeData, ModalNodeData, AlertNodeData, ConditionNodeData,
} from './SitemapNodes';
import { LabeledEdge, LabeledEdgeData, LabeledEdgeType } from '@/components/flow-generate/FlowCanvasEdges';
import NodeInspector from './NodeInspector';

const nodeTypes = {
  actor: ActorFlowNode, page: PageFlowNode, content: ContentFlowNode, modal: ModalFlowNode, alert: AlertFlowNode,
  condition: ConditionFlowNode,
};
const edgeTypes = { labeled: LabeledEdge };
const defaultEdgeOptions = { type: 'labeled' as const };
const DEFAULT_EDGE_COLOR = '#6366f1';

function edgeAppearance() {
  return {
    style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE_COLOR },
  };
}

export type CanvasNode =
  | Node<ActorNodeData, 'actor'>
  | Node<PageNodeData, 'page'>
  | Node<ContentNodeData, 'content'>
  | Node<ModalNodeData, 'modal'>
  | Node<AlertNodeData, 'alert'>
  | Node<ConditionNodeData, 'condition'>;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function defaultDataFor(type: UisGenNodeType, onRemove: (id: string) => void): CanvasNode['data'] {
  if (type === 'actor') {
    const d: UisGenActorNodeData = { name: '', color: '#8b5cf6' };
    return { ...d, onRemove };
  }
  if (type === 'page') {
    const d: UisGenPageNodeData = { name: '', routePath: '/', schema: DEFAULT_UISGEN_SCHEMA, uiSchema: DEFAULT_UISGEN_UI_SCHEMA, data: DEFAULT_UISGEN_DATA };
    return { ...d, onRemove };
  }
  if (type === 'content') {
    const d: UisGenContentNodeData = { name: '', routePath: '/', schema: DEFAULT_UISGEN_SCHEMA, uiSchema: DEFAULT_UISGEN_UI_SCHEMA, data: DEFAULT_UISGEN_DATA };
    return { ...d, onRemove };
  }
  if (type === 'modal') {
    const d: UisGenModalNodeData = { name: '', modalPosition: 'center', schema: DEFAULT_UISGEN_SCHEMA, uiSchema: DEFAULT_UISGEN_UI_SCHEMA, data: DEFAULT_UISGEN_DATA };
    return { ...d, onRemove };
  }
  if (type === 'condition') {
    const d: UisGenConditionNodeData = { name: '', label: '' };
    return { ...d, onRemove };
  }
  const d: UisGenAlertNodeData = { name: '', alertType: 'info', title: '', message: '' };
  return { ...d, onRemove };
}

const PALETTE_ITEMS: { type: UisGenNodeType; label: string; badge: string; badgeClass: string }[] = [
  { type: 'actor', label: 'Actor', badge: 'Actor', badgeClass: 'bg-violet-50 text-violet-600' },
  { type: 'page', label: 'Page', badge: 'Page', badgeClass: 'bg-teal-50 text-teal-600' },
  { type: 'content', label: 'Content Page', badge: 'Content', badgeClass: 'bg-indigo-50 text-indigo-600' },
  { type: 'modal', label: 'Modal', badge: 'Modal', badgeClass: 'bg-amber-50 text-amber-700' },
  { type: 'alert', label: 'Alert', badge: 'Alert', badgeClass: 'bg-rose-50 text-rose-600' },
  { type: 'condition', label: 'Condition', badge: 'Condition', badgeClass: 'bg-amber-100 text-amber-700' },
];

function PaletteItem({ type, label, badge, badgeClass, onDragStart }: {
  type: UisGenNodeType; label: string; badge: string; badgeClass: string; onDragStart: (e: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white px-2.5 py-2 hover:border-indigo-300 hover:shadow-sm transition"
      title="ลากไปวางบน sitemap canvas"
    >
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}>{badge}</span>
      <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
    </div>
  );
}

interface SitemapCanvasProps {
  projectId: string;
}

function SitemapCanvasInner({ projectId }: SitemapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LabeledEdgeType>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(prev => (prev === nodeId ? null : prev));
  }, [setNodes, setEdges]);

  const handleEdgeLabelChange = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => (e.id === edgeId ? { ...e, data: { ...(e.data as LabeledEdgeData), label } } : e)));
  }, [setEdges]);

  useEffect(() => {
    const saved = uisGenSitemapStore.getByProjectId(projectId);
    const restoredNodes: CanvasNode[] = saved.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { ...(n.data as object), onRemove: handleRemoveNode } as CanvasNode['data'],
    }) as CanvasNode);
    const nodeIds = new Set(restoredNodes.map(n => n.id));
    const restoredEdges: LabeledEdgeType[] = saved.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: e.sourceHandle ?? undefined, targetHandle: e.targetHandle ?? undefined,
        type: 'labeled',
        ...edgeAppearance(),
        data: { label: e.label ?? '', onLabelChange: handleEdgeLabelChange },
      }));
    setNodes(restoredNodes);
    setEdges(restoredEdges);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, handleRemoveNode, handleEdgeLabelChange]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const storedNodes: UisGenSitemapNode[] = nodes.map(n => {
        const { onRemove: _onRemove, ...rest } = n.data as Record<string, unknown> & { onRemove: unknown };
        return { id: n.id, type: n.type as UisGenNodeType, position: n.position, data: rest as unknown as UisGenSitemapNode['data'] };
      });
      const storedEdges: UisGenSitemapEdge[] = edges.map(e => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
        label: e.data?.label,
      }));
      uisGenSitemapStore.save(projectId, { nodes: storedNodes, edges: storedEdges });
    }, 250);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [nodes, edges, loaded, projectId]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source === connection.target) return;
    setEdges(eds => {
      const exists = eds.some(e =>
        e.source === connection.source && e.target === connection.target &&
        (e.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
        (e.targetHandle ?? null) === (connection.targetHandle ?? null)
      );
      if (exists) return eds;
      return addEdge({
        ...connection, id: genId(), type: 'labeled', ...edgeAppearance(),
        data: { label: '', onLabelChange: handleEdgeLabelChange },
      }, eds);
    });
  }, [setEdges, handleEdgeLabelChange]);

  const addNode = useCallback((type: UisGenNodeType, clientX: number, clientY: number) => {
    const position = screenToFlowPosition({ x: clientX, y: clientY });
    const id = `${type}-${genId()}`;
    const node = { id, type, position, data: defaultDataFor(type, handleRemoveNode) } as CanvasNode;
    setNodes(nds => nds.concat(node));
    setSelectedNodeId(id);
  }, [screenToFlowPosition, setNodes, handleRemoveNode]);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/uisgen-node') as UisGenNodeType;
    if (!type) return;
    addNode(type, e.clientX, e.clientY);
  }, [addNode]);

  function updateSelectedNode(updater: (data: CanvasNode['data']) => void) {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const { onRemove: _onRemove, ...rest } = n.data as Record<string, unknown> & { onRemove: unknown };
      const clone = structuredClone(rest);
      updater(clone as unknown as CanvasNode['data']);
      return { ...n, data: { ...clone, onRemove: handleRemoveNode } } as CanvasNode;
    }));
  }

  function toggleActorEdge(actorNodeId: string, granted: boolean) {
    if (!selectedNodeId) return;
    if (granted) {
      setEdges(eds => {
        if (eds.some(e => e.source === actorNodeId && e.target === selectedNodeId)) return eds;
        return eds.concat({
          id: genId(), source: actorNodeId, target: selectedNodeId,
          sourceHandle: 'out1', targetHandle: 'in1',
          type: 'labeled', ...edgeAppearance(),
          data: { label: '', onLabelChange: handleEdgeLabelChange },
        });
      });
    } else {
      setEdges(eds => eds.filter(e => !(e.source === actorNodeId && e.target === selectedNodeId)));
    }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[520px]">
      <div className="w-44 flex-shrink-0 space-y-2 overflow-y-auto">
        {PALETTE_ITEMS.map(item => (
          <PaletteItem
            key={item.type}
            {...item}
            onDragStart={e => {
              e.dataTransfer.setData('application/uisgen-node', item.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        ))}
      </div>

      <div className="flex-1 rounded-2xl border border-slate-100 overflow-hidden bg-white" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow<CanvasNode, LabeledEdgeType>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Background gap={16} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          allNodes={nodes}
          edges={edges}
          onUpdate={updateSelectedNode}
          onToggleActorAccess={toggleActorEdge}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

export default function SitemapCanvas({ projectId }: SitemapCanvasProps) {
  return (
    <ReactFlowProvider>
      <SitemapCanvasInner projectId={projectId} />
    </ReactFlowProvider>
  );
}
