'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpreadsheetData {
  columns: string[];
  rows: string[][];
}

const DEFAULT_DATA: SpreadsheetData = {
  columns: ['Column 1', 'Column 2', 'Column 3'],
  rows: [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ],
};

function parse(raw: string): SpreadsheetData {
  try {
    const d = JSON.parse(raw);
    if (Array.isArray(d.columns) && Array.isArray(d.rows)) return d;
  } catch { /* ignore */ }
  return DEFAULT_DATA;
}

interface Props {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
}

export default function SpreadsheetEditor({ value, onChange, readOnly }: Props) {
  const [data, setData] = useState<SpreadsheetData>(() => parse(value || ''));
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setData(parse(value || ''));
    }
  }, [value]);

  const commit = useCallback((next: SpreadsheetData) => {
    setData(next);
    onChange?.(JSON.stringify(next));
  }, [onChange]);

  function setHeader(ci: number, val: string) {
    const columns = [...data.columns];
    columns[ci] = val;
    commit({ ...data, columns });
  }

  function setCell(ri: number, ci: number, val: string) {
    const rows = data.rows.map(r => [...r]);
    rows[ri][ci] = val;
    commit({ ...data, rows });
  }

  function addColumn() {
    const columns = [...data.columns, `Column ${data.columns.length + 1}`];
    const rows = data.rows.map(r => [...r, '']);
    commit({ columns, rows });
  }

  function removeColumn(ci: number) {
    if (data.columns.length <= 1) return;
    const columns = data.columns.filter((_, i) => i !== ci);
    const rows = data.rows.map(r => r.filter((_, i) => i !== ci));
    commit({ columns, rows });
  }

  function addRow() {
    const rows = [...data.rows, data.columns.map(() => '')];
    commit({ ...data, rows });
  }

  function removeRow(ri: number) {
    if (data.rows.length <= 1) return;
    const rows = data.rows.filter((_, i) => i !== ri);
    commit({ ...data, rows });
  }

  function handleCellKey(e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCi = ci + 1;
      if (nextCi < data.columns.length) {
        focusCell(ri, nextCi);
      } else if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, 0);
      } else {
        addRow();
        // Focus will be handled after re-render
        setTimeout(() => focusCell(ri + 1, 0), 30);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (ri + 1 < data.rows.length) {
        focusCell(ri + 1, ci);
      } else {
        addRow();
        setTimeout(() => focusCell(ri + 1, ci), 30);
      }
    }
  }

  function focusCell(ri: number, ci: number) {
    const el = document.querySelector<HTMLInputElement>(`[data-cell="${ri}-${ci}"]`);
    el?.focus();
  }

  if (readOnly) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {data.columns.map((col, ci) => (
                <th key={ci} className="px-4 py-2.5 text-left font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50 even:bg-slate-50/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {data.columns.map((col, ci) => (
                <th key={ci} className="border border-slate-200 p-0 min-w-[120px]">
                  <div className="flex items-center group">
                    <input
                      value={col}
                      onChange={e => setHeader(ci, e.target.value)}
                      className="flex-1 px-3 py-2.5 font-semibold text-slate-700 bg-transparent focus:outline-none focus:bg-indigo-50 placeholder:text-slate-300 min-w-0"
                      placeholder={`Column ${ci + 1}`}
                    />
                    {data.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(ci)}
                        className="px-1.5 py-1 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                        title="Remove column"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {/* Add column button */}
              <th className="border border-slate-200 border-l-dashed px-2">
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 text-xs font-medium whitespace-nowrap transition px-1 py-1"
                  title="Add column"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Column
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="group/row hover:bg-indigo-50/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-slate-200 p-0">
                    <input
                      data-cell={`${ri}-${ci}`}
                      value={cell}
                      onChange={e => setCell(ri, ci, e.target.value)}
                      onKeyDown={e => handleCellKey(e, ri, ci)}
                      className="w-full px-3 py-2 text-slate-700 bg-transparent focus:outline-none focus:bg-indigo-50 placeholder:text-slate-200"
                      placeholder="—"
                    />
                  </td>
                ))}
                {/* Row delete button cell */}
                <td className="border border-slate-200 border-l-dashed px-2 text-center">
                  {data.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="text-slate-200 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition"
                      title="Remove row"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 font-medium transition px-2 py-1 rounded-lg hover:bg-indigo-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add row
      </button>

      <p className="text-xs text-slate-400">
        Tip: กด <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Tab</kbd> เพื่อข้ามช่อง,{' '}
        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Enter</kbd> เพื่อลง row ถัดไป
      </p>
    </div>
  );
}
