export type FlowCanvasRefType = 'ui' | 'api' | 'condition' | 'actor';

export interface FlowCanvasNodeData {
  id: string;
  refType: FlowCanvasRefType;
  refId: string | null;
  position: { x: number; y: number };
  label?: string;
  roles?: string[];
}

export interface FlowCanvasEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface FlowCanvasState {
  nodes: FlowCanvasNodeData[];
  edges: FlowCanvasEdgeData[];
}
