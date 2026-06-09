'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { commentAttachmentsApi } from '@/lib/api';

export interface CommentAttachment {
  id: number;
  commentId: number;
  storedName: string;
  originalName: string;
  mimetype: string;
  size: number;
}

interface CommentEditorProps {
  commentId?: number;
  initialContent?: string;
  initialAttachments?: CommentAttachment[];
  onSubmit: (content: string, pendingFiles: File[]) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  placeholder?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) { return mime.startsWith('image/'); }

function FileIcon({ mime }: { mime: string }) {
  if (isImage(mime)) return (
    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
  if (mime.includes('pdf')) return (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

export default function CommentEditor({
  commentId,
  initialContent = '',
  initialAttachments = [],
  onSubmit,
  onCancel,
  submitLabel = 'Comment',
  placeholder = 'Write a comment...',
}: CommentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<CommentAttachment[]>(initialAttachments);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<CommentAttachment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, []);

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  const tb = (label: React.ReactNode, onClick: () => void, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 text-sm font-medium transition"
    >
      {label}
    </button>
  );

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (commentId !== undefined) {
        // Edit mode: upload immediately
        const key = file.name + file.size;
        setUploading(u => ({ ...u, [key]: true }));
        try {
          const res = await commentAttachmentsApi.upload(commentId, file);
          setAttachments(prev => [...prev, res.data]);
        } finally {
          setUploading(u => { const n = { ...u }; delete n[key]; return n; });
        }
      } else {
        // New comment mode: queue as pending
        setPendingFiles(prev => [...prev, file]);
      }
    }
  }, [commentId]);

  async function removeAttachment(att: CommentAttachment) {
    await commentAttachmentsApi.remove(att.commentId, att.id);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
  }

  function removePending(file: File) {
    setPendingFiles(prev => prev.filter(f => f !== file));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = editorRef.current?.innerHTML || '';
    const textOnly = editorRef.current?.innerText?.trim() || '';
    if (!textOnly && pendingFiles.length === 0 && attachments.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(content, pendingFiles);
      if (editorRef.current) editorRef.current.innerHTML = '';
      setPendingFiles([]);
      setAttachments([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 transition">

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-100 bg-slate-50 flex-wrap">
          {tb(<strong className="text-xs">B</strong>, () => execCmd('bold'), 'Bold')}
          {tb(<em className="text-xs">I</em>, () => execCmd('italic'), 'Italic')}
          {tb(<u className="text-xs">U</u>, () => execCmd('underline'), 'Underline')}
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {tb(
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>,
            () => execCmd('insertUnorderedList'), 'Bullet list'
          )}
          {tb(
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
            () => execCmd('insertOrderedList'), 'Numbered list'
          )}
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {tb(
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
            () => execCmd('formatBlock', 'pre'), 'Code block'
          )}
          {tb(
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
            () => execCmd('formatBlock', 'blockquote'), 'Quote'
          )}
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {tb(
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
            () => execCmd('removeFormat'), 'Clear format'
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            Attach
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
        </div>

        {/* Content area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {}}
          data-placeholder={placeholder}
          className="min-h-[80px] max-h-[250px] overflow-y-auto px-3 py-2.5 text-sm text-slate-800 focus:outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600"
        />

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mx-3 mb-2 mt-1 border-2 border-dashed rounded-lg px-3 py-2 text-center text-xs transition cursor-pointer ${
            dragOver ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span>Drag & drop or <span className="text-indigo-500 font-medium">browse</span> to attach files</span>
          </div>
        </div>

        {/* File list */}
        {(attachments.length > 0 || pendingFiles.length > 0 || Object.keys(uploading).length > 0) && (
          <div className="px-3 pb-3 space-y-1">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 group">
                {isImage(att.mimetype) ? (
                  <img src={`${API_BASE}/uploads/${att.storedName}`} alt={att.originalName} className="w-6 h-6 rounded object-cover cursor-pointer" onClick={() => setPreview(att)} />
                ) : <FileIcon mime={att.mimetype} />}
                <a href={`${API_BASE}/uploads/${att.storedName}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-slate-700 hover:text-indigo-600 truncate font-medium">{att.originalName}</a>
                <span className="text-xs text-slate-400">{formatBytes(att.size)}</span>
                <button type="button" onClick={() => removeAttachment(att)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded text-red-400 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {Object.keys(uploading).map(key => (
              <div key={key} className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-1.5 animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span className="text-xs text-indigo-500">Uploading...</span>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 group">
                <FileIcon mime={file.type} />
                <span className="flex-1 text-xs text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-amber-500">{formatBytes(file.size)}</span>
                <button type="button" onClick={() => removePending(file)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded text-red-400 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-slate-400">Ctrl+Enter to submit</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium transition">
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any); }}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition disabled:opacity-40"
          >
            {submitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>

      {/* Image preview */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img src={`${API_BASE}/uploads/${preview.storedName}`} alt={preview.originalName} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            <p className="text-white text-sm text-center mt-3 opacity-75">{preview.originalName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
