'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import Pagination from '@/components/apis-gen/Pagination';
import { apiGenApi } from '@/lib/api';
import { Collection } from '@/types/apiGen';

const PAGE_SIZE = 20;

export default function ApiGenCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiGenApi
      .listCollections(page, PAGE_SIZE)
      .then((res) => {
        setCollections(res.data.data);
        setTotal(res.data.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this API? This also deletes all of its records.')) return;
    try {
      await apiGenApi.deleteCollection(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete API');
    }
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'APIs Gen' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">APIs Gen</h1>
          <p className="text-slate-500 text-sm mt-0.5">Apps generated from JSON, each with its own live REST API.</p>
        </div>
        <Link
          href="/apis-gen/generate"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Generate from JSON
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-slate-100">
          <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <h2 className="text-base font-semibold text-slate-700">No apps generated yet</h2>
          <p className="text-slate-500 text-sm">Click &ldquo;Generate from JSON&rdquo; to create one.</p>
        </div>
      )}

      {collections.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {collections.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/apis-gen/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                      {c.name}
                    </Link>
                    {c.published ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{c.fields.length} fields</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && collections.length > 0 && (
        <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
