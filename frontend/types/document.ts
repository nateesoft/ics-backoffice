export type DocumentCategory = 'Database' | 'API Endpoint' | 'Service' | 'Infrastructure' | 'Security' | 'Other';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Database',
  'API Endpoint',
  'Service',
  'Infrastructure',
  'Security',
  'Other',
];

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  'Database':       'bg-blue-50 text-blue-700 border-blue-200',
  'API Endpoint':   'bg-purple-50 text-purple-700 border-purple-200',
  'Service':        'bg-green-50 text-green-700 border-green-200',
  'Infrastructure': 'bg-orange-50 text-orange-700 border-orange-200',
  'Security':       'bg-red-50 text-red-700 border-red-200',
  'Other':          'bg-slate-50 text-slate-600 border-slate-200',
};

export interface DocumentAttachment {
  id: number;
  documentId: number;
  storedName: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export type DocType = 'general' | 'sequence' | 'flowchart';

export const DOC_TYPES: { value: DocType; label: string; desc: string }[] = [
  { value: 'general',   label: 'General',          desc: 'Rich-text document' },
  { value: 'sequence',  label: 'Sequence Diagram',  desc: 'Actor → message flow' },
  { value: 'flowchart', label: 'Flowchart',          desc: 'Drag-and-drop flow' },
];

export interface Document {
  id: number;
  title: string;
  category: DocumentCategory;
  docType: DocType;
  content?: string;
  folderId: number | null;
  createdBy: string;
  attachments: DocumentAttachment[];
  createdAt: string;
  updatedAt: string;
}
