import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import { findSlotPath, mergeComponentIntoTree, updateNodeAtPath } from './treeOps';

export const CONTENT_SLOT_NAME = 'content';

export interface ComposedPreview {
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
}

interface PreviewablePage {
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  name: string;
}

// Embeds a Page Content UI's own schema/uiSchema/data into its project's Main Page app-shell, at
// the container marked `options.slot === 'content'` (see lib/flowTemplates.ts), so Preview shows
// the page the way it actually appears inside the app rather than in isolation. Returns null if
// the Main Page has no marked content slot (e.g. a hand-built layout, or an older template).
export function composePageIntoMainLayout(mainPage: PreviewablePage, page: PreviewablePage): ComposedPreview | null {
  const slotPath = findSlotPath(mainPage.uiSchema, CONTENT_SLOT_NAME);
  if (!slotPath) return null;

  const merged = mergeComponentIntoTree(mainPage.schema, page.schema, page.uiSchema, page.name);
  const uiSchema = updateNodeAtPath(mainPage.uiSchema, slotPath, node => { node.elements = [merged.node]; });

  const data: Record<string, unknown> = { ...mainPage.data };
  for (const [originalKey, mergedKey] of Object.entries(merged.keyMap)) {
    if (page.data[originalKey] !== undefined) data[mergedKey] = page.data[originalKey];
  }

  return { schema: merged.schema, uiSchema, data };
}
