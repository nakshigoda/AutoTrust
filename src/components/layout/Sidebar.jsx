import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Car, Building2, Activity, ShieldCheck,
  Wrench, FileText, AlertTriangle, User, LogOut, ChevronLeft,
  ChevronRight, Shield,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const NAV_BY_ROLE = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard',        href: '/admin',               icon: LayoutDashboard },
    { label: 'Vehicles',         href: '/admin/vehicles',       icon: Car },
    { label: 'Organizations',    href: '/admin/organizations',  icon: Building2 },
    { label: 'Blockchain Activity', href: '/admin/blockchain',  icon: Activity },
    { label: 'My Vehicle',       href: '/owner',               icon: Car },
  ],
  [ROLES.SERVICE]: [
    { label: 'Dashboard',        href: '/service',             icon: LayoutDashboard },
    { label: 'Add Service Record', href: '/service/add',       icon: Wrench },
    { label: 'My Vehicle',       href: '/owner',               icon: Car },
  ],
  [ROLES.INSURANCE]: [
    { label: 'Dashboard',        href: '/insurance',           icon: LayoutDashboard },
    { label: 'Add Accident Record', href: '/insurance/add',    icon: AlertTriangle },
    { label: 'My Vehicle',       href: '/owner',               icon: Car },
  ],
  [ROLES.OWNER]: [
    { label: 'My Vehicle',       href: '/owner',               icon: Car },
  ],
};

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.href}
      end={item.href.split('/').length <= 2}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
          isActive
            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn(
              'h-4.5 w-4.5 shrink-0 transition-colors',
              isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
            )}
            style={{ height: '1.125rem', width: '1.125rem' }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl ring-1 ring-brand-500/20"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { currentRole, user, disconnect, ROLE_LABELS } = useAuth();
  const navItems = NAV_BY_ROLE[currentRole] || [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
      className="relative flex flex-col bg-surface-50 border-r border-white/[0.06] h-screen shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-brand shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold text-white tracking-tight">AutoTrust</span>
              <p className="text-[10px] text-slate-500 font-medium">Vehicle Verification</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-4 space-y-1">
        {navItems.map(item => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User info + disconnect */}
      {user && (
        <div className="border-t border-white/[0.06] px-2 py-3 shrink-0">
          <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', !collapsed && 'mb-1')}>
            <div className="h-7 w-7 rounded-lg bg-brand-600/30 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden min-w-0"
                >
                  <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{ROLE_LABELS[currentRole]}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={disconnect}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-danger hover:bg-danger/10 transition-all',
            )}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Disconnect</span>}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-surface-300 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-400 transition-all z-30 shadow"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}
