'use client';
import { useEffect, useRef, useState } from 'react';

interface JsonTextEditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  minRows?: number;
}

export default function JsonTextEditor<T>({ value, onChange, minRows = 14 }: JsonTextEditorProps<T>) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(JSON.stringify(value, null, 2));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setText(next);
    try {
      const parsed = JSON.parse(next);
      setError('');
      onChange(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }

  return (
    <div className="space-y-1.5">
      <textarea
        className={`w-full font-mono text-xs leading-relaxed px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-slate-50 text-slate-800 ${
          error ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-indigo-400'
        }`}
        style={{ minHeight: `${minRows * 1.4}rem` }}
        spellCheck={false}
        value={text}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; setText(JSON.stringify(value, null, 2)); }}
        onChange={handleChange}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
