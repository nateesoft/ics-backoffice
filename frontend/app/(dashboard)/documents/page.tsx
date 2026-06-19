'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import DocumentForm from '@/components/documents/DocumentForm';
import SequenceDiagramEditor from '@/components/documents/SequenceDiagramEditor';
import FlowchartEditor from '@/components/documents/FlowchartEditor';
import MindMapEditor from '@/components/documents/MindMapEditor';
import ERDiagramEditor from '@/components/documents/ERDiagramEditor';
import SpreadsheetEditor from '@/components/documents/SpreadsheetEditor';
import { Document, DocumentAttachment, DOCUMENT_CATEGORIES, CATEGORY_COLORS, DOC_TYPES } from '@/types/document';
import { documentsApi, docFoldersApi, authApi, DocFolder } from '@/lib/api';
import DocumentComments from '@/components/documents/DocumentComments';
import { linkify } from '@/lib/linkify';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
}

export default function DocumentsPage() {
  return (
    <Suspense>
      <DocumentsInner />
    </Suspense>
  );
}

function DocumentsInner() {
  const searchParams = useSearchParams();
  const folderIdParam = searchParams.get('folderId');
  const activeFolderId = folderIdParam ? parseInt(folderIdParam, 10) : null;

  const [docs, setDocs] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    docFoldersApi.getAll().then(r => setFolders(r.data)).catch(() => {});
    authApi.me().then(r => setCurrentUser(r.data.username)).catch(() => {});
  }, []);

  useEffect(() => {
    setFilterCategory('');
    setSearch('');
  }, [activeFolderId]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await documentsApi.getAll();
    setDocs(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this document and all its attachments?')) return;
    await documentsApi.remove(id);
    load();
  }

  async function handleFormSuccess(doc: Document) {
    setShowForm(false);
    setEditDoc(null);
    // Re-fetch to get full data including attachments
    const res = await documentsApi.getOne(doc.id);
    if (editDoc) {
      setDocs(prev => prev.map(d => d.id === doc.id ? res.data : d));
    } else {
      load();
    }
  }

  const activeFolder = activeFolderId !== null ? folders.find(f => f.id === activeFolderId) : null;

  const filtered = docs.filter(d => {
    if (activeFolderId !== null ? d.folderId !== activeFolderId : d.folderId !== null) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectCls = "px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {activeFolder ? (
              <div className="flex items-center gap-1.5 mb-0.5">
                <Link href="/documents" className="text-sm text-slate-400 hover:text-indigo-500 transition">Documents</Link>
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  {activeFolder.name}
                </span>
              </div>
            ) : null}
            <h1 className="text-2xl font-bold text-slate-900">{activeFolder?.name ?? 'Documents'}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setEditDoc(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={selectCls + ' flex-1 min-w-40'}
          />
          <select
            className={selectCls}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {DOCUMENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid / Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400 text-sm">No documents found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col"
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.docType === 'sequence'    ? 'bg-violet-50'  :
                    doc.docType === 'flowchart'   ? 'bg-amber-50'   :
                    doc.docType === 'mindmap'     ? 'bg-emerald-50' :
                    doc.docType === 'erdiagram'   ? 'bg-cyan-50'    :
                    doc.docType === 'spreadsheet' ? 'bg-green-50'   : 'bg-indigo-50'
                  }`}>
                    {doc.docType === 'sequence' ? (
                      <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    ) : doc.docType === 'flowchart' ? (
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    ) : doc.docType === 'mindmap' ? (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    ) : doc.docType === 'erdiagram' ? (
                      <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    ) : doc.docType === 'spreadsheet' ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{doc.title}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[doc.category]}`}>
                        {doc.category}
                      </span>
                      {doc.docType && doc.docType !== 'general' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          doc.docType === 'sequence'    ? 'bg-violet-50 text-violet-600'   :
                          doc.docType === 'flowchart'   ? 'bg-amber-50 text-amber-600'     :
                          doc.docType === 'mindmap'     ? 'bg-emerald-50 text-emerald-600' :
                          doc.docType === 'erdiagram'   ? 'bg-cyan-50 text-cyan-600'       :
                          doc.docType === 'spreadsheet' ? 'bg-green-50 text-green-600'     : ''
                        }`}>
                          {DOC_TYPES.find(d => d.value === doc.docType)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                {doc.content && (
                  <div className="px-5 pb-3">
                    <p className="text-xs text-slate-500 line-clamp-3">{stripHtml(doc.content)}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="px-5 pb-3 flex-1">
                  {doc.attachments?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {doc.attachments.length} file{doc.attachments.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <span className="font-medium text-slate-500">{doc.createdBy}</span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewDoc(doc)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400"
                      title="View"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setEditDoc(doc); setShowForm(true); }}
                      className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-indigo-400"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={editDoc ? 'Edit Document' : 'New Document'}
          onClose={() => { setShowForm(false); setEditDoc(null); }}
          size="xl"
        >
          <DocumentForm
            initial={editDoc || undefined}
            defaultFolderId={editDoc ? undefined : activeFolderId}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditDoc(null); }}
          />
        </Modal>
      )}

      {/* View modal */}
      {viewDoc && (
        <Modal
          title={viewDoc.title}
          onClose={() => setViewDoc(null)}
          size="xl"
        >
          <DocumentDetail
            doc={viewDoc}
            currentUser={currentUser}
            onEdit={() => { setViewDoc(null); setEditDoc(viewDoc); setShowForm(true); }}
          />
        </Modal>
      )}
    </>
  );
}

function DocumentDetail({ doc, currentUser, onEdit }: { doc: Document; currentUser: string; onEdit: () => void }) {
  return (
    <div className="space-y-5">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CATEGORY_COLORS[doc.category]}`}>
          {doc.category}
        </span>
        <span className="text-xs text-slate-400">
          Created by <span className="font-medium text-slate-600">{doc.createdBy}</span>
        </span>
        <span className="text-xs text-slate-400">
          {new Date(doc.createdAt).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
          })}
        </span>
        {doc.updatedAt !== doc.createdAt && (
          <span className="text-xs text-slate-400">
            Updated {new Date(doc.updatedAt).toLocaleDateString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok',
            })}
          </span>
        )}
        <button
          onClick={onEdit}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Divider */}
      <hr className="border-slate-100" />

      {/* Content */}
      {doc.docType === 'sequence' ? (
        <SequenceDiagramEditor value={doc.content ?? ''} readOnly />
      ) : doc.docType === 'flowchart' ? (
        <FlowchartEditor value={doc.content ?? ''} readOnly />
      ) : doc.docType === 'mindmap' ? (
        <MindMapEditor value={doc.content ?? ''} readOnly />
      ) : doc.docType === 'erdiagram' ? (
        <ERDiagramEditor value={doc.content ?? ''} readOnly />
      ) : doc.docType === 'spreadsheet' ? (
        <SpreadsheetEditor value={doc.content ?? ''} readOnly />
      ) : doc.content ? (
        <div
          className="rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm text-slate-700 leading-relaxed
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
            [&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top
            [&_th]:border [&_th]:border-slate-300 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:bg-slate-100 [&_th]:font-semibold [&_th]:text-left
            [&_tr:hover_td]:bg-white
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2"
          dangerouslySetInnerHTML={{ __html: linkify(doc.content) }}
        />
      ) : (
        <p className="text-sm text-slate-400 italic">No content provided.</p>
      )}

      {/* Attachments */}
      {doc.attachments?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Attachments ({doc.attachments.length})
          </h4>
          <ul className="space-y-2">
            {doc.attachments.map((att: DocumentAttachment) => (
              <li key={att.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xl">{fileIcon(att.mimetype)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.originalName}</p>
                  <p className="text-xs text-slate-400">{formatSize(att.size)}</p>
                </div>
                <a
                  href={documentsApi.downloadUrl(doc.id, att.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-medium transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comments */}
      {currentUser && <DocumentComments docId={doc.id} currentUser={currentUser} />}
    </div>
  );
}
