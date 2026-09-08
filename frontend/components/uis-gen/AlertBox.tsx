'use client';
import type { AlertType } from '@/types/uisGen';

interface AlertBoxProps {
  alertType: AlertType;
  title: string;
  message: string;
  onClose: () => void;
}

const ALERT_META: Record<AlertType, { icon: string; color: string; bg: string }> = {
  info: { icon: 'ℹ', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  confirm: { icon: '?', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  warning: { icon: '⚠', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  error: { icon: '✕', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function AlertBox({ alertType, title, message, onClose }: AlertBoxProps) {
  const meta = ALERT_META[alertType];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-2xl border shadow-2xl bg-white p-5 ${meta.bg}`}>
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base font-bold bg-white border ${meta.color}`}>
            {meta.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800">{title || 'แจ้งเตือน'}</h3>
            {message && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{message}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          {alertType === 'confirm' && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
