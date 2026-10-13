import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions, className }) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-slate-300 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-400">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
