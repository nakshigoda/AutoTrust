import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Plus, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getContract , getAllEvents } from '../../lib/ethereum';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/Card';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';

export default function InsuranceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let active = true;
    async function fetchMyRecords() {
      if (!user?.wallet) return;
      try {
        const contract = await getContract();
        let events = [];
        try {
          events = await getAllEvents(contract, contract.filters.AccidentAdded());
        } catch(e) {
          console.warn("Broad query limit hit", e.message);
        }

        const myEvents = events.filter(e => e.args[1].toLowerCase() === user.wallet.toLowerCase());
        
        const loaded = myEvents.map(e => ({
          registrationNumber: e.args[0],
          txHash: e.transactionHash,
          blockNumber: e.blockNumber
        })).reverse();
        
        if (active) {
          setRecords(loaded);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }
    fetchMyRecords();
    return () => { active = false; };
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insurance Dashboard"
        subtitle={`${user?.name || 'Insurance Company'} • Verified Organization`}
        breadcrumbs={[{ label: 'Insurance' }]}
        actions={
          <Link to="/insurance/add">
            <Button variant="danger" size="sm"><Plus className="h-4 w-4" />Report Accident</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={ShieldAlert}  label="Claims Reported"  value={loading ? '...' : records.length}  sub="All on-chain" iconColor="text-danger" iconBg="bg-danger/15" />
        <StatCard icon={CheckCircle2} label="Verified"           value={loading ? '...' : records.length} sub="Blockchain Verified" iconColor="text-success" iconBg="bg-success/10" />
        <StatCard icon={FileText}     label="Network Status"     value="Active"  sub="Sepolia RPC"      iconColor="text-gold-400"  iconBg="bg-gold-500/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Accident Records</CardTitle>
          <Badge variant="blockchain">{loading ? 0 : records.length} on-chain</Badge>
        </CardHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No accident records submitted by your wallet yet.</div>
          ) : (
            records.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl bg-surface-300/50 border border-white/5 flex flex-wrap items-center justify-between gap-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-danger" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase">{rec.registrationNumber}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Accident Record</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-danger/80 mb-1">{rec.txHash.slice(0,10)}...{rec.txHash.slice(-6)}</p>
                  <a href={`https://sepolia.etherscan.io/tx/${rec.txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-danger transition-colors uppercase tracking-wider font-semibold">
                    <ExternalLink className="h-3 w-3" /> View TX
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
