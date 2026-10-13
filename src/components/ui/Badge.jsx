import { cn } from '../../lib/utils';

const variants = {
  verified:  'bg-success/15 text-success border-success/25',
  active:    'bg-success/15 text-success border-success/25',
  settled:   'bg-success/15 text-success border-success/25',
  pending:   'bg-gold-500/15 text-gold-400 border-gold-400/25',
  warning:   'bg-warning/15 text-warning border-warning/25',
  revoked:   'bg-danger/15 text-danger border-danger/25',
  error:     'bg-danger/15 text-danger border-danger/25',
  info:      'bg-info/15 text-info border-info/25',
  default:   'bg-surface-300 text-slate-300 border-surface-400',
  blockchain:'bg-brand-600/15 text-brand-400 border-brand-500/25',
  confirmed: 'bg-success/15 text-success border-success/25',
  anomaly:   'bg-danger/15 text-danger border-danger/30',
  service_center: 'bg-brand-600/15 text-brand-400 border-brand-500/25',
  insurance:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  dealer:         'bg-gold-500/15 text-gold-400 border-gold-400/25',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export default function Badge({ variant = 'default', size = 'sm', children, className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variants[variant] ?? variants.default,
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            variant === 'verified' || variant === 'active' || variant === 'confirmed' || variant === 'settled'
              ? 'bg-success animate-pulse-slow'
              : variant === 'pending'
              ? 'bg-gold-400'
              : variant === 'anomaly' || variant === 'error' || variant === 'revoked'
              ? 'bg-danger'
              : 'bg-current',
          )}
        />
      )}
      {children}
    </span>
  );
}
