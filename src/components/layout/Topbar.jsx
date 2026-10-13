import { Link } from 'react-router-dom';
import { ExternalLink, Wallet, ChevronDown, Shield } from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useState } from 'react';

function shortenAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Topbar() {
  const { user, loginAs, ROLES, ROLE_LABELS } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-surface-50/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Shield className="h-3.5 w-3.5 text-brand-500" />
        <span>AutoTrust</span>
        <span>/</span>
        <span className="text-slate-400">{ROLE_LABELS[user?.role || ROLES.PUBLIC]}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              if (user.role === ROLES.PUBLIC) {
                loginAs('metamask');
              } else {
                setDropdownOpen(p => !p);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 border border-white/[0.08] text-xs text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Wallet className="h-3.5 w-3.5 text-brand-400" />
            <span className="font-medium">
              {user.role !== ROLES.PUBLIC ? shortenAddress(user.wallet) : 'Connect MetaMask'}
            </span>
          </button>
          
          {dropdownOpen && user.role !== ROLES.PUBLIC && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-surface-200 border border-white/[0.10] shadow-glass py-2 z-50 px-2 text-xs text-slate-300">
               <p className="px-2 pb-1 text-slate-400">Detected Role:</p>
               <p className="px-2 py-1 font-semibold text-white">{ROLE_LABELS[user.role]}</p>
               <div className="h-px bg-white/10 my-2"></div>
               <button onClick={() => { loginAs(ROLES.PUBLIC); setDropdownOpen(false); }} className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-danger">Disconnect</button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/[0.06] mx-1"></div>
        <Badge variant="verified" size="sm" dot>Sepolia RPC</Badge>
      </div>
    </header>
  );
}
