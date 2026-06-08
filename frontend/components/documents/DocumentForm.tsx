'use client';
import { useState, useRef, useCallback } from 'react';
import { Document, DocumentAttachment, DOCUMENT_CATEGORIES } from '@/types/document';
import { documentsApi } from '@/lib/api';
import RichEditor from './RichEditor';

interface Props {
  initial?: Document;
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

export default function DocumentForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: initial?.category ?? 'Other',
    content: initial?.content ?? '',
  });
  const [attachments, setAttachments] = useState<DocumentAttachment[]>(initial?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
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
        // Upload any pending files after document is created
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
    const arr = Array.from(files);
    if (!initial) {
      setError('Please save the document first before attaching files');
      return;
    }
    setUploading(true);
    setError('');
    try {
      for (const file of arr) {
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
    } catch {
      setError('Failed to remove file');
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className={labelCls}>Title *</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Production Database Connection"
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category</label>
        <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
          {DOCUMENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Content */}
      <div>
        <label className={labelCls}>Content / Details</label>
        <RichEditor
          value={form.content}
          onChange={val => set('content', val)}
          placeholder="Write document details here..."
        />
      </div>

      {/* Attachments */}
      <div>
        <label className={labelCls}>Attachments</label>

        {!initial && (
          <p className="text-xs text-slate-400 mb-2">
            Save the document first to enable file attachments.
          </p>
        )}

        {initial && (
          <>
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploading ? (
                <p className="text-sm text-slate-400">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-slate-500 font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Images, PDFs, and any file up to 20 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
          </>
        )}

        {/* File list */}
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
                  <a
                    href={documentsApi.downloadUrl(initial.id, att.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )}
                {initial && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition"
                    title="Remove"
                  >
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

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition"
        >
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Document'}
        </button>
      </div>
    </form>
  );
}
