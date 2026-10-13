import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { getContractWithSigner } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { ethers } from 'ethers';

export default function AddAccidentRecord() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const [formData, setFormData] = useState({
    registrationNumber: '',
    date: new Date().toISOString().split('T')[0],
    damageDescription: '',
    accidentLocation: '',
    repairCost: '',
    claimAmount: '',
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setTxHash(null);
      setSubmitting(true);

      if (!formData.registrationNumber || !formData.registrationNumber.trim() || !formData.date || !formData.damageDescription || !formData.repairCost || !formData.accidentLocation || !formData.claimAmount) {
        throw new Error("All fields marked * are required.");
      }

      const contract = await getContractWithSigner();
      
      // Verify isInsuranceCompany
      const signerAddr = await contract.runner.getAddress();
      const isApproved = await contract.isInsuranceCompany(signerAddr);
      if (!isApproved) {
        throw new Error("Connected wallet is not an approved Insurance Company. Please switch to your Insurance wallet in MetaMask.");
      }

      const isRegistered = await contract.isVehicleRegistered(formData.registrationNumber.trim().toUpperCase());
      if (!isRegistered) {
        throw new Error(`Vehicle "${formData.registrationNumber.trim().toUpperCase()}" is not registered on the blockchain yet. Please have the Admin register it first.`);
      }

      const dateTimestamp = Math.floor(new Date(formData.date).getTime() / 1000);

      // addAccidentRecord _regNumber, _date, _damageDescription, _repairCost, _accidentLocation, _claimAmount
      const tx = await contract.addAccidentRecord(
        formData.registrationNumber.trim().toUpperCase(),
        dateTimestamp,
        formData.damageDescription.trim(),
        parseInt(formData.repairCost || "0", 10),
        formData.accidentLocation.trim(),
        parseInt(formData.claimAmount || "0", 10)
      );

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
        title="Report Accident / Claim"
        subtitle="Submit an immutable accident record directly to the vehicle's blockchain passport."
        breadcrumbs={[{ label: 'Insurance', href: '/insurance' }, { label: 'Report Accident' }]}
      />

      <Card className="border-danger/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-danger" />
            </div>
            <div>
              <CardTitle>Accident Details</CardTitle>
              <p className="text-sm text-slate-400 mt-1">These details will permanently affect the vehicle's history.</p>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Registration Number *</label>
              <input required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50 uppercase" placeholder="MH04XY5678" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Date of Incident *</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-300 block mb-2">Damage Description *</label>
              <textarea required rows="3" value={formData.damageDescription} onChange={e => setFormData({...formData, damageDescription: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50 resize-none" placeholder="Describe the damages incurred..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Approved Repair Cost (₹) *</label>
              <input required type="number" min="0" value={formData.repairCost} onChange={e => setFormData({...formData, repairCost: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50" placeholder="45000" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Location of Accident *</label>
              <input required value={formData.accidentLocation} onChange={e => setFormData({...formData, accidentLocation: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50" placeholder="Mumbai, MH" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Claim Amount Settled (₹) *</label>
              <input required type="number" min="0" value={formData.claimAmount} onChange={e => setFormData({...formData, claimAmount: e.target.value})} className="w-full bg-surface-300 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger/50" placeholder="40000" />
            </div>
            
            
          </div>

          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm text-danger/90 leading-relaxed">
              Submitting false claims to the blockchain is a violation of the AutoTrust terms of service. This action is immutable.
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
            <Button type="submit" variant="danger" onClick={handleSubmit} className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting to Blockchain...' : 'Record on Blockchain'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
