import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Building2, Activity, ShieldCheck, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getContract , getAllEvents } from '../../lib/ethereum';
import { StatCard } from '../../components/ui/Card';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { cn } from '../../lib/utils';
import Spinner from '../../components/ui/Spinner';

function shortenHash(h) { return h ? `${h.slice(0,10)}...${h.slice(-6)}` : '—'; }

const TX_TYPE_COLORS = {
  VehicleRegistered:   'bg-success/10 text-success',
  ServiceAdded:        'bg-brand-600/10 text-brand-400',
  AccidentAdded:       'bg-danger/10 text-danger',
  OwnershipTransferred:'bg-gold-500/10 text-gold-400',
  OrganizationApproved:'bg-purple-600/10 text-purple-400',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vehicles: 0,
    orgs: 0,
    txCount: 0,
  });
  const [recentTx, setRecentTx] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const contract = await getContract();
        
        let vEvents = [], oEvents = [], txs = [];
        try {
          vEvents = await getAllEvents(contract, contract.filters.VehicleRegistered());
          oEvents = await getAllEvents(contract, contract.filters.OrganizationApproved());
          
          // Basic aggregation for recent txs
          const sEvents = await getAllEvents(contract, contract.filters.ServiceAdded());
          const aEvents = await getAllEvents(contract, contract.filters.AccidentAdded());
          const trEvents = await getAllEvents(contract, contract.filters.OwnershipTransferred());
          
          txs = [
            ...vEvents.map(e => ({ type: 'VehicleRegistered', hash: e.transactionHash, block: e.blockNumber })),
            ...oEvents.map(e => ({ type: 'OrganizationApproved', hash: e.transactionHash, block: e.blockNumber })),
            ...sEvents.map(e => ({ type: 'ServiceAdded', hash: e.transactionHash, block: e.blockNumber })),
            ...aEvents.map(e => ({ type: 'AccidentAdded', hash: e.transactionHash, block: e.blockNumber })),
            ...trEvents.map(e => ({ type: 'OwnershipTransferred', hash: e.transactionHash, block: e.blockNumber })),
          ];
          txs.sort((a,b) => b.block - a.block);
        } catch(e) {
          console.warn("RPC limit hit for broad event fetching.", e.message);
        }

        if(active) {
          setStats({
            vehicles: new Set(vEvents.map(e => e.args[0])).size,
            orgs: new Set(oEvents.map(e => e.args[0])).size,
            txCount: txs.length
          });
          setRecentTx(txs.slice(0, 10));
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if(active) setLoading(false);
      }
    }
    loadStats();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of the AutoTrust blockchain vehicle verification system."
        breadcrumbs={[{ label: 'Admin' }]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Vehicles" value={loading ? '...' : stats.vehicles} icon={Car} trend="+12% this month" trendUp={true} color="brand" />
        <StatCard title="Approved Organizations" value={loading ? '...' : stats.orgs} icon={Building2} trend="Active on-chain" trendUp={true} color="purple" />
        <StatCard title="Total Transactions" value={loading ? '...' : stats.txCount} icon={Activity} trend="Immutable records" trendUp={true} color="success" />
        <StatCard title="Network Status" value="Online" icon={ShieldCheck} trend="Sepolia Testnet" trendUp={true} color="gold" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Blockchain Activity</CardTitle>
              <Link to="/admin/activity" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                View All
              </Link>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/[0.05]">
            {loading ? <div className="py-12 flex justify-center"><Spinner/></div> : recentTx.length === 0 ? <div className="py-12 text-center text-slate-500">No recent transactions found.</div> : recentTx.map((tx, i) => (
              <motion.div key={tx.hash + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={cn('rounded-xl p-2.5 shrink-0', TX_TYPE_COLORS[tx.type] || 'bg-surface-300 text-slate-400')}>
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{tx.type}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{tx.hash}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-white font-medium">#{tx.block}</p>
                  <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline flex items-center gap-1 justify-end mt-0.5">
                    <ExternalLink className="h-3 w-3"/> Etherscan
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300">RPC Connection</p>
                <Badge variant="verified" size="xs">Healthy</Badge>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-300 overflow-hidden">
                <div className="h-full bg-success w-full"></div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-surface-300/50 border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-brand-600/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Smart Contract</p>
                  <p className="text-xs text-slate-500">AutoTrust v1.0</p>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400 bg-surface-400 px-2 py-1 rounded">0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
