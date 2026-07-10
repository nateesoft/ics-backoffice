'use client';
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PALETTE_GROUPS, BuilderElementType } from './treeOps';

function PaletteChip({ type, label, icon }: { type: BuilderElementType; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { fromPalette: true, elementType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </button>
  );
}

export default function Palette() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(heading: string) {
    setCollapsed(c => ({ ...c, [heading]: !c[heading] }));
  }

  return (
    <div className="flex flex-col gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide -mb-2">
        ลาก element ไปวางด้านซ้าย
      </span>
      {PALETTE_GROUPS.map(group => {
        const isCollapsed = Boolean(collapsed[group.heading]);
        return (
          <div key={group.heading} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => toggleGroup(group.heading)}
              className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition"
            >
              <span>{group.heading}</span>
              <svg
                className={`w-3 h-3 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {!isCollapsed && group.items.map(item => <PaletteChip key={item.type} {...item} />)}
          </div>
        );
      })}
    </div>
  );
}
