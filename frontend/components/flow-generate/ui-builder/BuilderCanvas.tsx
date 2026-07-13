'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { JsonSchema7 } from '@jsonforms/core';
import type { PageKind } from '@/types/flowUi';
import Modal from '@/components/ui/Modal';
import Palette from './Palette';
import PropertiesPanel from './PropertiesPanel';
import AddControlDialog, { ControlPreset } from './AddControlDialog';
import AddTableDialog from './AddTableDialog';
import { flowUiStore } from '@/lib/flowUiStore';
import './dragCursor.css';
import {
  BuilderNode,
  BuilderElementType,
  ControlWidgetKind,
  addNodeAtPath,
  removeNodeAtPath,
  reorderWithinContainer,
  setContentSlot,
  updateNodeAtPath,
  createDefaultNode,
  createDefaultCategory,
  createControlNode,
  isContainer,
  isControlWidget,
  resolveControlWidgetKind,
  mergeComponentIntoTree,
  containerId,
  itemId,
  parseContainerId,
  parseItemId,
  parentPath,
  lastIndex,
  getContainerChildCount,
  pathsEqual,
  isAncestorPath,
  tryGetNodeAtPath,
  pathKey,
} from './treeOps';

interface BuilderCanvasProps {
  schema: JsonSchema7;
  uiSchema: BuilderNode;
  projectId?: string;
  currentUiId?: string;
  pageKind?: PageKind | null;
  onSchemaChange: (schema: JsonSchema7) => void;
  onUiSchemaChange: (uiSchema: BuilderNode) => void;
}

interface BuilderCtx {
  schema: JsonSchema7;
  selectedPath: number[] | null;
  onSelectNode: (path: number[]) => void;
  onDeleteNode: (path: number[]) => void;
  onUpdateNode: (path: number[], updater: (node: BuilderNode) => void) => void;
  onAddCategory: (categorizationPath: number[]) => void;
}

const BuilderContext = createContext<BuilderCtx | null>(null);

function useBuilderCtx(): BuilderCtx {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('BuilderNodeCard must be used within BuilderCanvas');
  return ctx;
}

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  Group: { label: 'Group', icon: '▢', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  HorizontalLayout: { label: 'Horizontal', icon: '⬌', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  VerticalLayout: { label: 'Vertical', icon: '⬍', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  Label: { label: 'Label', icon: 'T', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  Categorization: { label: 'Tabs', icon: '▤', color: 'bg-sky-50 text-sky-600 border-sky-100' },
  Card: { label: 'Card', icon: '▣', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
  Paper: { label: 'Paper', icon: '▧', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  Box: { label: 'Box', icon: '□', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  Button: { label: 'Button', icon: '⏎', color: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const WIDGET_META: Record<ControlWidgetKind, { label: string; icon: string; color: string }> = {
  Field: { label: 'Field', icon: '▭', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  Checkbox: { label: 'Checkbox', icon: '☑', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  Select: { label: 'Select', icon: '▾', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  Radio: { label: 'Radio', icon: '◉', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  Table: { label: 'Table', icon: '▦', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
};

function ContainerBody({ path, node }: { path: number[]; node: BuilderNode }) {
  const children = node.elements ?? [];
  const { setNodeRef, isOver } = useDroppable({ id: containerId(path) });
  const sortableIds = children.map((_, i) => itemId([...path, i]));

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 rounded-lg p-2 min-h-[52px] transition ${
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : children.length === 0 ? 'border-2 border-dashed border-slate-200' : ''
      }`}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {children.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">ลาก element มาวางที่นี่</p>
        ) : (
          children.map((child, i) => (
            <BuilderNodeCard key={itemId([...path, i])} path={[...path, i]} node={child} />
          ))
        )}
      </SortableContext>
    </div>
  );
}

// Categorization's own children must always be `Category` nodes (jsonforms requirement), so
// unlike other containers it isn't a generic drop target — tabs are added/removed via the
// controls below, and only each tab's own body accepts palette drops.
function CategorizationBody({ path, node }: { path: number[]; node: BuilderNode }) {
  const { onUpdateNode, onDeleteNode, onAddCategory } = useBuilderCtx();
  const categories = node.elements ?? [];

  return (
    <div className="space-y-2 pl-3 border-l-2 border-slate-100">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-sky-50 border border-sky-100">
            <input
              type="text"
              value={cat.label ?? ''}
              onChange={e => onUpdateNode([...path, i], n => { n.label = e.target.value; })}
              onClick={e => e.stopPropagation()}
              placeholder={`Tab ${i + 1}`}
              className="w-24 px-1.5 py-0.5 rounded border border-sky-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDeleteNode([...path, i]); }}
              className="text-sky-400 hover:text-red-600 px-1 text-xs leading-none"
              title="ลบแท็บ"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onAddCategory(path); }}
          className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
        >
          + เพิ่มแท็บ
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 px-1">{cat.label || `Tab ${i + 1}`}</p>
            <ContainerBody path={[...path, i]} node={cat} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BuilderNodeCard({ path, node }: { path: number[]; node: BuilderNode }) {
  const { schema, selectedPath, onSelectNode, onDeleteNode, onUpdateNode } = useBuilderCtx();
  const id = itemId(path);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const meta = node.type === 'Control'
    ? WIDGET_META[resolveControlWidgetKind(schema, node)]
    : TYPE_META[node.type] ?? { label: node.type, icon: '?', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  const container = isContainer(node);
  const isSelected = Boolean(selectedPath && pathsEqual(selectedPath, path));

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={e => { e.stopPropagation(); onSelectNode(path); }}
      className={`rounded-lg border bg-white p-2.5 space-y-2 transition cursor-pointer ${isDragging ? 'opacity-40' : ''} ${
        isOver && !isDragging ? 'ring-2 ring-indigo-400 ring-offset-1' : isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
      } ${meta.color}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1"
          title="ลากเพื่อจัดเรียง"
        >
          ⠿
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/60">
          {meta.icon} {meta.label}
        </span>

        {node.type === 'Control' && (
          <>
            <input
              type="text"
              value={node.label ?? ''}
              onChange={e => onUpdateNode(path, n => { n.label = e.target.value; })}
              onClick={e => e.stopPropagation()}
              placeholder="Label"
              className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[40%]">{node.scope}</span>
          </>
        )}

        {(node.type === 'Group' || node.type === 'Card' || node.type === 'Paper' || node.type === 'Box') && (
          <input
            type="text"
            value={node.label ?? ''}
            onChange={e => onUpdateNode(path, n => { n.label = e.target.value; })}
            onClick={e => e.stopPropagation()}
            placeholder={`${node.type} label`}
            className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        {(node.type === 'Label' || node.type === 'Button') && (
          <input
            type="text"
            value={node.text ?? ''}
            onChange={e => onUpdateNode(path, n => { n.text = e.target.value; })}
            onClick={e => e.stopPropagation()}
            placeholder="Text"
            className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        <div className="flex-1" />
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDeleteNode(path); }}
          className="text-slate-400 hover:text-red-600 px-1 text-sm leading-none"
          title="ลบ"
        >
          ✕
        </button>
      </div>

      {node.type === 'Categorization' ? (
        <CategorizationBody path={path} node={node} />
      ) : container && (
        <div className="pl-3 border-l-2 border-slate-100">
          <ContainerBody path={path} node={node} />
        </div>
      )}
    </div>
  );
}

const WIDGET_TO_PRESET: Partial<Record<BuilderElementType, ControlPreset>> = {
  Control: 'field',
  Checkbox: 'checkbox',
  Select: 'select',
  Radio: 'radio',
};

interface PendingControlDrop {
  containerPath: number[];
  index?: number;
  widget: BuilderElementType;
}

const PALETTE_MIN_WIDTH = 180;
const PALETTE_MAX_WIDTH = 420;
const PALETTE_DEFAULT_WIDTH = 240;

export default function BuilderCanvas({ schema, uiSchema, projectId, currentUiId, pageKind, onSchemaChange, onUiSchemaChange }: BuilderCanvasProps) {
  const [pendingControlDrop, setPendingControlDrop] = useState<PendingControlDrop | null>(null);
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null);
  const isMainPage = pageKind === 'Main Page';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [paletteWidth, setPaletteWidth] = useState(PALETTE_DEFAULT_WIDTH);
  const resizeDrag = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!resizeDrag.current) return;
      const delta = resizeDrag.current.startX - e.clientX; // palette is on the right: dragging left grows it
      const next = Math.min(PALETTE_MAX_WIDTH, Math.max(PALETTE_MIN_WIDTH, resizeDrag.current.startWidth + delta));
      setPaletteWidth(next);
    }
    function handlePointerUp() {
      resizeDrag.current = null;
    }
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    return () => { document.body.classList.remove('ui-builder-dragging'); };
  }, []);

  function handleResizeStart(e: React.PointerEvent) {
    e.preventDefault();
    resizeDrag.current = { startX: e.clientX, startWidth: paletteWidth };
  }

  function handleDragStart() {
    document.body.classList.add('ui-builder-dragging');
  }

  function handleDragStop() {
    document.body.classList.remove('ui-builder-dragging');
  }

  function handleDragEnd(event: DragEndEvent) {
    handleDragStop();
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    if (activeId.startsWith('component:')) {
      const componentId = event.active.data.current?.componentId as string | undefined;
      const overContainerPath = parseContainerId(overId);
      const overItemPath = parseItemId(overId);
      let targetContainerPath: number[];
      let insertIndex: number | undefined;
      if (overContainerPath) {
        targetContainerPath = overContainerPath;
        insertIndex = undefined;
      } else if (overItemPath) {
        targetContainerPath = parentPath(overItemPath);
        insertIndex = lastIndex(overItemPath) + 1;
      } else {
        return;
      }

      const component = componentId ? flowUiStore.getById(componentId) : null;
      if (!component) return;
      const merged = mergeComponentIntoTree(schema, component.schema, component.uiSchema, component.name);
      onSchemaChange(merged.schema);
      onUiSchemaChange(addNodeAtPath(uiSchema, targetContainerPath, insertIndex, merged.node));
      return;
    }

    if (activeId.startsWith('palette:')) {
      const elementType = event.active.data.current?.elementType as BuilderElementType;
      const overContainerPath = parseContainerId(overId);
      const overItemPath = parseItemId(overId);
      let targetContainerPath: number[];
      let insertIndex: number | undefined;
      if (overContainerPath) {
        targetContainerPath = overContainerPath;
        insertIndex = undefined;
      } else if (overItemPath) {
        targetContainerPath = parentPath(overItemPath);
        insertIndex = lastIndex(overItemPath) + 1;
      } else {
        return;
      }

      if (isControlWidget(elementType)) {
        setPendingControlDrop({ containerPath: targetContainerPath, index: insertIndex, widget: elementType });
        return;
      }
      onUiSchemaChange(addNodeAtPath(uiSchema, targetContainerPath, insertIndex, createDefaultNode(elementType)));
      return;
    }

    const activeItemPath = parseItemId(activeId);
    if (!activeItemPath) return;

    const overContainerPath = parseContainerId(overId);
    const overItemPath = parseItemId(overId);
    const fromContainerPath = parentPath(activeItemPath);
    const fromIndex = lastIndex(activeItemPath);

    let toContainerPath: number[];
    let toIndex: number;
    if (overItemPath) {
      toContainerPath = parentPath(overItemPath);
      toIndex = lastIndex(overItemPath);
    } else if (overContainerPath) {
      toContainerPath = overContainerPath;
      toIndex = Math.max(0, getContainerChildCount(uiSchema, toContainerPath) - 1);
    } else {
      return;
    }

    if (fromContainerPath.join('-') !== toContainerPath.join('-')) return; // only same-container reorder for now
    if (fromIndex === toIndex) return;
    onUiSchemaChange(reorderWithinContainer(uiSchema, fromContainerPath, fromIndex, toIndex));
  }

  function handleAddControlConfirm(result: { scope: string; label: string; schema: JsonSchema7; options?: Record<string, unknown> }) {
    if (!pendingControlDrop) return;
    onSchemaChange(result.schema);
    onUiSchemaChange(addNodeAtPath(uiSchema, pendingControlDrop.containerPath, pendingControlDrop.index, createControlNode(result.scope, result.label, result.options)));
    setPendingControlDrop(null);
  }

  function handleDeleteNode(path: number[]) {
    onUiSchemaChange(removeNodeAtPath(uiSchema, path));
    setSelectedPath(prev => (prev && (pathsEqual(prev, path) || isAncestorPath(path, prev)) ? null : prev));
  }

  const selectedNode = selectedPath ? tryGetNodeAtPath(uiSchema, selectedPath) : null;
  const selectedMeta = selectedNode
    ? selectedNode.type === 'Control'
      ? WIDGET_META[resolveControlWidgetKind(schema, selectedNode)]
      : TYPE_META[selectedNode.type] ?? { label: selectedNode.type, icon: '?' }
    : null;

  const ctx: BuilderCtx = {
    schema,
    selectedPath,
    onSelectNode: path => setSelectedPath(path),
    onDeleteNode: handleDeleteNode,
    onUpdateNode: (path, updater) => onUiSchemaChange(updateNodeAtPath(uiSchema, path, updater)),
    onAddCategory: path => onUiSchemaChange(addNodeAtPath(uiSchema, path, undefined, createDefaultCategory(`Tab ${getContainerChildCount(uiSchema, path) + 1}`))),
  };

  return (
    <BuilderContext.Provider value={ctx}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragStop}>
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0 pr-3">
            <ContainerBody path={[]} node={uiSchema} />
          </div>
          <div
            onPointerDown={handleResizeStart}
            className="w-1.5 flex-shrink-0 cursor-col-resize rounded-full bg-slate-200 hover:bg-indigo-300 active:bg-indigo-400 transition-colors"
            title="ลากเพื่อปรับขนาด"
          />
          <div style={{ width: paletteWidth }} className="flex-shrink-0 pl-3">
            <Palette projectId={projectId} excludeUiId={currentUiId} />
          </div>
        </div>
      </DndContext>

      {pendingControlDrop && pendingControlDrop.widget !== 'Table' && (
        <AddControlDialog
          schema={schema}
          preset={WIDGET_TO_PRESET[pendingControlDrop.widget] ?? 'field'}
          onCancel={() => setPendingControlDrop(null)}
          onConfirm={handleAddControlConfirm}
        />
      )}
      {pendingControlDrop && pendingControlDrop.widget === 'Table' && (
        <AddTableDialog
          schema={schema}
          onCancel={() => setPendingControlDrop(null)}
          onConfirm={handleAddControlConfirm}
        />
      )}

      {selectedNode && selectedPath && (
        <Modal
          title={selectedMeta ? `Properties — ${selectedMeta.icon} ${selectedMeta.label}` : 'Properties'}
          onClose={() => setSelectedPath(null)}
          size="md"
        >
          <PropertiesPanel
            key={pathKey(selectedPath)}
            schema={schema}
            node={selectedNode}
            projectId={projectId}
            excludeUiId={currentUiId}
            isMainPage={isMainPage}
            isContentSlot={selectedNode.options?.slot === 'content'}
            onToggleContentSlot={next => onUiSchemaChange(setContentSlot(uiSchema, next ? selectedPath : null))}
            onSchemaChange={onSchemaChange}
            onUpdateNode={updater => onUiSchemaChange(updateNodeAtPath(uiSchema, selectedPath, updater))}
          />
        </Modal>
      )}
    </BuilderContext.Provider>
  );
}
