'use client';
import { useState } from 'react';
import { PRESET_ROLES } from '@/types/flowUi';

interface RoleTagInputProps {
  roles: string[];
  onChange: (roles: string[]) => void;
}

export default function RoleTagInput({ roles, onChange }: RoleTagInputProps) {
  const [input, setInput] = useState('');

  function addRole() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!roles.includes(trimmed)) onChange([...roles, trimmed]);
    setInput('');
  }

  const suggestions = PRESET_ROLES.filter(p => !roles.includes(p));

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
        Role ที่เข้าถึงหน้านี้ได้
      </label>

      {roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {roles.map(role => (
            <span key={role} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {role}
              <button type="button" onClick={() => onChange(roles.filter(r => r !== role))} className="hover:text-red-500 leading-none" title="ลบ role">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addRole(); }
        }}
        onBlur={addRole}
        placeholder="เช่น User, Admin, Manager แล้วกด Enter"
      />

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange([...roles, preset])}
              className="text-[11px] px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 transition"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
