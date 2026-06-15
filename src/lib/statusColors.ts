// Shared status color classes for job application statuses

export const STATUS_LIGHT: Record<string, { badge: string; dot: string }> = {
  Applied:    { badge: 'text-blue-600 bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  Interview:  { badge: 'text-amber-600 bg-amber-50 border-amber-200',  dot: 'bg-amber-500' },
  Assessment: { badge: 'text-purple-600 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  Selected:   { badge: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  Rejected:   { badge: 'text-red-600 bg-red-50 border-red-200',        dot: 'bg-red-500' },
};

export const STATUS_DARK: Record<string, { badge: string; dot: string }> = {
  Applied:    { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  Interview:  { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',  dot: 'bg-amber-400' },
  Assessment: { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  Selected:   { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  Rejected:   { badge: 'text-red-400 bg-red-500/10 border-red-500/20',        dot: 'bg-red-400' },
};

const FALLBACK_LIGHT = { badge: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400' };
const FALLBACK_DARK  = { badge: 'text-slate-400 bg-slate-800 border-slate-700', dot: 'bg-slate-500' };

export function statusLight(s: string) { return STATUS_LIGHT[s] ?? FALLBACK_LIGHT; }
export function statusDark(s: string)  { return STATUS_DARK[s]  ?? FALLBACK_DARK; }
