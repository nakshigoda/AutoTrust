import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, ExternalLink } from 'lucide-react';
import { getContract, getContractWithSigner , getAllEvents } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { cn } from '../../lib/utils';
import Spinner from '../../components/ui/Spinner';

const TYPE_META = {
  service_center: { label: 'Service Center', color: 'text-brand-400', bg: 'bg-brand-600/15' },
  insurance:      { label: 'Insurance',       color: 'text-purple-400', bg: 'bg-purple-600/10' }
};

export default function OrganizationManagement() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [wallet, setWallet] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('service_center');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      // Use queryFilter to find all approved orgs
      // The events are OrganizationApproved(wallet, orgType)
      let events = [];
      try {
        events = await getAllEvents(contract, contract.filters.OrganizationApproved());
      } catch (e) {
        console.warn("Broad query limit hit, defaulting to empty or mock. You should use a better RPC for full list.", e.message);
      }
      
      const loadedOrgs = [];
      for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i];
        const addr = ev.args[0];
        const typeStr = ev.args[1];
        const orgNameStr = ev.args[2];
        
        // Skip duplicates (keep most recent)
        if (loadedOrgs.find(o => o.wallet === addr)) continue;

        let isActive = false;
        if (typeStr === 'ServiceCenter') isActive = await contract.isServiceCenter(addr);
        else if (typeStr === 'InsuranceCompany') isActive = await contract.isInsuranceCompany(addr);

        loadedOrgs.push({
          id: addr,
          name: orgNameStr,
          wallet: addr,
          type: typeStr === 'ServiceCenter' ? 'service_center' : 'insurance',
          status: isActive ? 'active' : 'revoked',
          txHash: ev.transactionHash
        });
      }
      setOrgs(loadedOrgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setTxHash(null);
      setSubmitting(true);
      if (!wallet || !wallet.trim()) throw new Error("Wallet address is required.");
      if (!orgName || !orgName.trim()) throw new Error("Organization name is required.");

      const contract = await getContractWithSigner();
      
      const adminAddr = await contract.admin();
      const signerAddr = await contract.runner.getAddress();
      if (adminAddr.toLowerCase() !== signerAddr.toLowerCase()) {
        throw new Error("Only the Admin can approve organizations. Please switch to the Admin wallet in MetaMask.");
      }

      let tx;
      if (orgType === 'service_center') {
        tx = await contract.approveServiceCenter(wallet.trim(), orgName.trim());
      } else if (orgType === 'insurance') {
        tx = await contract.approveInsuranceCompany(wallet.trim(), orgName.trim());
      } else {
        throw new Error("Invalid organization type.");
      }

      setTxHash(tx.hash);
      await tx.wait();
      
      setShowForm(false);
      setWallet(''); setOrgName('');
      fetchOrgs();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.info?.error?.message || err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orgs.filter(o => filter === 'all' || o.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Management"
        subtitle="Approve and manage authorized organizations on the blockchain."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Organizations' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(p => !p)}>
            <Plus className="h-4 w-4" />Add Organization
          </Button>
        }
      />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-brand-600/30">
            <CardHeader>
              <CardTitle>Approve Organization</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Organization Name *</label>
                  <input 
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors" 
                    placeholder="AutoTrust Prime Garage" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Wallet Address *</label>
                  <input 
                    required
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors font-mono" 
                    placeholder="0x..." 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Organization Type</label>
                  <select 
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/60 transition-colors"
                  >
                    <option value="service_center">Service Center</option>
                    <option value="insurance">Insurance Company</option>
                  </select>
                </div>
              </div>
              
              {error && <div className="mt-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">{error}</div>}
              {txHash && (
                <div className="mt-4 p-3 bg-info/10 border border-info/20 text-info text-sm rounded-lg flex items-center justify-between">
                  <span>Transaction submitted! Waiting for confirmation...</span>
                  <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><ExternalLink className="h-3 w-3"/> Etherscan</a>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="primary" type="submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Approve on Blockchain'}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'revoked', label: 'Revoked' }].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === f.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Organization cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No organizations found on-chain.</div>
        ) : filtered.map((org, i) => {
          const meta = TYPE_META[org.type] || { label: org.type, color: 'text-slate-400', bg: 'bg-surface-300' };
          return (
            <motion.div key={org.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="border">
                <div className="flex flex-wrap items-start gap-4">
                  <div className={cn('rounded-xl p-3 shrink-0', meta.bg)}>
                    <Building2 className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-semibold text-white">{org.name || 'Unknown Organization'}</h3>
                      <Badge variant={org.type} size="xs">{meta.label}</Badge>
                      <Badge variant={org.status === 'active' ? 'verified' : 'danger'} size="xs" dot>
                        {org.status === 'active' ? 'Approved' : 'Revoked / Unverified'}
                      </Badge>
                    </div>
                    <p className="hash-text">{org.wallet}</p>
                    {org.txHash && (
                      <a href={`https://sepolia.etherscan.io/tx/${org.txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-2 text-xs text-brand-400 hover:underline">
                        <ExternalLink className="h-3 w-3" /> View Approval TX
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="danger" size="xs" disabled title="Revocation not currently supported by contract">Revoke</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
