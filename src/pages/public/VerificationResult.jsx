import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Search, ArrowLeft, Shield, Car,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import { findVehicleByRegNumber } from '../../data/mockData';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { getContract , getAllEvents } from '../../lib/ethereum';
import { cn } from '../../lib/utils';

export default function VerificationResult() {
  const { regNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [searchInput, setSearchInput] = useState(regNumber || '');

  useEffect(() => {
    let active = true;
    async function verifyVehicle() {
      try {
        setLoading(true);
        let v = findVehicleByRegNumber(regNumber) || {};
        
        let contract;
        try {
          contract = await getContract();
        } catch (err) {
          console.warn("Could not load contract:", err.message);
          // If contract fails, we just rely on mock data
        }

        if (contract) {
          const cleanReg = regNumber.toUpperCase().replace(/\s+/g, '');
          const isRegistered = await contract.isVehicleRegistered(cleanReg);
          
          if (isRegistered) {
            const onChainV = await contract.getVehicle(cleanReg);
            
            // Fetch registration event to get transaction hash and block number
            let regEvents = [];
            try {
                const regEventsAll = await getAllEvents(contract, contract.filters.VehicleRegistered());
                regEvents = regEventsAll.filter(e => e.args[0] === cleanReg);
              } catch (err) { console.warn("Query blocked by RPC limit"); }
            const regEv = regEvents.length > 0 ? regEvents[0] : null;

            v = {
              ...v,
              registrationNumber: onChainV.registrationNumber,
              manufacturer: onChainV.manufacturer || v.manufacturer || 'Unknown',
              model: onChainV.model,
              year: Number(onChainV.manufacturingYear),
              color: onChainV.color || v.color || 'Unknown',
              fuelType: onChainV.fuelType || v.fuelType || 'Unknown',
              registeredAt: new Date(Number(onChainV.registrationTimestamp) * 1000).toLocaleDateString('en-IN'),
              currentOwner: {
                name: v.currentOwner?.name || 'On-chain Owner',
                wallet: onChainV.currentOwner,
                since: new Date(Number(onChainV.registrationTimestamp) * 1000).toLocaleDateString('en-IN'),
              },
              blockNumber: regEv ? regEv.blockNumber : '—',
              txHash: regEv ? regEv.transactionHash : 'Unknown TX',
            };
          } else if (!v.registrationNumber) {
            v = null;
          }
        } else if (!v.registrationNumber) {
          v = null;
        }

        if (active) {
          setVehicle(v);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }
    verifyVehicle();
    return () => { active = false; };
  }, [regNumber]);

  function handleSearch(e) {
    e.preventDefault();
    const cleaned = searchInput.trim().toUpperCase().replace(/\s+/g, '');
    if (cleaned) navigate(`/verify/${cleaned}`);
  }

  return (
    <div className="min-h-screen bg-surface-0 px-6 py-10">
      {/* Top nav */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Verify
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-bold text-white">AutoTrust</span>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-100 border border-white/[0.08] focus-within:border-brand-500/60">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none font-mono"
              placeholder="Search another registration number..."
            />
          </div>
          <Button type="submit" variant="primary">Verify</Button>
        </form>

        {loading && (
          <div className="py-20">
            <PageLoader message={`Querying blockchain for ${regNumber}...`} />
          </div>
        )}

        {!loading && !vehicle && <NotFound regNumber={regNumber} />}
        {!loading && vehicle && <VerifiedCard vehicle={vehicle} navigate={navigate} />}
      </div>
    </div>
  );
}

function VerifiedCard({ vehicle, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Status banner */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-success/10 border border-success/25 mb-6">
        <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div>
          <p className="text-xs font-semibold text-success uppercase tracking-widest mb-0.5">✓ Vehicle Verified</p>
          <p className="text-white font-bold text-xl">{vehicle.registrationNumber}</p>
          <p className="text-sm text-slate-400">
            {vehicle.manufacturer && vehicle.manufacturer !== 'Unknown' && !vehicle.model.toLowerCase().includes(vehicle.manufacturer.toLowerCase()) ? `${vehicle.manufacturer} ` : ''}{vehicle.model} · {vehicle.year}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <Badge variant="verified" dot>Blockchain Verified</Badge>
          <p className="text-[10px] text-slate-500">Block #{vehicle.blockNumber.toLocaleString()}</p>
        </div>
      </div>

      {/* Vehicle summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Manufacturer', value: vehicle.manufacturer },
          { label: 'Model', value: vehicle.model },
          { label: 'Year', value: vehicle.year },
          { label: 'Color', value: vehicle.color },
          { label: 'Fuel Type', value: vehicle.fuelType },
          { label: 'Reg. Date', value: vehicle.registeredAt },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Current owner */}
      <div className="card p-5 mb-6">
        <p className="section-title mb-3">Current Owner</p>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
            <Car className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{vehicle.currentOwner.name}</p>
            <p className="hash-text mt-0.5">{vehicle.currentOwner.wallet}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">Owner since</p>
            <p className="text-sm text-slate-300 font-medium">{vehicle.currentOwner.since}</p>
          </div>
        </div>
      </div>

      {/* TX hash */}
      <div className="card p-5 mb-8 bg-surface-200/50">
        <p className="section-title mb-3">Registration Transaction</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="hash-text text-brand-400/80 flex-1">{vehicle.txHash}</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${vehicle.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            View on Etherscan
          </a>
        </div>
      </div>

      {/* CTA to full passport */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={() => navigate(`/passport/${vehicle.registrationNumber}`)}
        >
          <Shield className="h-4 w-4" />
          View Full Digital Passport
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          Verify Another Vehicle
        </Button>
      </div>
    </motion.div>
  );
}

function NotFound({ regNumber }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-20 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-danger/10 border border-danger/25 flex items-center justify-center mb-6">
        <XCircle className="h-8 w-8 text-danger" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Vehicle Not Found</h2>
      <p className="text-sm text-slate-400 mb-1">
        No vehicle with registration number <span className="font-mono text-white">{regNumber}</span> was found on the blockchain.
      </p>
      <p className="text-xs text-slate-600 max-w-xs mb-8">
        This may mean the vehicle hasn't been registered on AutoTrust yet, or the registration number is incorrect.
      </p>
      <div className="flex gap-3">
        <Badge variant="info">Not Registered</Badge>
        <Badge variant="default">No Blockchain Record</Badge>
      </div>
    </motion.div>
  );
}
