'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type CalendarValue = Date | null | [Date | null, Date | null];

interface Props {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  placeholder?: string;
}

function strToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(s: string): string {
  const d = strToDate(s);
  if (!d) return '';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CALENDAR_W = 276;
const CALENDAR_H = 290;

export default function DatePickerInput({ value, onChange, min, placeholder = 'เลือกวันที่' }: Props) {
  const [open,    setOpen]    = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef    = useRef<HTMLButtonElement>(null);
  const calendarRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click — must check both trigger and portal calendar
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const inTrigger  = containerRef.current?.contains(e.target as Node);
      const inCalendar = calendarRef.current?.contains(e.target as Node);
      if (!inTrigger && !inCalendar) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect  = buttonRef.current.getBoundingClientRect();
      const top   = rect.bottom + 4 + CALENDAR_H > window.innerHeight
        ? rect.top - CALENDAR_H - 4
        : rect.bottom + 4;
      const left  = Math.min(rect.left, window.innerWidth - CALENDAR_W - 8);
      setPos({ top, left });
    }
    setOpen(v => !v);
  }

  function handleCalendarChange(val: CalendarValue) {
    if (val instanceof Date) {
      onChange(dateToStr(val));
      setOpen(false);
    }
  }

  const minDate   = min ? strToDate(min) ?? undefined : undefined;
  const dateValue = strToDate(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 bg-slate-900 border rounded-lg px-3 py-2 text-sm text-left transition hover:border-slate-500 focus:outline-none ${
          open ? 'border-indigo-500' : 'border-slate-600'
        }`}
      >
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && mounted && createPortal(
        <div
          ref={calendarRef}
          className="calendar-dark"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
        >
          <Calendar
            value={dateValue}
            onChange={handleCalendarChange}
            minDate={minDate}
            locale="th-TH"
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
