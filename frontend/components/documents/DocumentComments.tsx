'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { docCommentsApi, uploadsApi, issuesApi, documentsApi } from '@/lib/api';

interface RefIssue { id: number; projectName: string; }
interface RefDocument { id: number; title: string; }

interface DocReaction {
  id: number;
  commentId: number;
  emoji: string;
  createdBy: string;
}

interface DocComment {
  id: number;
  documentId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reactions: DocReaction[];
  parentId: number | null;
}

interface Props {
  docId: number;
  currentUser: string;
}

const EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅', '❌', '💡', '🤔'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function groupReactions(reactions: DocReaction[], currentUser: string) {
  const groups: Record<string, { count: number; reacted: boolean; users: string[] }> = {};
  for (const r of reactions) {
    if (!groups[r.emoji]) groups[r.emoji] = { count: 0, reacted: false, users: [] };
    groups[r.emoji].count++;
    groups[r.emoji].users.push(r.createdBy);
    if (r.createdBy === currentUser) groups[r.emoji].reacted = true;
  }
  return groups;
}

function DocCommentInput({ onSubmit, onCancel, placeholder = 'Write a comment...', submitLabel = 'Comment', initialValue = '', issues = [], documents = [] }: {
  onSubmit: (html: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  issues?: RefIssue[];
  documents?: RefDocument[];
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const docDropdownRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueQuery, setIssueQuery] = useState('');
  const [issueIndex, setIssueIndex] = useState(0);
  const [issuePos, setIssuePos] = useState({ top: 0, left: 0 });

  const [docOpen, setDocOpen] = useState(false);
  const [docQuery, setDocQuery] = useState('');
  const [docIndex, setDocIndex] = useState(0);
  const [docPos, setDocPos] = useState({ top: 0, left: 0 });

  const filteredIssues = issues.filter(iss =>
    !issueQuery || String(iss.id).includes(issueQuery) || iss.projectName.toLowerCase().includes(issueQuery.toLowerCase())
  ).slice(0, 10);

  const filteredDocs = documents.filter(doc =>
    !docQuery || String(doc.id).includes(docQuery) || doc.title.toLowerCase().includes(docQuery.toLowerCase())
  ).slice(0, 10);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialValue;
    editorRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!issueOpen || !issueDropdownRef.current) return;
    const item = issueDropdownRef.current.children[issueIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [issueIndex, issueOpen]);

  useEffect(() => {
    if (!docOpen || !docDropdownRef.current) return;
    const item = docDropdownRef.current.children[docIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [docIndex, docOpen]);

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  function detectPopups() {
    const sel = window.getSelection();
    if (!sel?.rangeCount) { setIssueOpen(false); setDocOpen(false); return; }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { setIssueOpen(false); setDocOpen(false); return; }
    const text = node.textContent || '';
    const offset = range.startOffset;
    const before = text.slice(0, offset);

    const hashIdx = before.lastIndexOf('#');
    const bangIdx = before.lastIndexOf('!');
    const maxIdx = Math.max(hashIdx, bangIdx);
    if (maxIdx === -1) { setIssueOpen(false); setDocOpen(false); return; }

    const query = before.slice(maxIdx + 1);
    if (query.includes(' ')) { setIssueOpen(false); setDocOpen(false); return; }

    const rect = range.getBoundingClientRect();
    const pos = { top: rect.bottom + 4, left: rect.left };

    if (maxIdx === hashIdx) {
      setDocOpen(false); setIssueQuery(query); setIssueIndex(0); setIssuePos(pos); setIssueOpen(true);
    } else {
      setIssueOpen(false); setDocQuery(query); setDocIndex(0); setDocPos(pos); setDocOpen(true);
    }
  }

  function insertIssueRef(id: number, projectName: string) {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const before = (node.textContent || '').slice(0, range.startOffset);
    const hashIdx = before.lastIndexOf('#');
    if (hashIdx === -1) return;
    const refRange = range.cloneRange();
    refRange.setStart(node, hashIdx);
    refRange.setEnd(node, range.startOffset);
    refRange.deleteContents();
    const span = document.createElement('span');
    span.className = 'issue-ref text-amber-700 font-semibold bg-amber-50 rounded px-0.5 border border-amber-200';
    span.dataset.issueId = String(id);
    span.contentEditable = 'false';
    span.textContent = `#${id} ${projectName}`;
    refRange.insertNode(span);
    const after = document.createRange();
    after.setStartAfter(span);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    document.execCommand('insertText', false, ' ');
    setIssueOpen(false);
  }

  function insertDocRef(id: number, title: string) {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const before = (node.textContent || '').slice(0, range.startOffset);
    const bangIdx = before.lastIndexOf('!');
    if (bangIdx === -1) return;
    const refRange = range.cloneRange();
    refRange.setStart(node, bangIdx);
    refRange.setEnd(node, range.startOffset);
    refRange.deleteContents();
    const span = document.createElement('span');
    span.className = 'doc-ref text-emerald-700 font-semibold bg-emerald-50 rounded px-0.5 border border-emerald-200';
    span.dataset.docId = String(id);
    span.contentEditable = 'false';
    span.textContent = `!${id} ${title}`;
    refRange.insertNode(span);
    const after = document.createRange();
    after.setStartAfter(span);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    document.execCommand('insertText', false, ' ');
    setDocOpen(false);
  }

  async function insertImageInline(file: File) {
    if (!file.type.startsWith('image/')) return;
    setInsertingImage(true);
    try {
      const res = await uploadsApi.uploadImage(file);
      const url = uploadsApi.imageUrl(res.data.filename);
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;border-radius:8px;margin:4px 0;display:block;" />`);
    } finally {
      setInsertingImage(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      await insertImageInline(e.target.files[0]);
      e.target.value = '';
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await insertImageInline(file);
        return;
      }
    }
  }

  async function submit() {
    const html = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText?.trim() || '';
    if (!text) return;
    setSubmitting(true);
    try {
      await onSubmit(html);
      if (editorRef.current) editorRef.current.innerHTML = '';
    } finally {
      setSubmitting(false);
    }
  }

  const tb = (icon: React.ReactNode, onClick: () => void, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 text-sm font-medium transition"
    >
      {icon}
    </button>
  );

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
            insertingImage
              ? <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            () => imageInputRef.current?.click(),
            'Insert image'
          )}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          onInput={detectPopups}
          onKeyDown={e => {
            if (issueOpen && filteredIssues.length > 0) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIssueIndex(i => Math.min(i + 1, filteredIssues.length - 1)); return; }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIssueIndex(i => Math.max(i - 1, 0)); return; }
              if (e.key === 'Enter') { e.preventDefault(); const iss = filteredIssues[issueIndex]; if (iss) insertIssueRef(iss.id, iss.projectName); return; }
              if (e.key === 'Escape') { setIssueOpen(false); return; }
            }
            if (docOpen && filteredDocs.length > 0) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setDocIndex(i => Math.min(i + 1, filteredDocs.length - 1)); return; }
              if (e.key === 'ArrowUp') { e.preventDefault(); setDocIndex(i => Math.max(i - 1, 0)); return; }
              if (e.key === 'Enter') { e.preventDefault(); const doc = filteredDocs[docIndex]; if (doc) insertDocRef(doc.id, doc.title); return; }
              if (e.key === 'Escape') { setDocOpen(false); return; }
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          data-placeholder={placeholder}
          className="min-h-[72px] max-h-[240px] overflow-y-auto px-3 py-2.5 text-sm text-slate-800 focus:outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_.issue-ref]:text-amber-700 [&_.issue-ref]:font-semibold [&_.issue-ref]:bg-amber-50 [&_.issue-ref]:rounded [&_.issue-ref]:px-0.5 [&_.doc-ref]:text-emerald-700 [&_.doc-ref]:font-semibold [&_.doc-ref]:bg-emerald-50 [&_.doc-ref]:rounded [&_.doc-ref]:px-0.5 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-1"
        />
      </div>

      {/* Issue ref dropdown */}
      {issueOpen && filteredIssues.length > 0 && (
        <div
          ref={issueDropdownRef}
          style={{ position: 'fixed', top: issuePos.top, left: issuePos.left, zIndex: 9999 }}
          className="w-72 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1"
        >
          {filteredIssues.map((iss, i) => (
            <div
              key={iss.id}
              onMouseDown={e => { e.preventDefault(); insertIssueRef(iss.id, iss.projectName); }}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition ${i === issueIndex ? 'bg-amber-50 text-amber-800' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-xs text-amber-700 font-bold flex-shrink-0">#</span>
              <span className="font-medium truncate">{iss.projectName}</span>
              <span className="text-xs text-slate-400 ml-auto flex-shrink-0">#{iss.id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Document ref dropdown */}
      {docOpen && filteredDocs.length > 0 && (
        <div
          ref={docDropdownRef}
          style={{ position: 'fixed', top: docPos.top, left: docPos.left, zIndex: 9999 }}
          className="w-72 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1"
        >
          {filteredDocs.map((doc, i) => (
            <div
              key={doc.id}
              onMouseDown={e => { e.preventDefault(); insertDocRef(doc.id, doc.title); }}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition ${i === docIndex ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-xs text-emerald-700 font-bold flex-shrink-0">!</span>
              <span className="font-medium truncate">{doc.title}</span>
              <span className="text-xs text-slate-400 ml-auto flex-shrink-0">!{doc.id}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-slate-400">Ctrl+Enter to submit · # issue · ! document</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition">
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={submitting || insertingImage}
            onClick={submit}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium transition"
          >
            {submitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReactionBar({ commentId, reactions, currentUser, onToggle }: {
  commentId: number;
  reactions: DocReaction[];
  currentUser: string;
  onToggle: (commentId: number, emoji: string) => Promise<void>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const groups = groupReactions(reactions, currentUser);

  useEffect(() => {
    if (!showPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  function openPicker() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.top, left: rect.left });
    }
    setShowPicker(p => !p);
  }

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {Object.entries(groups).map(([emoji, { count, reacted, users }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(commentId, emoji)}
          title={users.join(', ')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
            reacted
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <span>{emoji}</span><span>{count}</span>
        </button>
      ))}
      <button
        ref={triggerRef}
        onClick={openPicker}
        title="Add reaction"
        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
      >
        <span>😊</span><span className="font-bold text-[10px]">+</span>
      </button>
      {showPicker && (
        <div
          ref={pickerRef}
          style={{
            position: 'fixed',
            top: pickerPos.top,
            left: pickerPos.left,
            transform: 'translateY(-110%)',
            zIndex: 9999,
          }}
          className="grid grid-cols-6 gap-0.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5"
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => { onToggle(commentId, e); setShowPicker(false); }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-lg hover:bg-slate-50"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentComments({ docId, currentUser }: Props) {
  const [comments, setComments] = useState<DocComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [refIssues, setRefIssues] = useState<RefIssue[]>([]);
  const [refDocs, setRefDocs] = useState<RefDocument[]>([]);

  useEffect(() => {
    issuesApi.getAll().then(r => setRefIssues(
      r.data.filter((iss: any) => !iss.isCancelled).map((iss: any) => ({ id: iss.id, projectName: iss.projectName }))
    )).catch(() => {});
    documentsApi.getAll().then(r => setRefDocs(
      r.data.map((doc: any) => ({ id: doc.id, title: doc.title }))
    )).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await docCommentsApi.getAll(docId);
      setComments(res.data);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  const topLevel = comments.filter(c => !c.parentId);
  const repliesMap: Record<number, DocComment[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  async function handleCreate(content: string, parentId?: number) {
    await docCommentsApi.create(docId, content, parentId);
    await load();
    if (parentId) setReplyToId(null);
  }

  async function handleUpdate(id: number, content: string) {
    await docCommentsApi.update(id, content);
    setEditId(null);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this comment?')) return;
    await docCommentsApi.remove(id);
    await load();
  }

  async function handleToggleReaction(commentId: number, emoji: string) {
    const res = await docCommentsApi.toggleReaction(commentId, emoji);
    const updated: DocReaction[] = res.data;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: updated } : c));
  }

  function renderCommentBody(c: DocComment, isReply: boolean) {
    if (editId === c.id) {
      return (
        <DocCommentInput
          key={`edit-${c.id}`}
          initialValue={c.content}
          onSubmit={(content: string) => handleUpdate(c.id, content)}
          onCancel={() => setEditId(null)}
          submitLabel="Save"
          issues={refIssues}
          documents={refDocs}
        />
      );
    }

    return (
      <div className="group relative">
        <div
          className={`bg-slate-50 rounded-xl px-3 py-2 text-slate-700 leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-1 ${isReply ? 'text-xs' : 'text-sm'}`}
          dangerouslySetInnerHTML={{ __html: c.content }}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <ReactionBar
            commentId={c.id}
            reactions={c.reactions}
            currentUser={currentUser}
            onToggle={handleToggleReaction}
          />
          {!isReply && (
            <button
              onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors mt-1.5 ${
                replyToId === c.id ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
              {(repliesMap[c.id]?.length ?? 0) > 0 && (
                <span className="text-slate-400 font-normal">{repliesMap[c.id].length}</span>
              )}
            </button>
          )}
        </div>

        {c.createdBy === currentUser && (
          <div className="absolute top-1.5 right-2 hidden group-hover:flex gap-1">
            <button onClick={() => setEditId(c.id)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(c.id)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500 transition" title="Delete">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">
        Comments
        {topLevel.length > 0 && (
          <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">
            {topLevel.length}
          </span>
        )}
      </h4>

      {loading ? (
        <div className="text-slate-400 text-xs py-3">Loading comments...</div>
      ) : topLevel.length === 0 ? (
        <div className="text-slate-400 text-xs py-2">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-5 mb-6">
          {topLevel.map(c => (
            <div key={c.id}>
              {/* Top-level comment */}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(c.createdBy)}`}>
                  {c.createdBy[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">{c.createdBy}</span>
                    <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                    {c.updatedAt !== c.createdAt && <span className="text-xs text-slate-300 italic">edited</span>}
                  </div>
                  {renderCommentBody(c, false)}
                </div>
              </div>

              {/* Replies */}
              {(repliesMap[c.id]?.length ?? 0) > 0 && (
                <div className="ml-11 mt-3 pl-4 border-l-2 border-slate-100 space-y-3">
                  {repliesMap[c.id].map(r => (
                    <div key={r.id} className="flex gap-2">
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(r.createdBy)}`}>
                        {r.createdBy[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-800">{r.createdBy}</span>
                          <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                          {r.updatedAt !== r.createdAt && <span className="text-xs text-slate-300 italic">edited</span>}
                        </div>
                        {renderCommentBody(r, true)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline reply editor */}
              {replyToId === c.id && (
                <div className="ml-11 mt-3 flex gap-2">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(currentUser)}`}>
                    {currentUser[0]?.toUpperCase()}
                  </div>
                  <DocCommentInput
                    key={`reply-${c.id}`}
                    placeholder={`Reply to @${c.createdBy}...`}
                    submitLabel="Reply"
                    onSubmit={(content: string) => handleCreate(content, c.id)}
                    onCancel={() => setReplyToId(null)}
                    issues={refIssues}
                    documents={refDocs}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New top-level comment */}
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(currentUser)}`}>
          {currentUser[0]?.toUpperCase()}
        </div>
        <DocCommentInput
          key="new-comment"
          onSubmit={(content: string) => handleCreate(content)}
          placeholder="Write a comment..."
          submitLabel="Comment"
          issues={refIssues}
          documents={refDocs}
        />
      </div>
    </div>
  );
}
