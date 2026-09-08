'use client';
import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export interface LabeledEdgeData extends Record<string, unknown> {
  label?: string;
  onLabelChange: (edgeId: string, label: string) => void;
}

export type LabeledEdgeType = Edge<LabeledEdgeData, 'labeled'>;

export function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  style, markerEnd, data, selected,
}: EdgeProps<LabeledEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  const label = data?.label ?? '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: selected ? 3 : (style?.strokeWidth ?? 2) }}
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="nodrag nopan absolute pointer-events-auto"
        >
          <input
            type="text"
            value={label}
            onChange={e => data?.onLabelChange(id, e.target.value)}
            placeholder="+ ข้อความ"
            size={Math.max(label.length, 6)}
            className={`text-center text-[10px] font-medium rounded-full border px-2 py-0.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors ${
              label
                ? 'border-slate-300 text-slate-600'
                : 'border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-slate-400'
            }`}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
