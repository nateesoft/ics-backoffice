'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import Pagination from '@/components/apis-gen/Pagination';
import { API_BASE_URL, apiGenApi } from '@/lib/api';
import { Collection, CustomEndpoint, FieldSchema, RecordItem } from '@/types/apiGen';

const PAGE_SIZE = 20;

type FormState = Record<string, string>;

function emptyForm(fields: FieldSchema[]): FormState {
  return Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? 'false' : '']));
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseFieldValue(field: FieldSchema, raw: string): unknown {
  if (raw === '') return null;
  switch (field.type) {
    case 'number': {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    case 'boolean':
      return raw === 'true';
    case 'object':
    case 'array':
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

export default function ApiGenCollectionPage() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [customEndpoints, setCustomEndpoints] = useState<CustomEndpoint[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadRecords = useCallback(
    async (searchTerm?: string, page = 1) => {
      try {
        const res = await apiGenApi.listRecords(collectionId, searchTerm, page, PAGE_SIZE);
        setRecords(res.data.data);
        setRecordsTotal(res.data.total);
        setRecordsPage(res.data.page);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load records');
      }
    },
    [collectionId],
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGenApi.getCollection(collectionId),
      apiGenApi.listRecords(collectionId, undefined, 1, PAGE_SIZE),
      apiGenApi.listCustomEndpoints(1, 100),
    ])
      .then(([c, r, endpoints]) => {
        setCollection(c.data);
        setRecords(r.data.data);
        setRecordsTotal(r.data.total);
        setRecordsPage(r.data.page);
        setCustomEndpoints(endpoints.data.data.filter((e) => e.collectionId === collectionId));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [collectionId]);

  function openCreateForm() {
    if (!collection) return;
    setEditingId(null);
    setForm(emptyForm(collection.fields));
    setShowForm(true);
  }

  function openEditForm(record: RecordItem) {
    if (!collection) return;
    setEditingId(record.id);
    const next = emptyForm(collection.fields);
    for (const field of collection.fields) {
      next[field.name] = stringifyCell(record.data[field.name]);
    }
    setForm(next);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!collection) return;
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const field of collection.fields) {
      payload[field.name] = parseFieldValue(field, form[field.name] ?? '');
    }
    try {
      if (editingId) {
        await apiGenApi.updateRecord(collectionId, editingId, payload);
      } else {
        await apiGenApi.createRecord(collectionId, payload);
      }
      setShowForm(false);
      await loadRecords(search, recordsPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!collection) return;
    setPublishing(true);
    setError(null);
    try {
      const res = collection.published
        ? await apiGenApi.unpublishCollection(collection.id)
        : await apiGenApi.publishCollection(collection.id);
      setCollection(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update publish state');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm('Delete this record?')) return;
    try {
      await apiGenApi.deleteRecord(collectionId, recordId);
      await loadRecords(search, recordsPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete record');
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!collection) return <p className="text-sm text-red-600">{error ?? 'Not found'}</p>;

  return (
    <div className="space-y-5">
      <FlowBreadcrumb items={[{ label: 'APIs Gen', href: '/apis-gen' }, { label: collection.name }]} />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800">{collection.name}</h1>
          {collection.published ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Published
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10">
              Unpublished
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {publishing ? 'Saving...' : collection.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            + New record
          </button>
        </div>
      </div>

      {collection.published && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="mb-2 font-medium text-emerald-800">
            Public REST API — base URL:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 text-emerald-900">
              {API_BASE_URL}/api/v1/{collection.slug}
            </code>
          </p>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-emerald-200/70">
              {[
                ['GET', `/api/v1/${collection.slug}`, 'List records'],
                ['POST', `/api/v1/${collection.slug}`, 'Create record'],
                ['GET', `/api/v1/${collection.slug}/:id`, 'Get one record'],
                ['PUT', `/api/v1/${collection.slug}/:id`, 'Replace record'],
                ['PATCH', `/api/v1/${collection.slug}/:id`, 'Update record'],
                ['DELETE', `/api/v1/${collection.slug}/:id`, 'Delete record'],
              ].map(([method, path, desc]) => (
                <tr key={`${method}-${path}`}>
                  <td className="w-16 py-1.5 pr-2 font-mono font-semibold text-emerald-800">{method}</td>
                  <td className="py-1.5 pr-2 font-mono text-emerald-900">
                    {API_BASE_URL}
                    {path}
                  </td>
                  <td className="py-1.5 text-emerald-700">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-medium text-slate-700">Custom endpoints</p>
          <Link
            href={`/apis-gen/custom-endpoints/new?collectionId=${collection.id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + New custom endpoint
          </Link>
        </div>
        {customEndpoints.length === 0 ? (
          <p className="text-slate-500">No custom endpoints built on this collection yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {customEndpoints.map((ep) => (
              <li key={ep.id} className="flex items-center justify-between py-1.5">
                <Link
                  href={`/apis-gen/custom-endpoints/${ep.id}`}
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {ep.name}
                </Link>
                <span className="font-mono text-xs text-slate-500">
                  {ep.method} /api/v2/{ep.path}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadRecords(search, 1)}
          placeholder="Find records..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => loadRecords(search, 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Search
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {collection.fields.map((f) => (
                <th key={f.name} className="p-3 font-medium text-slate-600">
                  {f.name}
                </th>
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50">
                {collection.fields.map((f) => (
                  <td key={f.name} className="max-w-xs truncate p-3 text-slate-700">
                    {stringifyCell(r.data[f.name])}
                  </td>
                ))}
                <td className="whitespace-nowrap p-3 text-right">
                  <button onClick={() => openEditForm(r)} className="mr-3 font-medium text-indigo-600 hover:text-indigo-700">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="font-medium text-red-600 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={collection.fields.length + 1} className="p-6 text-center text-slate-500">
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {records.length > 0 && (
        <Pagination
          page={recordsPage}
          limit={PAGE_SIZE}
          total={recordsTotal}
          onPageChange={(p) => loadRecords(search, p)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {editingId ? 'Edit record' : 'New record'}
            </h2>
            <div className="space-y-3">
              {collection.fields.map((f) => (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {f.name} <span className="text-slate-400">({f.type})</span>
                  </label>
                  {f.type === 'boolean' ? (
                    <select
                      value={form[f.name] ?? 'false'}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  ) : (
                    <input
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
