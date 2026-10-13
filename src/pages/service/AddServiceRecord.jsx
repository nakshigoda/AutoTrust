import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ShieldAlert, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { getContractWithSigner } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { ethers } from 'ethers';

export default function AddServiceRecord() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const [formData, setFormData] = useState({
    registrationNumber: '',
    serviceType: 'General Service',
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    document: null
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setTxHash(null);
      setSubmitting(true);

      if (!formData.registrationNumber || !formData.registrationNumber.trim() || !formData.date || !formData.mileage || !formData.cost) {
        throw new Error("All fields marked * are required.");
      }

      const contract = await getContractWithSigner();
      
      // Verify isServiceCenter
      const signerAddr = await contract.runner.getAddress();
      const isApproved = await contract.isServiceCenter(signerAddr);
      if (!isApproved) {
        throw new Error("Connected wallet is not an approved Service Center. Please switch to your Service Center wallet in MetaMask.");
      }

      const isRegistered = await contract.isVehicleRegistered(formData.registrationNumber.trim().toUpperCase());
      if (!isRegistered) {
        throw new Error(`Vehicle "${formData.registrationNumber.trim().toUpperCase()}" is not registered on the blockchain yet. Please have the Admin register it first.`);
      }

      const dateTimestamp = Math.floor(new Date(formData.date).getTime() / 1000);
      
      // ZERO document hash
      const documentHash = ethers.ZeroHash;

      // ==========================================
      // DIAGNOSTIC LOGGING FOR USER
      // ==========================================
      console.log("--- PRE-TX DIAGNOSTIC ---");
      console.log("Contract Address (Target):", contract.target);
      console.log("Signer Address:", await contract.runner.getAddress());
      const network = await contract.runner.provider.getNetwork();
      console.log("Chain ID:", network.chainId);
      
      const args = [
        formData.registrationNumber.trim().toUpperCase(),
        formData.serviceType,
        dateTimestamp,
        parseInt(formData.mileage || "0", 10),
        parseInt(formData.cost || "0", 10)
      ];
      console.log("Function: addServiceRecord");
      console.log("Arguments:", args);
      
      const expectedCalldata = contract.interface.encodeFunctionData("addServiceRecord", args);
      console.log("Expected Encoded Calldata:", expectedCalldata);
      // ==========================================

      const tx = await contract.addServiceRecord(...args);

      // ==========================================
      // POST-TX DIAGNOSTIC
      // ==========================================
      console.log("--- POST-TX DIAGNOSTIC ---");
      console.log("tx.hash:", tx.hash);
      console.log("tx.to:", tx.to);
      console.log("tx.data:", tx.data);
      console.log("tx.from:", tx.from);
      console.log("tx.chainId:", tx.chainId);
      // ==========================================

      setTxHash(tx.hash);
      await tx.wait();
      
      // Go to verification on success
      navigate(`/verify/${formData.registrationNumber.trim().toUpperCase()}`);

    } catch (err) {
      console.error(err);
      setError(err.reason || err.info?.error?.message || err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Add Service Record"
        subtitle="Submit a verified maintenance record to the blockchain."
        breadcrumbs={[{ label: 'Service Center', href: '/service' }, { label: 'Add Record' }]}
      />

      <Card className="border-brand-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <CardTitle>Service Details</CardTitle>
              <p className="text-sm text-slate-400 mt-1">This record will be permanently attached to the vehicle's blockchain passport.</p>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Registration Number *</label>
              <input required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50 uppercase" placeholder="MH04XY5678" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Service Type *</label>
              <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50">
                <option>General Service</option>
                <option>Oil Change</option>
                <option>Major Repair</option>
                <option>Battery Replacement</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Date *</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Odometer Reading (km) *</label>
              <input required type="number" min="0" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50" placeholder="45000" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Total Cost (₹) *</label>
              <input required type="number" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50" placeholder="8500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-info/10 border border-info/20 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-info shrink-0" />
            <p className="text-sm text-info/90 leading-relaxed">
              By submitting this record, your wallet address will be permanently recorded as the verified service provider.
            </p>
          </div>

          {error && <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}
          {txHash && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-center justify-between">
              <span>Transaction processing on Sepolia...</span>
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> View</a>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" onClick={handleSubmit} className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting to Blockchain...' : 'Submit to Blockchain'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
