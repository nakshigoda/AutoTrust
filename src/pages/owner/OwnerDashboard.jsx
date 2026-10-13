import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Shield, ArrowRight, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getContract, getContractWithSigner } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import { ethers } from 'ethers';

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  
  // Transfer Form State
  const [showTransfer, setShowTransfer] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const handleTransfer = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setTxHash(null);
      setSubmitting(true);
      
      if (!regNum || !regNum.trim() || !newOwner || !newOwner.trim() || !newOwnerName || !newOwnerName.trim()) {
        throw new Error("Registration number, new owner wallet, and new owner name are required.");
      }

      const contract = await getContractWithSigner();
      const signerAddr = await contract.runner.getAddress();
      
      const vData = await contract.getVehicle(regNum.trim().toUpperCase());
      if (!vData || !vData.currentOwner || vData.currentOwner === '0x0000000000000000000000000000000000000000') {
        throw new Error("Vehicle not found on blockchain.");
      }
      if (vData.currentOwner.toLowerCase() !== signerAddr.toLowerCase()) {
        throw new Error("Connected wallet is not the current registered owner of this vehicle.");
      }

      const tx = await contract.transferOwnership(regNum.trim().toUpperCase(), newOwner.trim(), newOwnerName.trim());
      setTxHash(tx.hash);
      
      await tx.wait();
      
      setShowTransfer(false);
      setRegNum('');
      setNewOwner(''); setNewOwnerName('');
      navigate(`/verify/${regNum.trim().toUpperCase()}`);

    } catch (err) {
      console.error(err);
      setError(err.reason || err.info?.error?.message || err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Owner Dashboard"
        subtitle="Manage and transfer your vehicles on the blockchain."
        breadcrumbs={[{ label: 'Owner' }]}
      />

      <Card className="border-dashed border-brand-500/20 bg-surface-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between p-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Transfer Ownership</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Transfer your vehicle to a new owner wallet. The transfer will be permanently recorded on the blockchain.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowTransfer(!showTransfer)}>
            {showTransfer ? 'Cancel' : 'Initiate Transfer'}
            {!showTransfer && <ArrowRight className="h-4 w-4 ml-1.5" />}
          </Button>
        </div>
      </Card>

      {showTransfer && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-brand-600/30">
            <CardHeader>
              <CardTitle>Transfer Vehicle</CardTitle>
            </CardHeader>
            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Registration Number *</label>
                  <input required value={regNum} onChange={e=>setRegNum(e.target.value)} className="w-full bg-surface-300 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none uppercase" placeholder="MH04XY5678" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">New Owner Wallet *</label>
                  <input required value={newOwner} onChange={e=>setNewOwner(e.target.value)} className="w-full bg-surface-300 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none" placeholder="0x..." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">New Owner Name *</label>
                  <input required value={newOwnerName} onChange={e=>setNewOwnerName(e.target.value)} className="w-full bg-surface-300 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Bob" />
                </div>
              </div>
              
              {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">{error}</div>}
              {txHash && (
                <div className="p-3 bg-info/10 border border-info/20 text-info text-sm rounded-lg flex items-center justify-between">
                  <span>Transaction submitted! Waiting for confirmation...</span>
                  <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><ExternalLink className="h-3 w-3"/> Etherscan</a>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="primary" onClick={handleTransfer} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Transfer on Blockchain'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Quick access */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/')}
          className="card-interactive p-5 text-left group"
        >
          <Shield className="h-6 w-6 text-brand-400 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Verify Any Vehicle</h3>
          <p className="text-xs text-slate-500">View complete vehicle history, blockchain records, and documents.</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-brand-400 group-hover:text-brand-300 transition-colors">
            Go to Verification <ArrowRight className="h-3 w-3" />
          </div>
        </button>
      </div>

    </div>
  );
}
