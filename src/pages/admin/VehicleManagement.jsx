import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Plus, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getContract, getContractWithSigner , getAllEvents } from '../../lib/ethereum';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';

export default function VehicleManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [vId, setVId] = useState('');
  const [regNum, setRegNum] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [colorUI, setColorUI] = useState('');
  const [year, setYear] = useState('');
  const [owner, setOwner] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      let events = [];
      try {
        events = await getAllEvents(contract, contract.filters.VehicleRegistered());
      } catch (e) {
        console.warn("Broad query limit hit, defaulting to empty or mock. You should use a better RPC for full list.", e.message);
      }
      
      const loaded = [];
      for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i];
        const rNum = ev.args[0];
        
        // Skip duplicates (keep most recent)
        if (loaded.find(o => o.registrationNumber === rNum)) continue;

        // Fetch current vehicle info directly
        try {
          const vData = await contract.getVehicle(rNum);
          loaded.push({
            registrationNumber: vData.registrationNumber,
            vehicleId: vData.vehicleId,
            model: vData.model,
            manufacturingYear: vData.manufacturingYear.toString(),
            currentOwner: vData.currentOwner,
            currentOwnerName: vData.currentOwnerName,
            txHash: ev.transactionHash
          });
        } catch(e) {
          console.error(e);
        }
      }
      setVehicles(loaded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setTxHash(null);
      setSubmitting(true);
      if (!vId || !regNum || !model || !year || !owner || !ownerName) {
        throw new Error("All required fields (*) must be filled.");
      }

      const contract = await getContractWithSigner();
      
      const adminAddr = await contract.admin();
      const signerAddr = await contract.runner.getAddress();
      if (adminAddr.toLowerCase() !== signerAddr.toLowerCase()) {
        throw new Error("Only the Admin can register vehicles. Please switch to the Admin wallet in MetaMask.");
      }

      const tx = await contract.registerVehicle(
        vId.trim(),
        regNum.trim().toUpperCase(),
        manufacturer.trim(),
        model.trim(),
        colorUI.trim(),
        fuelType.trim(),
        chassisNumber.trim(),
        engineNumber.trim(),
        parseInt(year),
        owner.trim(),
        ownerName.trim()
      );

      setTxHash(tx.hash);
      await tx.wait();
      
      setShowForm(false);
      setVId(''); setRegNum(''); setModel(''); setYear(''); setOwner(''); setOwnerName('');
      fetchVehicles();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.info?.error?.message || err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = vehicles.filter(v =>
    `${v.registrationNumber} ${v.model}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Management"
        subtitle="Register and manage vehicles on the blockchain."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Vehicles' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(p => !p)}>
            <Plus className="h-4 w-4" />Register Vehicle
          </Button>
        }
      />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-brand-600/30">
            <CardHeader>
              <CardTitle>Register New Vehicle</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Registration Number *</label>
                  <input required value={regNum} onChange={e=>setRegNum(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="MH12AB1234" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Vehicle ID (VIN) *</label>
                  <input required value={vId} onChange={e=>setVId(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="VIN..." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Manufacturer *</label>
                  <input required value={manufacturer} onChange={e=>setManufacturer(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Honda" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Model *</label>
                  <input required value={model} onChange={e=>setModel(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Civic" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Manufacturing Year *</label>
                  <input required value={year} onChange={e=>setYear(e.target.value)} type="number" className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="2022" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Color</label>
                  <input value={colorUI} onChange={e=>setColorUI(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Silver" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Fuel Type</label>
                  <input value={fuelType} onChange={e=>setFuelType(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Petrol" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Chassis Number</label>
                  <input value={chassisNumber} onChange={e=>setChassisNumber(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="CH..." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Engine Number</label>
                  <input value={engineNumber} onChange={e=>setEngineNumber(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="EN..." />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Initial Owner Wallet *</label>
                  <input required value={owner} onChange={e=>setOwner(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none" placeholder="0x..." />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Initial Owner Name *</label>
                  <input required value={ownerName} onChange={e=>setOwnerName(e.target.value)} className="w-full bg-surface-200 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none" placeholder="Alice" />
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
                  {submitting ? 'Processing...' : 'Register on Blockchain'}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by registration or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-300 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No vehicles found on-chain.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => (
            <motion.div key={v.registrationNumber} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border hover:border-white/10 transition-colors cursor-pointer group" onClick={() => navigate(`/verify/${v.registrationNumber}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-brand-400" />
                  </div>
                  <Badge variant="verified" size="sm">On-chain</Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">{v.registrationNumber}</h3>
                <p className="text-sm text-slate-400 mb-4">{v.model} • {v.manufacturingYear}</p>
                
                <div className="pt-4 border-t border-white/[0.05]">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-xs text-slate-500">Owner Name</p>
                    <p className="text-sm text-slate-300 font-medium">{v.currentOwnerName || 'Unknown'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-slate-500">Wallet</p>
                    <p className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{v.currentOwner}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
