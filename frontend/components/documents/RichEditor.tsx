'use client';
import { useRef, useState, useEffect } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function RichEditor({ value, onChange, placeholder = 'Write content here...', onImageUpload }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const [isEmpty, setIsEmpty] = useState(!value);
  const [imgToolbar, setImgToolbar] = useState<{ top: number; left: number } | null>(null);

  // Sync only on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close table picker on outside click
  useEffect(() => {
    if (!showTablePicker) return;
    function onOutside(e: MouseEvent) {
      const el = document.getElementById('__table-picker__');
      if (el && el.contains(e.target as Node)) return;
      setShowTablePicker(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showTablePicker]);

  function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreRange() {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  }

  function handleInput() {
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html);
    setIsEmpty(html === '' || html === '<br>');
  }

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val ?? undefined);
    editorRef.current?.focus();
    handleInput();
  }

  function applyHeading(tag: string) {
    restoreRange();
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag || 'p');
    handleInput();
  }

  function insertImgHtml(src: string) {
    restoreRange();
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, `<img src="${src}" style="max-width:100%;height:auto;border-radius:6px;margin:6px 0;display:block" />`);
    handleInput();
  }

  function clearImgSelection() {
    if (selectedImgRef.current) {
      selectedImgRef.current.style.outline = '';
      selectedImgRef.current.style.boxShadow = '';
      selectedImgRef.current = null;
    }
    setImgToolbar(null);
  }

  function selectImage(img: HTMLImageElement) {
    clearImgSelection();
    selectedImgRef.current = img;
    img.style.outline = '2.5px solid #6366f1';
    img.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.15)';

    const range = document.createRange();
    range.selectNode(img);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const editorEl = editorRef.current;
    if (editorEl) {
      const er = editorEl.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const top = ir.top - er.top + editorEl.scrollTop - 38;
      const left = ir.left - er.left;
      setImgToolbar({ top: Math.max(2, top), left: Math.max(0, left) });
    }
  }

  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      selectImage(target as HTMLImageElement);
    } else {
      clearImgSelection();
    }
  }

  function deleteSelectedImg() {
    if (!selectedImgRef.current) return;
    selectedImgRef.current.remove();
    selectedImgRef.current = null;
    setImgToolbar(null);
    handleInput();
    editorRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (selectedImgRef.current && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      deleteSelectedImg();
    }
  }

  function handleImageFile(file: File) {
    if (onImageUpload) {
      onImageUpload(file).then(url => insertImgHtml(url)).catch(() => {});
    } else {
      const reader = new FileReader();
      reader.onload = (e) => insertImgHtml(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageFile(file);
        return;
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleImageFile(file);
        return;
      }
    }
  }

  function insertTable(rows: number, cols: number) {
    restoreRange();
    editorRef.current?.focus();

    let html = '<table style="border-collapse:collapse;width:100%;margin:10px 0"><tbody>';
    // Header row
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      html += `<th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f8fafc;font-weight:600;text-align:left;min-width:80px">Header ${c + 1}</th>`;
    }
    html += '</tr>';
    // Data rows
    for (let r = 1; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid #cbd5e1;padding:6px 10px;min-width:80px"> </td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';

    document.execCommand('insertHTML', false, html);
    handleInput();
    setShowTablePicker(false);
    setHovered({ r: 0, c: 0 });
  }

  const GRID = 8;

  const btn = (content: React.ReactNode, action: () => void, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); action(); }}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 text-sm font-medium transition"
    >
      {content}
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400 transition">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">

        {/* Heading */}
        <select
          className="h-7 text-xs px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none cursor-pointer text-slate-600"
          defaultValue=""
          onChange={e => {
            const tag = e.target.value;
            applyHeading(tag);
            (e.target as HTMLSelectElement).value = '';
          }}
        >
          <option value="">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Text style */}
        {btn(<strong className="text-sm">B</strong>, () => exec('bold'), 'Bold')}
        {btn(<em className="text-sm">I</em>, () => exec('italic'), 'Italic')}
        {btn(<u className="text-sm">U</u>, () => exec('underline'), 'Underline')}
        {btn(<s className="text-sm">S</s>, () => exec('strikeThrough'), 'Strikethrough')}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Lists */}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>,
          () => exec('insertUnorderedList'), 'Bullet list'
        )}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>,
          () => exec('insertOrderedList'), 'Numbered list'
        )}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>,
          () => exec('indent'), 'Indent'
        )}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>,
          () => exec('outdent'), 'Outdent'
        )}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Code & Quote */}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>,
          () => exec('formatBlock', 'pre'), 'Code block'
        )}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>,
          () => exec('formatBlock', 'blockquote'), 'Blockquote'
        )}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Insert Image */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInputChange}
        />
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>,
          () => { saveRange(); imageInputRef.current?.click(); },
          'Insert Image'
        )}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Insert Table */}
        <div className="relative">
          <button
            type="button"
            title="Insert Table"
            onMouseDown={e => {
              e.preventDefault();
              saveRange();
              setShowTablePicker(v => !v);
            }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </button>

          {showTablePicker && (
            <div
              id="__table-picker__"
              className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-3 select-none"
            >
              <p className="text-xs font-medium text-center mb-2 text-slate-500 min-w-[110px]">
                {hovered.r > 0 ? `${hovered.r} × ${hovered.c} table` : 'Select table size'}
              </p>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${GRID}, 1.25rem)` }}
              >
                {Array.from({ length: GRID * GRID }).map((_, i) => {
                  const r = Math.floor(i / GRID) + 1;
                  const c = (i % GRID) + 1;
                  const on = r <= hovered.r && c <= hovered.c;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHovered({ r, c })}
                      onMouseLeave={() => setHovered({ r: 0, c: 0 })}
                      onMouseDown={e => { e.preventDefault(); insertTable(r, c); }}
                      className={`w-5 h-5 border rounded-sm cursor-pointer transition ${
                        on
                          ? 'bg-indigo-200 border-indigo-500'
                          : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Undo / Redo */}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>,
          () => exec('undo'), 'Undo'
        )}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>,
          () => exec('redo'), 'Redo'
        )}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Clear format */}
        {btn(
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>,
          () => exec('removeFormat'), 'Clear format'
        )}
      </div>

      {/* Editable area */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-3 left-4 text-sm text-slate-300 pointer-events-none select-none">
            {placeholder}
          </div>
        )}

        {/* Floating image toolbar */}
        {imgToolbar && (
          <div
            className="absolute z-20 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1"
            style={{ top: imgToolbar.top, left: imgToolbar.left }}
            onMouseDown={e => e.preventDefault()}
          >
            <span className="text-xs text-slate-400 px-1 select-none">Image</span>
            <div className="w-px h-4 bg-slate-200" />
            <button
              type="button"
              onClick={deleteSelectedImg}
              title="Delete image (Del)"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400 hover:text-red-500 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={saveRange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onClick={handleEditorClick}
          onKeyDown={handleKeyDown}
          className="min-h-72 max-h-[520px] overflow-y-auto px-4 py-3 text-sm text-slate-800 focus:outline-none leading-relaxed
            [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:my-2
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-800 [&_h2]:my-1.5
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:my-1
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
            [&_li]:my-0.5
            [&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto
            [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_blockquote]:italic [&_blockquote]:my-2
            [&_table]:border-collapse [&_table]:w-full [&_table]:my-3 [&_table]:text-sm
            [&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top [&_td]:min-w-[80px]
            [&_th]:border [&_th]:border-slate-300 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:bg-slate-50 [&_th]:font-semibold [&_th]:text-left [&_th]:min-w-[80px]
            [&_tr:hover_td]:bg-slate-50/60
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:cursor-pointer [&_img]:transition-all"
        />
      </div>
    </div>
  );
}
