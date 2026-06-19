import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  Applied:    { bg: '#2563eb', text: '#ffffff' },
  Interview:  { bg: '#d97706', text: '#ffffff' },
  Assessment: { bg: '#7c3aed', text: '#ffffff' },
  Selected:   { bg: '#059669', text: '#ffffff' },
  Rejected:   { bg: '#dc2626', text: '#ffffff' },
};

const STATUSES = ['Applied', 'Interview', 'Assessment', 'Selected', 'Rejected'];

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StatusDropdown({ value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[value] ?? { bg: '#6b7280', text: '#ffffff' };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button — shows current status with filled color */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ backgroundColor: cfg.bg, color: cfg.text }}
        className="flex items-center gap-2 pl-3.5 pr-2.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest min-w-[140px] justify-between shadow-sm hover:brightness-110 transition-all"
      >
        <span>{value || 'Set Status'}</span>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Options panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[140px] rounded-xl overflow-hidden shadow-2xl border border-black/10">
          {STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                style={{ backgroundColor: c.bg, color: c.text }}
                className="w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:brightness-90 transition-all border-b border-black/10 last:border-0"
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
