'use client';
import { useCallback, useEffect, useMemo, useRef, useState, DragEvent } from 'react';
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
import { UiFlowNode, ApiFlowNode, ConditionFlowNode, ActorFlowNode, UiNodeData, ApiNodeData, ConditionNodeData, ActorNodeData } from './FlowCanvasNodes';
import { LabeledEdge, LabeledEdgeData, LabeledEdgeType } from './FlowCanvasEdges';

const nodeTypes = { ui: UiFlowNode, api: ApiFlowNode, condition: ConditionFlowNode, actor: ActorFlowNode };
const edgeTypes = { labeled: LabeledEdge };

type FlowNodeRefType = 'ui' | 'api' | 'condition' | 'actor';

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

type CanvasNode = Node<UiNodeData, 'ui'> | Node<ApiNodeData, 'api'> | Node<ConditionNodeData, 'condition'> | Node<ActorNodeData, 'actor'>;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

const TEST_STEP_DELAY = 1100;

interface TestRunState {
  active: boolean;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  awaitingEdges: LabeledEdgeType[] | null;
  finished: boolean;
  activeRoles: string[] | null;
  accessDenied: { nodeId: string; requiredRoles: string[] } | null;
}

const initialTestRun: TestRunState = {
  active: false, currentNodeId: null, visitedNodeIds: [], visitedEdgeIds: [], awaitingEdges: null, finished: false,
  activeRoles: null, accessDenied: null,
};

function nodeDisplayName(node: CanvasNode | undefined): string {
  if (!node) return '—';
  if (node.type === 'condition') return node.data.label ? `Condition: ${node.data.label}` : 'Condition';
  if (node.type === 'actor') return node.data.name || 'Actor';
  return node.data.item.name;
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
  const [testRun, setTestRun] = useState<TestRunState>(initialTestRun);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleLabelChange = useCallback((nodeId: string, label: string) => {
    setNodes(nds => nds.map(n => (n.id === nodeId && n.type === 'condition' ? { ...n, data: { ...n.data, label } } : n)));
  }, [setNodes]);

  const handleActorNameChange = useCallback((nodeId: string, name: string) => {
    setNodes(nds => nds.map(n => (n.id === nodeId && n.type === 'actor' ? { ...n, data: { ...n.data, name } } : n)));
  }, [setNodes]);

  const handleActorRolesChange = useCallback((nodeId: string, roles: string[]) => {
    setNodes(nds => nds.map(n => (n.id === nodeId && n.type === 'actor' ? { ...n, data: { ...n.data, roles } } : n)));
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
      } else if (n.refType === 'actor') {
        restoredNodes.push({
          id: n.id, type: 'actor', position: n.position,
          data: {
            name: n.label ?? '', roles: n.roles ?? [],
            onRemove: handleRemoveNode, onNameChange: handleActorNameChange, onRolesChange: handleActorRolesChange,
          },
        });
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
    setTestRun(initialTestRun);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, handleRemoveNode, handleLabelChange, handleEdgeLabelChange, handleActorNameChange, handleActorRolesChange]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flowCanvasStore.save(projectId, {
        nodes: nodes.map(n => ({
          id: n.id,
          refType: n.type as FlowNodeRefType,
          refId: n.type === 'condition' || n.type === 'actor' ? null : n.data.item.id,
          position: n.position,
          label: n.type === 'condition' ? n.data.label : n.type === 'actor' ? n.data.name : undefined,
          roles: n.type === 'actor' ? n.data.roles : undefined,
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

  const testTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  useEffect(() => {
    if (!testRun.active || testRun.awaitingEdges || testRun.finished || testRun.accessDenied || !testRun.currentNodeId) return;
    const nodeId = testRun.currentNodeId;
    const activeRoles = testRun.activeRoles;

    testTimer.current = setTimeout(() => {
      const node = nodesById.get(nodeId);
      if (activeRoles && node?.type === 'ui' && node.data.item.uiType === 'Page' && node.data.item.roles?.length) {
        const requiredRoles = node.data.item.roles;
        const hasAccess = requiredRoles.some(r => activeRoles.includes(r));
        if (!hasAccess) {
          setTestRun(tr => ({ ...tr, accessDenied: { nodeId, requiredRoles } }));
          return;
        }
      }

      const outgoing = edges.filter(e => e.source === nodeId);
      if (outgoing.length === 0) {
        setTestRun(tr => ({ ...tr, finished: true }));
      } else if (outgoing.length === 1) {
        const edge = outgoing[0];
        setTestRun(tr => ({
          ...tr,
          currentNodeId: edge.target,
          visitedNodeIds: [...tr.visitedNodeIds, edge.target],
          visitedEdgeIds: [...tr.visitedEdgeIds, edge.id],
        }));
      } else {
        setTestRun(tr => ({ ...tr, awaitingEdges: outgoing }));
      }
    }, TEST_STEP_DELAY);
    return () => { if (testTimer.current) clearTimeout(testTimer.current); };
  }, [testRun.active, testRun.currentNodeId, testRun.awaitingEdges, testRun.finished, testRun.accessDenied, testRun.activeRoles, edges, nodesById]);

  const startTest = useCallback(() => {
    if (nodes.length === 0) return;
    const targetIds = new Set(edges.map(e => e.target));
    const startNode = nodes.find(n => !targetIds.has(n.id)) ?? nodes[0];
    setTestRun({
      active: true, currentNodeId: startNode.id, visitedNodeIds: [startNode.id],
      visitedEdgeIds: [], awaitingEdges: null, finished: false,
      activeRoles: startNode.type === 'actor' ? startNode.data.roles : null,
      accessDenied: null,
    });
  }, [nodes, edges]);

  const stopTest = useCallback(() => setTestRun(initialTestRun), []);

  const chooseBranch = useCallback((edge: LabeledEdgeType) => {
    setTestRun(tr => ({
      ...tr,
      currentNodeId: edge.target,
      visitedNodeIds: [...tr.visitedNodeIds, edge.target],
      visitedEdgeIds: [...tr.visitedEdgeIds, edge.id],
      awaitingEdges: null,
    }));
  }, []);

  const forceAdvance = useCallback(() => {
    setTestRun(tr => {
      if (!tr.currentNodeId) return tr;
      const outgoing = edges.filter(e => e.source === tr.currentNodeId);
      if (outgoing.length === 0) return { ...tr, accessDenied: null, finished: true };
      if (outgoing.length === 1) {
        const edge = outgoing[0];
        return {
          ...tr,
          accessDenied: null,
          currentNodeId: edge.target,
          visitedNodeIds: [...tr.visitedNodeIds, edge.target],
          visitedEdgeIds: [...tr.visitedEdgeIds, edge.id],
        };
      }
      return { ...tr, accessDenied: null, awaitingEdges: outgoing };
    });
  }, [edges]);

  const currentTestNode = testRun.currentNodeId ? nodesById.get(testRun.currentNodeId) : undefined;

  const displayNodes = useMemo(() => {
    if (!testRun.active) return nodes;
    return nodes.map(n => {
      if (n.id === testRun.currentNodeId) {
        return {
          ...n,
          className: testRun.accessDenied
            ? 'ring-4 ring-red-400 ring-offset-2'
            : 'ring-4 ring-indigo-400 ring-offset-2 animate-pulse',
        };
      }
      if (!testRun.visitedNodeIds.includes(n.id)) {
        return { ...n, className: 'opacity-30' };
      }
      return n;
    });
  }, [nodes, testRun.active, testRun.currentNodeId, testRun.visitedNodeIds, testRun.accessDenied]);

  const displayEdges = useMemo(() => {
    if (!testRun.active) return edges;
    const lastEdgeId = testRun.visitedEdgeIds[testRun.visitedEdgeIds.length - 1];
    return edges.map(e => {
      if (e.id === lastEdgeId) {
        return { ...e, animated: true, style: { ...e.style, strokeWidth: 4 } };
      }
      if (!testRun.visitedEdgeIds.includes(e.id)) {
        return { ...e, style: { ...e.style, opacity: 0.2 } };
      }
      return e;
    });
  }, [edges, testRun.active, testRun.visitedEdgeIds]);

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
    } else if (refType === 'actor') {
      const node: CanvasNode = {
        id: `actor-${genId()}`, type: 'actor', position,
        data: {
          name: '', roles: [],
          onRemove: handleRemoveNode, onNameChange: handleActorNameChange, onRolesChange: handleActorRolesChange,
        },
      };
      setNodes(nds => nds.concat(node));
    } else {
      const node: CanvasNode = {
        id: `condition-${genId()}`, type: 'condition', position,
        data: { label: '', onRemove: handleRemoveNode, onLabelChange: handleLabelChange },
      };
      setNodes(nds => nds.concat(node));
    }
  }, [uis, apis, screenToFlowPosition, setNodes, handleRemoveNode, handleLabelChange, handleActorNameChange, handleActorRolesChange]);

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
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap min-h-[42px]">
        {!testRun.active ? (
          <button
            onClick={startTest}
            disabled={nodes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-medium transition"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            ทดสอบ Flow
          </button>
        ) : testRun.accessDenied ? (
          <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-red-50 border border-red-200 w-full">
            <span className="text-xs font-semibold text-red-700">
              🚫 ไม่มีสิทธิ์เข้าหน้า &ldquo;{nodeDisplayName(nodesById.get(testRun.accessDenied.nodeId))}&rdquo; —
              ต้องมี role: {testRun.accessDenied.requiredRoles.join(', ')}
              {testRun.activeRoles && ` (Actor มี role: ${testRun.activeRoles.length > 0 ? testRun.activeRoles.join(', ') : '—'})`}
            </span>
            <button onClick={forceAdvance} className="ml-auto px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex-shrink-0">
              ข้ามและทดสอบต่อ
            </button>
            <button onClick={stopTest} className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 text-xs font-medium text-red-700 flex-shrink-0">
              หยุดทดสอบ
            </button>
          </div>
        ) : testRun.awaitingEdges ? (
          <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 w-full">
            <span className="text-xs font-semibold text-amber-700 flex-shrink-0">
              {currentTestNode?.type === 'condition'
                ? `เงื่อนไข: ${currentTestNode.data.label || '(ยังไม่ระบุ)'} — เลือกผลลัพธ์`
                : 'เลือกเส้นทางถัดไป'}
            </span>
            {testRun.awaitingEdges.map(edge => {
              if (edge.sourceHandle === 'true') {
                return (
                  <button key={edge.id} onClick={() => chooseBranch(edge)} className="px-3 py-1 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition">
                    True
                  </button>
                );
              }
              if (edge.sourceHandle === 'false') {
                return (
                  <button key={edge.id} onClick={() => chooseBranch(edge)} className="px-3 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition">
                    False
                  </button>
                );
              }
              const target = nodesById.get(edge.target);
              return (
                <button key={edge.id} onClick={() => chooseBranch(edge)} className="px-3 py-1 rounded-full bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium transition">
                  {edge.data?.label || `→ ${nodeDisplayName(target)}`}
                </button>
              );
            })}
            <button onClick={stopTest} className="ml-auto px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 text-xs font-medium text-amber-700 flex-shrink-0">
              หยุดทดสอบ
            </button>
          </div>
        ) : testRun.finished ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 w-full">
            <span className="text-xs font-semibold text-emerald-700">
              ✓ ทดสอบ Flow เสร็จสมบูรณ์ ({testRun.visitedNodeIds.length} nodes)
            </span>
            <button onClick={stopTest} className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">
              รีเซ็ต
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 w-full">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-indigo-700 truncate">
              กำลังทดสอบ: {nodeDisplayName(currentTestNode)}
            </span>
            <button onClick={stopTest} className="ml-auto px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 text-xs font-medium text-indigo-700 flex-shrink-0">
              หยุดทดสอบ
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 h-[calc(100vh-300px)] min-h-[480px]">
        <div className="relative w-[85%] rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={testRun.active ? [] : ['Backspace', 'Delete']}
            nodesDraggable={!testRun.active}
            nodesConnectable={!testRun.active}
            elementsSelectable={!testRun.active}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              className="!bg-white"
              nodeColor={n => (n.type === 'api' ? '#6366f1' : n.type === 'condition' ? '#f59e0b' : n.type === 'actor' ? '#8b5cf6' : '#14b8a6')}
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

        <div className={`w-[15%] min-w-[190px] flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 overflow-y-auto ${testRun.active ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Actor</h3>
            <PaletteItem
              label="Actor / User"
              sublabel="กำหนด Role & สิทธิ์เข้าถึงหน้า"
              badge="Actor"
              badgeClass="bg-violet-50 text-violet-600"
              onDragStart={makePaletteDragStart('actor', 'actor')}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
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
