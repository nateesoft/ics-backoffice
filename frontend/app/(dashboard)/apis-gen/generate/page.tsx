'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import { apiGenApi } from '@/lib/api';
import { FieldType } from '@/types/apiGen';

type Mode = 'upload' | 'build';

interface FieldRow {
  id: string;
  name: string;
  type: FieldType;
  value: string;
}

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'date', 'object', 'array'];

function emptyRow(id: string): FieldRow {
  return { id, name: '', type: 'string', value: '' };
}

function parseRowValue(row: FieldRow): unknown {
  switch (row.type) {
    case 'number': {
      const n = Number(row.value);
      return Number.isNaN(n) ? row.value : n;
    }
    case 'boolean':
      return row.value === 'true';
    case 'object':
    case 'array':
      return JSON.parse(row.value || (row.type === 'array' ? '[]' : '{}'));
    default:
      return row.value;
  }
}

export default function GenerateApiGenPage() {
  const router = useRouter();
  const idPrefix = useId();
  const [mode, setMode] = useState<Mode>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const [appName, setAppName] = useState('');
  const [rows, setRows] = useState<FieldRow[]>([emptyRow(`${idPrefix}-0`)]);
  const rowCounter = useRef(1);

  function updateRow(id: string, patch: Partial<FieldRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(`${idPrefix}-${rowCounter.current++}`)]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function buildJsonFile(): File {
    const trimmedRows = rows.map((r) => ({ ...r, name: r.name.trim() }));
    if (!appName.trim()) throw new Error('App name is required');
    if (trimmedRows.length === 0 || trimmedRows.some((r) => !r.name)) {
      throw new Error('Every field needs a name');
    }
    const names = trimmedRows.map((r) => r.name);
    if (new Set(names).size !== names.length) throw new Error('Field names must be unique');

    const data: Record<string, unknown> = {};
    for (const row of trimmedRows) {
      try {
        data[row.name] = parseRowValue(row);
      } catch {
        throw new Error(`Invalid JSON value for field "${row.name}"`);
      }
    }

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    return new File([blob], `${appName.trim()}.json`, { type: 'application/json' });
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const fileToSend = mode === 'upload' ? file : buildJsonFile();
      if (!fileToSend) return;
      const res = await apiGenApi.generate(fileToSend);
      router.push(`/apis-gen/${res.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = mode === 'upload' ? !!file : appName.trim().length > 0;

  return (
    <div className="max-w-xl space-y-2">
      <FlowBreadcrumb items={[{ label: 'APIs Gen', href: '/apis-gen' }, { label: 'Generate' }]} />
      <h1 className="text-xl font-bold text-slate-800">Generate CRUD App from JSON</h1>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode('build')}
            className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${mode === 'build' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Build JSON
          </button>
        </div>

        {mode === 'upload' ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mb-4 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {file ? (
              <p className="text-sm text-slate-600">Selected: {file.name}</p>
            ) : (
              <p className="text-sm text-slate-400">Choose a .json file (an object or array of objects)</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">App name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Customers"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Fields</label>
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder="field name"
                    className="w-1/3 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.id, { type: e.target.value as FieldType, value: '' })}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {row.type === 'boolean' ? (
                    <select
                      value={row.value || 'false'}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  ) : row.type === 'object' || row.type === 'array' ? (
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      placeholder={row.type === 'array' ? '[1, 2, 3]' : '{"a": 1}'}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <input
                      type={row.type === 'number' ? 'number' : row.type === 'date' ? 'date' : 'text'}
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      placeholder="sample value"
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="text-sm text-slate-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove field"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRow}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                + Add field
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={!canSubmit || loading}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  );
}
