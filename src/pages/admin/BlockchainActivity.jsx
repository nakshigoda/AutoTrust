import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, Filter } from 'lucide-react';
import { getContract , getAllEvents } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { cn } from '../../lib/utils';
import Spinner from '../../components/ui/Spinner';

function formatDate(d) { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const TYPE_COLORS = {
  VehicleRegistered:   'bg-success/10 text-success',
  ServiceAdded:        'bg-brand-600/10 text-brand-400',
  AccidentAdded:       'bg-danger/10 text-danger',
  OwnershipTransferred:'bg-gold-500/10 text-gold-400',
  OrganizationApproved:'bg-purple-600/10 text-purple-400',
};

function shortenAddr(a) { return a ? `${a.slice(0,8)}...${a.slice(-6)}` : ''; }

export default function BlockchainActivity() {
  const [filter, setFilter] = useState('all');
  const [txList, setTxList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchTx() {
      try {
        const contract = await getContract();
        let vEvents = [], oEvents = [], sEvents = [], aEvents = [], trEvents = [];
        try {
          vEvents = await getAllEvents(contract, contract.filters.VehicleRegistered());
          oEvents = await getAllEvents(contract, contract.filters.OrganizationApproved());
          sEvents = await getAllEvents(contract, contract.filters.ServiceAdded());
          aEvents = await getAllEvents(contract, contract.filters.AccidentAdded());
          trEvents = await getAllEvents(contract, contract.filters.OwnershipTransferred());
        } catch(e) {
          console.warn("Broad query blocked by RPC limit");
        }

        const txs = [
          ...vEvents.map(e => ({ type: 'VehicleRegistered', hash: e.transactionHash, block: e.blockNumber, from: e.args[2] })), // owner
          ...oEvents.map(e => ({ type: 'OrganizationApproved', hash: e.transactionHash, block: e.blockNumber, from: e.args[0] })),
          ...sEvents.map(e => ({ type: 'ServiceAdded', hash: e.transactionHash, block: e.blockNumber, from: e.args[2] })), // serviceCenter
          ...aEvents.map(e => ({ type: 'AccidentAdded', hash: e.transactionHash, block: e.blockNumber, from: e.args[1] })), // insurance
          ...trEvents.map(e => ({ type: 'OwnershipTransferred', hash: e.transactionHash, block: e.blockNumber, from: e.args[1] })), // from
        ];
        
        txs.sort((a,b) => b.block - a.block);
        
        if (active) {
          setTxList(txs);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }
    fetchTx();
    return () => { active = false; };
  }, []);

  const filteredList = filter === 'all'
    ? txList
    : txList.filter(t => t.type === filter);

  const types = [...new Set(txList.map(t => t.type))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blockchain Explorer"
        subtitle="Live feed of all verified transactions on the AutoTrust network."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Activity' }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 border border-white/[0.08] text-sm font-medium text-slate-300">
          <Filter className="h-4 w-4 text-slate-500" />
          Filter:
        </div>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === 'all' ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          )}
        >
          All Events
        </button>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === t ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            )}
          >
            {t.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner /></div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center text-slate-500">No blockchain events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-white/[0.02] border-b border-white/[0.05]">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Event Type</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Transaction Hash</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Block Number</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Related Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredList.map((tx, i) => (
                  <motion.tr key={tx.hash + i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap', TYPE_COLORS[tx.type] || 'bg-surface-300 text-slate-400')}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-brand-400/80">{tx.hash}</span>
                        <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">#{tx.block}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{shortenAddr(tx.from)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
