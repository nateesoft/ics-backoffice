import { FlowTemplate } from '@/types/flowProject';

// Catalog of templates available for cloning into a new Flow Generate project.
// Mirrors the `templates` entries defined in web-generation.json.
export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    templateId: 'simple-crud-app-v1',
    name: 'Simple CRUD Application',
    description: 'Reusable CRUD template: list / search / view / create / update / delete for a single resource.',
  },
];

export function getFlowTemplate(templateId: string): FlowTemplate | null {
  return FLOW_TEMPLATES.find(t => t.templateId === templateId) ?? null;
}
