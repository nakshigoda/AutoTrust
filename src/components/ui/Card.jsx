import { cn } from '../../lib/utils';

export default function Card({ children, className, hover = false, glass = false, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        glass
          ? 'bg-surface-100/60 backdrop-blur-md border-white/[0.06]'
          : 'bg-surface-100 border-white/[0.07]',
        hover && 'transition-all duration-200 hover:border-brand-600/40 hover:shadow-card-hover cursor-pointer',
        padding && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-base font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

export function StatCard({ icon: Icon, label, value, sub, iconColor = 'text-brand-400', iconBg = 'bg-brand-600/15', className }) {
  return (
    <Card className={cn('flex items-start gap-4', className)}>
      <div className={cn('rounded-xl p-2.5 shrink-0', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400 truncate">{label}</p>
        <p className="stat-number mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
