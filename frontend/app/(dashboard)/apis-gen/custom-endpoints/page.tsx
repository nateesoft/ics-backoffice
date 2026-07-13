'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import Pagination from '@/components/apis-gen/Pagination';
import { apiGenApi } from '@/lib/api';
import { CustomEndpoint, CustomEndpointAuthType, HttpMethod } from '@/types/apiGen';

const PAGE_SIZE = 20;

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  POST: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PUT: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PATCH: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DELETE: 'bg-red-50 text-red-700 ring-red-600/20',
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset ${METHOD_STYLES[method]}`}
    >
      {method}
    </span>
  );
}

const AUTH_STYLES: Record<CustomEndpointAuthType, string> = {
  none: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  basic: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  bearer: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

const AUTH_LABELS: Record<CustomEndpointAuthType, string> = {
  none: 'No Auth',
  basic: 'Basic Auth',
  bearer: 'Bearer Token',
};

function AuthBadge({ authType }: { authType: CustomEndpointAuthType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${AUTH_STYLES[authType]}`}
    >
      {AUTH_LABELS[authType]}
    </span>
  );
}

export default function CustomEndpointsPage() {
  const [endpoints, setEndpoints] = useState<CustomEndpoint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiGenApi
      .listCustomEndpoints(page, PAGE_SIZE)
      .then((res) => {
        setEndpoints(res.data.data);
        setTotal(res.data.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this custom endpoint?')) return;
    try {
      await apiGenApi.deleteCustomEndpoint(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete endpoint');
    }
  }

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'APIs Gen', href: '/apis-gen' }, { label: 'Custom Endpoints' }]} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Custom API Builder</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Define custom REST endpoints on top of your collections — no code required.
          </p>
        </div>
        <Link
          href="/apis-gen/custom-endpoints/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 self-start"
        >
          + New endpoint
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && endpoints.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            No custom endpoints yet. Click &ldquo;New endpoint&rdquo; to create one.
          </p>
        </div>
      )}

      {endpoints.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 font-medium text-slate-600">Name</th>
                <th className="p-3 font-medium text-slate-600">Method</th>
                <th className="p-3 font-medium text-slate-600">Path</th>
                <th className="p-3 font-medium text-slate-600">Action</th>
                <th className="p-3 font-medium text-slate-600">Collection</th>
                <th className="p-3 font-medium text-slate-600">Auth</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {endpoints.map((ep) => (
                <tr key={ep.id} className="transition-colors hover:bg-slate-50">
                  <td className="p-3">
                    <Link
                      href={`/apis-gen/custom-endpoints/${ep.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {ep.name}
                    </Link>
                  </td>
                  <td className="p-3">
                    <MethodBadge method={ep.method} />
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-600">/{ep.path}</td>
                  <td className="p-3 text-slate-700">{ep.action}</td>
                  <td className="p-3">
                    {ep.collection ? (
                      <Link href={`/apis-gen/${ep.collection.id}`} className="text-indigo-600 hover:text-indigo-700">
                        {ep.collection.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    <AuthBadge authType={ep.authType} />
                  </td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => handleDelete(ep.id)} className="font-medium text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && endpoints.length > 0 && (
        <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
