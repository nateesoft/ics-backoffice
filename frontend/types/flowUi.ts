export type UiType = 'Page' | 'Component';
export type PageKind = 'Main Page' | 'Page Content';

export const UI_TYPES: UiType[] = ['Page', 'Component'];
export const PAGE_KINDS: PageKind[] = ['Main Page', 'Page Content'];
export const PRESET_ROLES = ['User', 'Admin', 'Manager'];

export interface FlowUiItem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  uiType: UiType;
  pageKind: PageKind | null;
  uiPath: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}
