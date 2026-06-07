'use client';
import { useRef, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

interface Attachment {
  id: number;
  originalName: string;
  storedName: string;
  mimetype: string;
  size: number;
}

interface DetailEditorProps {
  value: string;
  onChange: (val: string) => void;
  issueId?: number;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  onPendingFilesChange?: (files: File[]) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime.startsWith('image/');
}

function FileIcon({ mime }: { mime: string }) {
  if (isImage(mime)) {
    return (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (mime.includes('pdf')) {
    return (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

export default function DetailEditor({ value, onChange, issueId, onAttachmentsChange, onPendingFilesChange }: DetailEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);

  // Load existing attachments
  useEffect(() => {
    if (!issueId) return;
    api.get(`/issues/${issueId}/attachments`)
      .then((r: { data: Attachment[] }) => { setAttachments(r.data); onAttachmentsChange?.(r.data); })
      .catch(() => null);
  }, [issueId, onAttachmentsChange]);

  // Sync contenteditable with value prop (only on mount or external change)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  }

  function handleInput() {
    onChange(editorRef.current?.innerHTML || '');
  }

  async function uploadFile(file: File) {
    if (!issueId) {
      setPendingFiles(f => {
        const next = [...f, file];
        onPendingFilesChange?.(next);
        return next;
      });
      return;
    }
    const key = file.name + file.size;
    setUploading(u => ({ ...u, [key]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/issues/${issueId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments(prev => {
        const next = [...prev, res.data];
        onAttachmentsChange?.(next);
        return next;
      });
    } finally {
      setUploading(u => { const n = { ...u }; delete n[key]; return n; });
    }
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  }, [issueId]);

  async function removeAttachment(att: Attachment) {
    await api.delete(`/issues/${issueId}/attachments/${att.id}`);
    setAttachments(prev => {
      const next = prev.filter(a => a.id !== att.id);
      onAttachmentsChange?.(next);
      return next;
    });
  }

  function removePending(file: File) {
    setPendingFiles(f => {
      const next = f.filter(x => x !== file);
      onPendingFilesChange?.(next);
      return next;
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  const toolbarBtn = (label: React.ReactNode, onClick: () => void, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 text-sm font-medium transition"
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 transition">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
        {toolbarBtn(<strong>B</strong>, () => execCmd('bold'), 'Bold')}
        {toolbarBtn(<em>I</em>, () => execCmd('italic'), 'Italic')}
        {toolbarBtn(<u>U</u>, () => execCmd('underline'), 'Underline')}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {toolbarBtn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>,
          () => execCmd('insertUnorderedList'), 'Bullet list'
        )}
        {toolbarBtn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
          () => execCmd('insertOrderedList'), 'Numbered list'
        )}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {toolbarBtn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
          () => execCmd('formatBlock', 'pre'), 'Code block'
        )}
        {toolbarBtn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8" /></svg>,
          () => execCmd('formatBlock', 'blockquote'), 'Quote'
        )}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {toolbarBtn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
          () => execCmd('removeFormat'), 'Clear format'
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          Attach File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[120px] max-h-[300px] overflow-y-auto px-3 py-2.5 text-sm text-slate-800 focus:outline-none leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600"
      />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mx-3 my-2 border-2 border-dashed rounded-lg px-4 py-3 text-center text-xs transition cursor-pointer ${
          dragOver ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <span>Drag & drop files here, or <span className="text-indigo-500 font-medium">click to browse</span></span>
        </div>
        <div className="text-slate-300 mt-0.5">Max 20 MB per file • All file types supported</div>
      </div>

      {/* File list */}
      {(attachments.length > 0 || pendingFiles.length > 0 || Object.keys(uploading).length > 0) && (
        <div className="px-3 pb-3 space-y-1.5">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 group">
              {isImage(att.mimetype) ? (
                <img
                  src={`${API_BASE}/uploads/${att.storedName}`}
                  alt={att.originalName}
                  className="w-8 h-8 rounded object-cover cursor-pointer"
                  onClick={() => setPreview(att)}
                />
              ) : (
                <FileIcon mime={att.mimetype} />
              )}
              <div className="flex-1 min-w-0">
                <a
                  href={`${API_BASE}/uploads/${att.storedName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-700 hover:text-indigo-600 truncate block font-medium"
                >
                  {att.originalName}
                </a>
                <span className="text-xs text-slate-400">{formatBytes(att.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}

          {/* Uploading indicators */}
          {Object.keys(uploading).map(key => (
            <div key={key} className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span className="text-xs text-indigo-500">Uploading...</span>
            </div>
          ))}

          {/* Pending (no issueId yet) */}
          {pendingFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 group">
              <FileIcon mime={file.type} />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-700 truncate block">{file.name}</span>
                <span className="text-xs text-amber-500">{formatBytes(file.size)} · Will upload after save</span>
              </div>
              <button type="button" onClick={() => removePending(file)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img
              src={`${API_BASE}/uploads/${preview.storedName}`}
              alt={preview.originalName}
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <p className="text-white text-sm text-center mt-3 opacity-75">{preview.originalName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export pending files getter for use in IssueForm
export { type Attachment };
