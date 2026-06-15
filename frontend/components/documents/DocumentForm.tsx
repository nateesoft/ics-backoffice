'use client';
import { useState, useRef, useCallback } from 'react';
import { Document, DocumentAttachment, DOCUMENT_CATEGORIES, DOC_TYPES, DocType } from '@/types/document';
import { documentsApi, uploadsApi } from '@/lib/api';
import RichEditor from './RichEditor';
import SequenceDiagramEditor from './SequenceDiagramEditor';
import FlowchartEditor from './FlowchartEditor';
import MindMapEditor from './MindMapEditor';
import ERDiagramEditor from './ERDiagramEditor';
import SpreadsheetEditor from './SpreadsheetEditor';

interface Props {
  initial?: Document;
  defaultFolderId?: number | null;
  onSuccess: (doc: Document) => void;
  onCancel: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  return '📎';
}

const DOC_TYPE_ICONS: Record<DocType, React.ReactNode> = {
  general: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  sequence: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  flowchart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  mindmap: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  erdiagram: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  spreadsheet: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
    </svg>
  ),
};

export default function DocumentForm({ initial, defaultFolderId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    title:    initial?.title    ?? '',
    category: initial?.category ?? 'Other',
    content:  initial?.content  ?? '',
    docType:  (initial?.docType ?? 'general') as DocType,
    folderId: initial !== undefined ? (initial.folderId ?? null) : (defaultFolderId ?? null),
  });
  const [attachments, setAttachments] = useState<DocumentAttachment[]>(initial?.attachments ?? []);
  const [uploading, setUploading]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleDocTypeChange(next: DocType) {
    if (next === form.docType) return;
    if (form.content && form.content !== '{}') {
      if (!confirm('Changing the document type will clear the current content. Continue?')) return;
    }
    setForm(f => ({ ...f, docType: next, content: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      let doc: Document;
      if (initial) {
        const res = await documentsApi.update(initial.id, form);
        doc = { ...res.data, attachments };
      } else {
        const res = await documentsApi.create(form);
        doc = { ...res.data, attachments };
        if (attachments.length > 0) {
          const fresh = await documentsApi.getOne(res.data.id);
          doc = fresh.data;
        }
      }
      onSuccess(doc);
    } catch {
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!initial) { setError('Please save the document first before attaching files'); return; }
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const res = await documentsApi.uploadAttachment(initial.id, file);
        setAttachments(prev => [...prev, res.data]);
      }
    } catch {
      setError('File upload failed');
    } finally {
      setUploading(false);
    }
  }, [initial]);

  async function handleRemoveAttachment(att: DocumentAttachment) {
    if (!initial) return;
    if (!confirm(`Remove "${att.originalName}"?`)) return;
    try {
      await documentsApi.removeAttachment(initial.id, att.id);
      setAttachments(prev => prev.filter(a => a.id !== att.id));
    } catch { setError('Failed to remove file'); }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {/* Title + Category row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. User Login Flow" />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
            {DOCUMENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Doc Type selector */}
      <div>
        <label className={labelCls}>Document Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {DOC_TYPES.map(dt => {
            const active = form.docType === dt.value;
            return (
              <button
                key={dt.value}
                type="button"
                onClick={() => handleDocTypeChange(dt.value)}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-sm font-semibold transition-all
                  ${active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-slate-700'
                  }`}
              >
                <span className={active ? 'text-indigo-600' : 'text-slate-400'}>
                  {DOC_TYPE_ICONS[dt.value]}
                </span>
                <span>{dt.label}</span>
                <span className={`text-[10px] font-normal ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {dt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content editor — switches by docType */}
      <div>
        <label className={labelCls}>
          {form.docType === 'general'     ? 'Content / Details'  :
           form.docType === 'sequence'    ? 'Sequence Diagram'   :
           form.docType === 'flowchart'   ? 'Flowchart'          :
           form.docType === 'mindmap'     ? 'Mind Map'           :
           form.docType === 'spreadsheet' ? 'Spreadsheet'        : 'ER Diagram'}
        </label>
        {form.docType === 'sequence'    && <SequenceDiagramEditor value={form.content} onChange={val => set('content', val)} />}
        {form.docType === 'flowchart'   && <FlowchartEditor       value={form.content} onChange={val => set('content', val)} />}
        {form.docType === 'mindmap'     && <MindMapEditor         value={form.content} onChange={val => set('content', val)} />}
        {form.docType === 'erdiagram'   && <ERDiagramEditor       value={form.content} onChange={val => set('content', val)} />}
        {form.docType === 'spreadsheet' && <SpreadsheetEditor     value={form.content} onChange={val => set('content', val)} />}
        {form.docType === 'general'   && (
          <RichEditor
            value={form.content}
            onChange={val => set('content', val)}
            placeholder="Write document details here..."
            onImageUpload={async (file) => {
              const res = await uploadsApi.uploadImage(file);
              return uploadsApi.imageUrl(res.data.filename);
            }}
          />
        )}
      </div>

      {/* Attachments (general only — diagrams don't need files) */}
      {form.docType === 'general' && (
        <div>
          <label className={labelCls}>Attachments</label>
          {!initial && (
            <p className="text-xs text-slate-400 mb-2">Save the document first to enable file attachments.</p>
          )}
          {initial && (
            <>
              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploading ? <p className="text-sm text-slate-400">Uploading...</p> : (
                  <>
                    <p className="text-sm text-slate-500 font-medium">Drop files here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Images, PDFs, and any file up to 20 MB</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)} />
            </>
          )}
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map(att => (
                <li key={att.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xl">{fileIcon(att.mimetype)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{att.originalName}</p>
                    <p className="text-xs text-slate-400">{formatSize(att.size)}</p>
                  </div>
                  {initial && (
                    <a href={documentsApi.downloadUrl(initial.id, att.id)} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition" title="Download">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                  {initial && (
                    <button type="button" onClick={() => handleRemoveAttachment(att)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition" title="Remove">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition">
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Document'}
        </button>
      </div>
    </form>
  );
}
