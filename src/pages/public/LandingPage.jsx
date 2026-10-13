import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle2, Car, FileCheck, Building2, ArrowRight, Lock, Globe, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
  {
    icon: Shield,
    title: 'Blockchain Immutable',
    desc: 'Every record is permanently stored on Ethereum. Nothing can be silently edited or deleted.',
    color: 'text-brand-400',
    bg: 'bg-brand-600/15',
  },
  {
    icon: FileCheck,
    title: 'Document Verified',
    desc: 'Service and insurance documents are SHA-256 hashed and anchored to the blockchain.',
    color: 'text-gold-400',
    bg: 'bg-gold-500/15',
  },
  {
    icon: Building2,
    title: 'Organization Verified',
    desc: 'Only admin-approved service centers and insurers can submit records.',
    color: 'text-purple-400',
    bg: 'bg-purple-600/15',
  },
  {
    icon: Globe,
    title: 'Public Access',
    desc: 'Anyone can verify a vehicle — no account, no login, no wallet required.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

const STATS = [
  { value: '100%', label: 'Tamper-proof records' },
  { value: 'SHA-256', label: 'Document integrity' },
  { value: 'Sepolia', label: 'Ethereum testnet' },
  { value: '0 Trust', label: 'No blind trust needed' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  show:    { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const { user, ROLES } = useAuth();
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (!user || user.role === ROLES.PUBLIC) navigate('/admin'); // Will trigger route guard or login if needed
    else if (user.role === ROLES.SERVICE) navigate('/service');
    else if (user.role === ROLES.INSURANCE) navigate('/insurance');
    else if (user.role === ROLES.OWNER) navigate('/owner');
    else navigate('/admin');
  };

  function handleVerify(e) {
    e.preventDefault();
    const cleaned = regNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) {
      setError('Please enter a vehicle registration number.');
      return;
    }
    setError('');
    navigate(`/verify/${cleaned}`);
  }

  return (
    <div className="min-h-screen bg-surface-0 overflow-x-hidden">
      {/* ─── Navbar ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-surface-0/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-brand">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">AutoTrust</span>
              <p className="text-[10px] text-slate-500 leading-none">Vehicle Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#how" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How it Works</a>
            <button
              onClick={handleDashboardClick}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-pattern pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div
          className="relative max-w-3xl mx-auto text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Chip */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/15 border border-brand-500/30 mb-8">
            <Zap className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-xs font-semibold text-brand-300 tracking-wide uppercase">Blockchain-Backed Vehicle Verification</span>
          </motion.div>

          {/* Wordmark */}
          <motion.h1 variants={fadeUp} className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-4">
            <span className="text-white">AUTO</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-brand-300 to-gold-300">TRUST</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-xl sm:text-2xl text-slate-400 font-light mb-3">
            Verify Before You Buy.
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm text-slate-500 max-w-xl mx-auto mb-12">
            Every service record, accident claim, ownership transfer, and mileage entry is permanently
            anchored to the Ethereum blockchain — transparent, immutable, and publicly verifiable.
          </motion.p>

          {/* Search form */}
          <motion.form variants={fadeUp} onSubmit={handleVerify} className="relative max-w-xl mx-auto">
            <div className={cn(
              'flex items-center gap-0 rounded-2xl overflow-hidden border transition-all duration-200',
              error ? 'border-danger/50 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'border-white/15 focus-within:border-brand-500/60 focus-within:shadow-[0_0_0_3px_rgba(61,110,245,0.15)]',
              'bg-surface-100',
            )}>
              <div className="flex items-center pl-5 pr-3">
                <Search className="h-5 w-5 text-slate-500 shrink-0" />
              </div>
              <input
                type="text"
                value={regNumber}
                onChange={e => { setRegNumber(e.target.value); setError(''); }}
                placeholder="Enter registration number — e.g. MH12AB1234"
                className="flex-1 bg-transparent py-4 text-white placeholder:text-slate-600 text-sm focus:outline-none font-mono"
                spellCheck={false}
                autoComplete="off"
              />
              <div className="p-2 pr-2">
                <Button type="submit" size="md" variant="primary" className="rounded-xl">
                  <span>Verify Vehicle</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {error && (
              <p className="absolute -bottom-7 left-0 text-xs text-danger">{error}</p>
            )}
          </motion.form>

          {/* Example pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mt-10 text-xs text-slate-600">
            <span>Try:</span>
            {['MH12AB1234', 'DL8CAF9987', 'KA05MH3344'].map(reg => (
              <button
                key={reg}
                type="button"
                onClick={() => { setRegNumber(reg); setError(''); }}
                className="font-mono text-slate-500 hover:text-brand-400 transition-colors underline underline-offset-2"
              >
                {reg}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats bar ─────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.05] bg-surface-50/40 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-center"
            >
              <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="section-title mb-3">How AutoTrust Works</p>
            <h2 className="text-3xl font-bold text-white">Trust through transparency</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 hover:border-white/15 transition-all group"
              >
                <div className={cn('rounded-xl p-3 w-fit mb-4', f.bg)}>
                  <f.icon className={cn('h-5 w-5', f.color)} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center rounded-3xl bg-gradient-to-br from-brand-900/60 to-surface-200/80 border border-brand-600/20 p-12"
        >
          <Car className="h-10 w-10 text-brand-400 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-white mb-3">Ready to verify a vehicle?</h2>
          <p className="text-sm text-slate-400 mb-8">
            Enter a registration number above — no account or wallet required.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Verify a Vehicle
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-slate-400">AutoTrust</span>
        </div>
        <p className="text-xs text-slate-600">
          Blockchain Vehicle Verification System • Ethereum Sepolia Testnet
        </p>
      </footer>
    </div>
  );
}
