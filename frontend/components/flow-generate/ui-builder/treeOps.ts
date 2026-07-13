import { arrayMove } from '@dnd-kit/sortable';
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';

// Palette actions: what a user can drag from the palette. Some of these (Checkbox/Select/
// Radio/Table) don't map to their own uischema `type` — they all produce a 'Control' node,
// just with different schema/options, decided via a dialog (see BuilderCanvas). 'Tabs'
// produces a 'Categorization' node (the real jsonforms type name).
export type BuilderElementType =
  | 'Control'
  | 'Checkbox'
  | 'Select'
  | 'Radio'
  | 'Table'
  | 'Group'
  | 'HorizontalLayout'
  | 'VerticalLayout'
  | 'Tabs'
  | 'Card'
  | 'Paper'
  | 'Box'
  | 'Button'
  | 'Label';

// Palette actions that open a dialog to bind a schema property, rather than being inserted
// directly onto the canvas.
export const CONTROL_WIDGETS = ['Control', 'Checkbox', 'Select', 'Radio', 'Table'] as const;
export type ControlWidgetAction = (typeof CONTROL_WIDGETS)[number];

export const PALETTE_GROUPS: { heading: string; items: { type: BuilderElementType; label: string; icon: string }[] }[] = [
  {
    heading: 'Fields',
    items: [
      { type: 'Control', label: 'Field', icon: '▭' },
      { type: 'Checkbox', label: 'Checkbox', icon: '☑' },
      { type: 'Select', label: 'Select Box', icon: '▾' },
      { type: 'Radio', label: 'Radio', icon: '◉' },
      { type: 'Table', label: 'Table', icon: '▦' },
    ],
  },
  {
    heading: 'Layout',
    items: [
      { type: 'Group', label: 'Group', icon: '▢' },
      { type: 'HorizontalLayout', label: 'Horizontal Layout', icon: '⬌' },
      { type: 'VerticalLayout', label: 'Vertical Layout', icon: '⬍' },
      { type: 'Tabs', label: 'Tabs', icon: '▤' },
      { type: 'Card', label: 'Card', icon: '▣' },
      { type: 'Paper', label: 'Paper', icon: '▧' },
      { type: 'Box', label: 'Box', icon: '□' },
    ],
  },
  {
    heading: 'Other',
    items: [
      { type: 'Label', label: 'Label', icon: 'T' },
      { type: 'Button', label: 'Button', icon: '⏎' },
    ],
  },
];

export const PALETTE_ITEMS = PALETTE_GROUPS.flatMap(g => g.items);

// Real uischema `type` strings (not palette actions) that behave as containers with `elements`.
export const CONTAINER_TYPES: string[] = ['Group', 'HorizontalLayout', 'VerticalLayout', 'Card', 'Paper', 'Box', 'Categorization', 'Category'];

export type BuilderNode = UiSchemaNode;

export function isContainer(node: BuilderNode): boolean {
  return CONTAINER_TYPES.includes(node.type);
}

export function isControlWidget(type: BuilderElementType): type is ControlWidgetAction {
  return (CONTROL_WIDGETS as readonly string[]).includes(type);
}

export function createDefaultNode(type: Exclude<BuilderElementType, ControlWidgetAction>): BuilderNode {
  if (type === 'Label') return { type: 'Label', text: 'Label' };
  if (type === 'Button') return { type: 'Button', text: 'Submit' };
  if (type === 'Group' || type === 'Card') return { type, label: type, elements: [] };
  if (type === 'Tabs') return { type: 'Categorization', elements: [createDefaultCategory('Tab 1'), createDefaultCategory('Tab 2')] };
  return { type, elements: [] };
}

export function createDefaultCategory(label: string): BuilderNode {
  return { type: 'Category', label, elements: [] };
}

export function createControlNode(scope: string, label: string, options?: Record<string, unknown>): BuilderNode {
  return { type: 'Control', scope, label, ...(options ? { options } : {}) };
}

// Best-effort classification of an existing 'Control' node for display purposes, based on the
// schema property it's bound to (not stored on the node itself, since the saved uiSchema must
// stay valid jsonforms — only real 'Control' nodes, never invented sub-types).
export type ControlWidgetKind = 'Field' | 'Checkbox' | 'Select' | 'Radio' | 'Table';

export function resolveControlWidgetKind(schema: JsonSchema7, node: BuilderNode): ControlWidgetKind {
  const key = node.scope?.startsWith('#/properties/') ? node.scope.slice('#/properties/'.length) : undefined;
  const prop = key ? (schema.properties?.[key] as JsonSchema7 | undefined) : undefined;
  if (!prop) return 'Field';
  if (prop.type === 'array') return 'Table';
  if (Array.isArray(prop.enum)) return node.options?.format === 'radio' ? 'Radio' : 'Select';
  if (prop.type === 'boolean') return 'Checkbox';
  return 'Field';
}

export function getNodeAtPath(root: BuilderNode, path: number[]): BuilderNode {
  let node = root;
  for (const idx of path) {
    if (!node.elements) throw new Error('Invalid builder path: container has no elements');
    node = node.elements[idx];
  }
  return node;
}

// Locates a container node marked `options.slot === slotName` (e.g. the content placeholder in
// an app-shell template, see lib/flowTemplates.ts) — used to compose a Page Content UI's own
// content into its project's Main Page for preview. Returns null if no node carries that marker.
export function findSlotPath(root: BuilderNode, slotName: string, path: number[] = []): number[] | null {
  if (root.options?.slot === slotName) return path;
  if (!root.elements) return null;
  for (let i = 0; i < root.elements.length; i++) {
    const found = findSlotPath(root.elements[i], slotName, [...path, i]);
    if (found) return found;
  }
  return null;
}

export function addNodeAtPath(root: BuilderNode, containerPath: number[], index: number | undefined, node: BuilderNode): BuilderNode {
  const clone = structuredClone(root);
  const container = getNodeAtPath(clone, containerPath);
  if (!container.elements) container.elements = [];
  const insertAt = index === undefined ? container.elements.length : index;
  container.elements.splice(insertAt, 0, node);
  return clone;
}

export function removeNodeAtPath(root: BuilderNode, path: number[]): BuilderNode {
  const clone = structuredClone(root);
  const parent = getNodeAtPath(clone, path.slice(0, -1));
  const idx = path[path.length - 1];
  parent.elements?.splice(idx, 1);
  return clone;
}

export function reorderWithinContainer(root: BuilderNode, containerPath: number[], fromIndex: number, toIndex: number): BuilderNode {
  const clone = structuredClone(root);
  const container = getNodeAtPath(clone, containerPath);
  if (!container.elements) return clone;
  container.elements = arrayMove(container.elements, fromIndex, toIndex);
  return clone;
}

export function getContainerChildCount(root: BuilderNode, path: number[]): number {
  const node = getNodeAtPath(root, path);
  return node.elements?.length ?? 0;
}

export function updateNodeAtPath(root: BuilderNode, path: number[], updater: (node: BuilderNode) => void): BuilderNode {
  const clone = structuredClone(root);
  const node = getNodeAtPath(clone, path);
  updater(node);
  return clone;
}

// --- dnd-kit id helpers ---
// Container ids identify a node's own `elements` array (drop target for its children).
// Item ids identify a node itself as a draggable/sortable entry within its parent's container.

export function pathKey(path: number[]): string {
  return path.length === 0 ? 'root' : path.join('-');
}

export function containerId(path: number[]): string {
  return `container:${pathKey(path)}`;
}

export function itemId(path: number[]): string {
  return `item:${pathKey(path)}`;
}

export function parseContainerId(id: string): number[] | null {
  if (!id.startsWith('container:')) return null;
  return parsePathKey(id.slice('container:'.length));
}

export function parseItemId(id: string): number[] | null {
  if (!id.startsWith('item:')) return null;
  return parsePathKey(id.slice('item:'.length));
}

function parsePathKey(key: string): number[] {
  if (key === 'root') return [];
  return key.split('-').map(Number);
}

export function parentPath(path: number[]): number[] {
  return path.slice(0, -1);
}

export function lastIndex(path: number[]): number {
  return path[path.length - 1];
}

export function pathsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function isAncestorPath(ancestor: number[], path: number[]): boolean {
  return path.length > ancestor.length && ancestor.every((v, i) => v === path[i]);
}

export function tryGetNodeAtPath(root: BuilderNode, path: number[]): BuilderNode | null {
  try {
    return getNodeAtPath(root, path) ?? null;
  } catch {
    return null;
  }
}

// Dragging a saved Component (a FlowUiItem with uiType 'Component') from the palette embeds a
// snapshot/copy of it — not a live reference. Its schema properties are merged into the target
// schema (renaming on key collision) and its uischema tree is remapped to the new keys, then
// wrapped in a labeled Group so the embedded block stays visually identifiable and movable as
// one unit.
export function mergeComponentIntoTree(
  targetSchema: JsonSchema7,
  componentSchema: JsonSchema7,
  componentUiSchema: BuilderNode,
  componentName: string
): { schema: JsonSchema7; node: BuilderNode; keyMap: Record<string, string> } {
  const usedKeys = new Set(Object.keys(targetSchema.properties ?? {}));
  const keyMap: Record<string, string> = {};
  const mergedProperties: Record<string, JsonSchema7> = { ...(targetSchema.properties ?? {}) };
  const mergedRequired: string[] = [...(targetSchema.required ?? [])];

  for (const [key, propSchema] of Object.entries(componentSchema.properties ?? {})) {
    let newKey = key;
    let suffix = 2;
    while (usedKeys.has(newKey)) { newKey = `${key}_${suffix}`; suffix++; }
    usedKeys.add(newKey);
    keyMap[key] = newKey;
    mergedProperties[newKey] = propSchema as JsonSchema7;
    if ((componentSchema.required ?? []).includes(key)) mergedRequired.push(newKey);
  }

  function remapScopes(node: BuilderNode): BuilderNode {
    const clone: BuilderNode = { ...node };
    if (clone.scope?.startsWith('#/properties/')) {
      const key = clone.scope.slice('#/properties/'.length);
      if (keyMap[key]) clone.scope = `#/properties/${keyMap[key]}`;
    }
    if (clone.elements) clone.elements = clone.elements.map(remapScopes);
    return clone;
  }

  const remappedRoot = remapScopes(structuredClone(componentUiSchema));

  return {
    schema: {
      ...targetSchema,
      type: targetSchema.type ?? 'object',
      properties: mergedProperties,
      ...(mergedRequired.length ? { required: mergedRequired } : {}),
    },
    node: { type: 'Group', label: componentName, elements: [remappedRoot] },
    keyMap,
  };
}
