import { cn } from '../../lib/utils';

const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-sm hover:shadow-glow-brand',
  secondary: 'bg-surface-300 hover:bg-surface-400 active:bg-surface-200 text-slate-200 border border-white/[0.08]',
  ghost:     'hover:bg-white/[0.06] active:bg-white/[0.04] text-slate-300 hover:text-white',
  danger:    'bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 hover:border-danger/50',
  gold:      'bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-surface-0 font-bold shadow-sm hover:shadow-glow-gold',
  outline:   'border border-white/15 hover:border-brand-500/60 hover:bg-brand-600/10 text-slate-200 hover:text-white',
};

const sizes = {
  xs:  'text-xs px-2.5 py-1.5 rounded-lg',
  sm:  'text-sm px-3.5 py-2',
  md:  'text-sm px-5 py-2.5',
  lg:  'text-base px-6 py-3',
  xl:  'text-lg px-8 py-4 rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading = false,
  ...props
}) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
