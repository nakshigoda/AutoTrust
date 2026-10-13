import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Car, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Wrench, Activity, FileText, Building2, TrendingUp, User,
  ExternalLink, Hash, Calendar, Gauge, DollarSign, Clock,
  ChevronRight, ChevronDown, Info,
} from 'lucide-react';
import { findVehicleByRegNumber, getVehicleHistory, mockOrganizations } from '../../data/mockData';
import { getContract , getAllEvents } from '../../lib/ethereum';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: Car },
  { id: 'service',    label: 'Service History', icon: Wrench },
  { id: 'mileage',    label: 'Mileage',         icon: Gauge },
  { id: 'accidents',  label: 'Accidents',       icon: AlertTriangle },
  { id: 'ownership',  label: 'Ownership',       icon: User },
  { id: 'blockchain', label: 'Blockchain',      icon: Activity },
];

function shortenHash(hash, len = 16) {
  if (!hash) return '—';
  return `${hash.slice(0, len)}...${hash.slice(-8)}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n) {
  return `₹${n?.toLocaleString('en-IN') || '0'}`;
}

export default function VehiclePassport() {
  const { regNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        let v = findVehicleByRegNumber(regNumber) || {};
        let h = v.id ? getVehicleHistory(v.id) : { ownership: [], service: [], mileage: [], accidents: [] };
        
        let contract;
        try {
          contract = await getContract();
        } catch (err) {
          throw new Error(err.message || "Failed to connect to blockchain provider.");
        }

        const cleanReg = regNumber.toUpperCase().replace(/\s+/g, '');
        const isRegistered = await contract.isVehicleRegistered(cleanReg);
        
        if (isRegistered) {
          const onChainV = await contract.getVehicle(cleanReg);
          const onChainServices = await contract.getServiceRecords(cleanReg);
          const onChainAccidents = await contract.getAccidentRecords(cleanReg);
          const onChainOwnership = await contract.getOwnershipHistory(cleanReg);
          
          let regEvents = [], sEvents = [], aEvents = [], oEvents = [];
          try {
            const rAll = await getAllEvents(contract, contract.filters.VehicleRegistered());
            regEvents = rAll.filter(e => e.args[0] === cleanReg);
            const sAll = await getAllEvents(contract, contract.filters.ServiceAdded());
            sEvents = sAll.filter(e => e.args[0] === cleanReg);
            const aAll = await getAllEvents(contract, contract.filters.AccidentAdded());
            aEvents = aAll.filter(e => e.args[0] === cleanReg);
            const oAll = await getAllEvents(contract, contract.filters.OwnershipTransferred());
            oEvents = oAll.filter(e => e.args[0] === cleanReg);
          } catch (err) {
            console.warn("Query blocked by RPC limit:", err.message);
          }

          v = {
            ...v,
            id: onChainV.vehicleId,
            registrationNumber: onChainV.registrationNumber,
            model: onChainV.model,
            year: Number(onChainV.manufacturingYear),
            currentOwner: {
              name: onChainV.currentOwnerName || "Unknown Owner",
              wallet: onChainV.currentOwner,
              since: new Date(Number(onChainV.registrationTimestamp) * 1000).toISOString(),
            },
            registeredAt: new Date(Number(onChainV.registrationTimestamp) * 1000).toISOString(),
            manufacturer: onChainV.manufacturer || v.manufacturer || 'Unknown',
            color: onChainV.color || v.color || 'Unknown',
            fuelType: onChainV.fuelType || v.fuelType || 'Unknown',
            chassisNumber: onChainV.chassisNumber || v.chassisNumber || '',
            engineNumber: onChainV.engineNumber || v.engineNumber || '',
            txHash: regEvents.length > 0 ? regEvents[0].transactionHash : 'Unknown TX',
            blockNumber: regEvents.length > 0 ? regEvents[0].blockNumber : '—',
          };

          h.service = await Promise.all(onChainServices.map(async (r, i) => {
            const ev = sEvents[i];
            const verified = await contract.isServiceCenter(r.serviceCenter);
            const orgName = verified ? await contract.organizationNames(r.serviceCenter) : null;
            return {
              id: `chain-sr-${i}`,
              vehicleId: onChainV.vehicleId,
              type: r.serviceType.toLowerCase().replace(' ', '_'),
              label: r.serviceType,
              date: new Date(Number(r.date) * 1000).toISOString(),
              mileage: Number(r.mileage),
              cost: Number(r.cost),
              description: verified ? 'Verified on-chain service record.' : 'Warning: Submitted by an unauthorized or revoked organization.',
              organization: { name: verified ? (orgName || "Verified Service Center") : "Unverified Organization", type: 'service_center', wallet: r.serviceCenter },
              documentHash: r.documentHash,
              txHash: ev ? ev.transactionHash : 'Unknown TX',
              blockNumber: ev ? ev.blockNumber : '—',
              verified
            };
          }));

          const onChainMileage = onChainServices.map((r, i) => {
            const ev = sEvents[i];
            return {
              id: `chain-ml-${i}`,
              vehicleId: onChainV.vehicleId,
              reading: Number(r.mileage),
              date: new Date(Number(r.date) * 1000).toISOString(),
              source: 'Service Record',
              txHash: ev ? ev.transactionHash : 'Unknown TX',
              blockNumber: ev ? ev.blockNumber : '—',
              anomaly: false
            };
          });
          h.mileage = [...h.mileage.filter(m => m.source !== 'Service Record'), ...onChainMileage].sort((a,b) => new Date(a.date) - new Date(b.date));

          h.accidents = await Promise.all(onChainAccidents.map(async (r, i) => {
            const ev = aEvents[i];
            const verified = await contract.isInsuranceCompany(r.insuranceCompany);
            const orgName = verified ? await contract.organizationNames(r.insuranceCompany) : null;
            return {
              id: `chain-ac-${i}`,
              vehicleId: onChainV.vehicleId,
              incidentType: 'Accident',
              date: new Date(Number(r.date) * 1000).toISOString(),
              location: r.accidentLocation || 'Unknown Location',
              damageDescription: r.damageDescription,
              repairCost: Number(r.repairCost),
              claimAmount: Number(r.claimAmount) || 0,
              claimStatus: 'settled',
              organization: { name: verified ? (orgName || "Verified Insurer") : "Unverified Organization", type: 'insurance', wallet: r.insuranceCompany },
              documentHash: r.documentHash,
              txHash: ev ? ev.transactionHash : 'Unknown TX',
              blockNumber: ev ? ev.blockNumber : '—',
              verified
            };
          }));

          h.ownership = onChainOwnership.map((r, i) => {
            const ev = i === 0 ? regEvents[0] : oEvents[i - 1];
            return {
              id: `chain-oh-${i}`,
              vehicleId: onChainV.vehicleId,
              from: { name: r.fromName || (i === 0 ? 'Manufacturer' : 'Previous Owner'), wallet: r.from },
              to: { name: r.toName || (i === 0 ? 'Original Owner' : 'New Owner'), wallet: r.to },
              date: new Date(Number(r.timestamp) * 1000).toISOString(),
              txHash: ev ? ev.transactionHash : 'Unknown TX',
              blockNumber: ev ? ev.blockNumber : '—',
              reason: i === 0 ? 'Original Registration' : 'Ownership Transfer'
            };
          });

          if (h.ownership.length > 0) {
            v.currentOwner.since = h.ownership[h.ownership.length - 1].date;
          }
        } else if (!v.id) {
          v = null;
        }

        if (v) {
          v.organizations = [
            ...h.service.map(r => r.organization),
            ...h.accidents.map(r => r.organization)
          ].filter((org, i, arr) => arr.findIndex(t => t.wallet === org.wallet) === i);
        }

        if (active) {
          setVehicle(v);
          if (v) setHistory(h);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [regNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <PageLoader message="Loading Vehicle Digital Passport..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-danger" />
        <div>
          <p className="text-white font-bold text-xl mb-2">Error Connecting to Blockchain</p>
          <p className="text-slate-400 max-w-md mx-auto text-sm">{error}</p>
        </div>
        <button onClick={() => navigate('/')} className="text-brand-400 hover:underline text-sm mt-4">← Back to Home</button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-6 px-6">
        <XCircle className="h-12 w-12 text-danger" />
        <p className="text-white font-bold text-xl">Vehicle not found</p>
        <button onClick={() => navigate('/')} className="text-brand-400 hover:underline text-sm">← Back to search</button>
      </div>
    );
  }

  const anomalyCount = history.mileage.filter(m => m.anomaly).length;

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header band */}
      <div className="relative bg-gradient-to-br from-surface-100 to-surface-0 border-b border-white/[0.06] px-6 pt-8 pb-0">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Back
          </button>

          {/* Passport top card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            {/* Car icon */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 border border-brand-600/40 flex items-center justify-center shadow-glow-brand">
                <Car className="h-9 w-9 text-brand-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success/20 border-2 border-surface-0 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="verified" dot size="sm">Blockchain Verified</Badge>
                {anomalyCount > 0 && (
                  <Badge variant="anomaly" dot size="sm">⚠ Mileage Anomaly</Badge>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {vehicle.manufacturer && vehicle.manufacturer !== 'Unknown' && !vehicle.model.toLowerCase().includes(vehicle.manufacturer.toLowerCase()) ? `${vehicle.manufacturer} ` : ''}{vehicle.model}
              </h1>
              <p className="text-slate-400 mt-0.5">
                {vehicle.year} · {vehicle.color} · {vehicle.fuelType}
              </p>
            </div>

            {/* Reg badge */}
            <div className="shrink-0 text-right">
              <div className="inline-block px-5 py-3 rounded-xl bg-surface-200 border border-white/10">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">Registration</p>
                <p className="text-xl font-black font-mono text-white tracking-wider">{vehicle.registrationNumber}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 shrink-0 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === 'accidents' && history.accidents.length > 0 && (
                  <span className="ml-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-danger/20 text-danger text-[10px] font-bold">
                    {history.accidents.length}
                  </span>
                )}
                {tab.id === 'mileage' && anomalyCount > 0 && (
                  <span className="ml-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-warning/20 text-warning text-[10px] font-bold">
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {activeTab === 'overview'   && <OverviewTab   vehicle={vehicle} history={history} />}
          {activeTab === 'service'    && <ServiceTab    records={history.service} />}
          {activeTab === 'mileage'    && <MileageTab    records={history.mileage} />}
          {activeTab === 'accidents'  && <AccidentsTab  records={history.accidents} />}
          {activeTab === 'ownership'  && <OwnershipTab  vehicle={vehicle} history={history.ownership} />}
          {activeTab === 'blockchain' && <BlockchainTab vehicle={vehicle} history={history} />}
        </motion.div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ vehicle, history }) {
  const anomalyCount = history.mileage.filter(m => m.anomaly).length;
  const latestMileage = history.mileage.filter(m => !m.anomaly).at(-1);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Wrench,       label: 'Service Records',  value: history.service.length,   color: 'text-brand-400',  bg: 'bg-brand-600/15' },
          { icon: AlertTriangle,label: 'Accidents',         value: history.accidents.length, color: 'text-danger',     bg: 'bg-danger/10'    },
          { icon: User,         label: 'Owners',            value: history.ownership.length + 1, color: 'text-purple-400', bg: 'bg-purple-600/10' },
          { icon: Gauge,        label: 'Last Mileage',      value: latestMileage ? `${latestMileage.reading.toLocaleString()} km` : '—', color: 'text-gold-400', bg: 'bg-gold-500/10' },
        ].map((s, i) => (
          <Card key={i} className="flex items-start gap-3">
            <div className={cn('rounded-lg p-2 shrink-0', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {anomalyCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/25">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Mileage Anomaly Detected</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {anomalyCount} mileage reading{anomalyCount > 1 ? 's' : ''} appear lower than previously verified blockchain records.
              This may indicate odometer rollback. See the Mileage tab for details.
            </p>
          </div>
        </div>
      )}

      {/* Vehicle details */}
      <Card>
        <CardHeader><CardTitle>Vehicle Identity</CardTitle></CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          {[
            { label: 'Chassis Number', value: vehicle.chassisNumber },
            { label: 'Engine Number', value: vehicle.engineNumber },
            { label: 'Manufacturer', value: vehicle.manufacturer },
            { label: 'Model', value: vehicle.model },
            { label: 'Year', value: vehicle.year },
            { label: 'Color', value: vehicle.color },
            { label: 'Fuel Type', value: vehicle.fuelType },
            { label: 'Registration Date', value: formatDate(vehicle.registeredAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className="text-sm text-white font-medium break-all">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Current owner */}
      <Card>
        <CardHeader><CardTitle>Current Owner</CardTitle></CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white">{vehicle.currentOwner.name}</p>
            <p className="hash-text mt-0.5">{vehicle.currentOwner.wallet}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Owner since</p>
            <p className="text-sm text-white font-medium">{formatDate(vehicle.currentOwner.since)}</p>
          </div>
        </div>
      </Card>

      {/* Verified organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Organizations</CardTitle>
          <Badge variant="verified" size="xs">All Active</Badge>
        </CardHeader>
        <div className="space-y-3">
          {vehicle.organizations && vehicle.organizations.length > 0 ? vehicle.organizations.map((org, idx) => (
            <div key={org.wallet + idx} className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0">
              <div className="h-8 w-8 rounded-lg bg-surface-300 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{org.name}</p>
                <p className="hash-text">{org.wallet}</p>
              </div>
              <Badge variant={org.type} size="xs">{org.type.replace('_', ' ')}</Badge>
              {org.name.includes('Unverified') ? (
                <Badge variant="warning" size="xs" dot>Unverified</Badge>
              ) : (
                <Badge variant="verified" size="xs" dot>Verified</Badge>
              )}
            </div>
          )) : (
            <p className="text-sm text-slate-500">No organizations found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── SERVICE TAB ──────────────────────────────────────────────────────────────
function ServiceTab({ records }) {
  if (!records.length) return <EmptyState icon={Wrench} title="No service records" description="No service or repair records have been submitted for this vehicle." />;

  const typeColors = {
    general_service: 'bg-brand-600/15 text-brand-400',
    oil_change:      'bg-gold-500/10 text-gold-400',
    repair:          'bg-purple-600/10 text-purple-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{records.length} Record{records.length !== 1 ? 's' : ''}</h2>
        <Badge variant="blockchain">{records.length} on-chain</Badge>
      </div>
      {records.map((rec, i) => (
        <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card>
            <div className="flex flex-wrap items-start gap-4">
              <div className={cn('rounded-xl p-3 shrink-0', typeColors[rec.type] || 'bg-surface-300 text-slate-400')}>
                <Wrench className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-base font-semibold text-white">{rec.label}</h3>
                  {rec.verified ? <Badge variant="verified" size="xs" dot>Verified</Badge> : <Badge variant="warning" size="xs" dot>Unverified</Badge>}
                </div>
                <p className="text-sm text-slate-400 mb-3">{rec.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(rec.date)}</span>
                  <span className="flex items-center gap-1.5"><Gauge className="h-3 w-3" />{rec.mileage.toLocaleString()} km</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" />{formatCurrency(rec.cost)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 mb-1">Organization</p>
                <p className="text-sm text-white font-medium">{rec.organization.name}</p>
                <div className="mt-1">
                  <Badge variant={rec.organization.type} size="xs">{rec.organization.type.replace('_',' ')}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-2">
              <p className="hash-text text-brand-400/70">TX: {shortenHash(rec.txHash)}</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${rec.txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
              >
                <ExternalLink className="h-3 w-3" />View on Etherscan
              </a>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── MILEAGE TAB ──────────────────────────────────────────────────────────────
function MileageTab({ records }) {
  if (!records.length) return <EmptyState icon={Gauge} title="No mileage records" />;
  const anomalies = records.filter(r => r.anomaly);

  return (
    <div className="space-y-4">
      {anomalies.length > 0 && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger mb-1">⚠ MILEAGE ANOMALY DETECTED</p>
            <p className="text-xs text-slate-400">
              {anomalies.length} reading{anomalies.length > 1 ? 's' : ''} found lower than a previously verified blockchain record.
              Blockchain preserves all submitted readings — the inconsistency is detected by comparing against the immutable record.
              This may indicate odometer rollback or data entry error.
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Timeline */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-surface-400" />
        <div className="space-y-4">
          {records.map((rec, i) => {
            const prev = records[i - 1];
            const delta = prev ? rec.reading - prev.reading : null;

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'relative pl-10',
                )}
              >
                {/* Dot */}
                <div className={cn(
                  'absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-surface-0 -translate-x-1/2',
                  rec.anomaly ? 'bg-danger' : 'bg-brand-500',
                )} />

                <Card className={cn(rec.anomaly && 'border-danger/30 bg-danger/5')}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl font-bold text-white">{rec.reading.toLocaleString()} km</span>
                        {rec.anomaly
                          ? <Badge variant="anomaly" size="sm">⚠ Anomaly</Badge>
                          : <Badge variant="verified" size="xs" dot>Verified</Badge>
                        }
                      </div>
                      {delta !== null && (
                        <p className={cn(
                          'text-xs font-medium',
                          delta < 0 ? 'text-danger' : 'text-success',
                        )}>
                          {delta < 0 ? '▼' : '▲'} {Math.abs(delta).toLocaleString()} km {delta < 0 ? '(lower than previous record!)' : 'since last record'}
                        </p>
                      )}
                      {rec.anomaly && (
                        <p className="text-xs text-danger/80 mt-1">{rec.anomalyNote}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">Source</p>
                      <p className="text-sm text-white font-medium">{rec.source}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(rec.date)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <p className="hash-text text-brand-400/70">Block #{rec.blockNumber.toLocaleString()}</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${rec.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
                    >
                      <ExternalLink className="h-3 w-3" />Etherscan
                    </a>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ACCIDENTS TAB ────────────────────────────────────────────────────────────
function AccidentsTab({ records }) {
  if (!records.length) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <div className="h-16 w-16 rounded-2xl bg-success/10 border border-success/25 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-base font-semibold text-white">No Accidents Recorded</h3>
      <p className="text-sm text-slate-500">No accident or insurance claims have been submitted for this vehicle.</p>
      <Badge variant="verified" dot>Clean Record</Badge>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/25">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <p className="text-xs text-slate-400">{records.length} accident or insurance claim{records.length !== 1 ? 's' : ''} found on record.</p>
      </div>
      {records.map((rec, i) => (
        <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Card className="border-warning/20">
            <div className="flex flex-wrap items-start gap-4">
              <div className="rounded-xl p-3 bg-warning/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-white">{rec.incidentType}</h3>
                  <Badge variant={rec.claimStatus === 'settled' ? 'settled' : 'pending'} size="xs">
                    {rec.claimStatus}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-3">{rec.damageDescription}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><p className="text-slate-500">Date</p><p className="text-white font-medium mt-0.5">{formatDate(rec.date)}</p></div>
                  <div><p className="text-slate-500">Location</p><p className="text-white font-medium mt-0.5">{rec.location}</p></div>
                  <div><p className="text-slate-500">Repair Cost</p><p className="text-white font-medium mt-0.5">{formatCurrency(rec.repairCost)}</p></div>
                  <div><p className="text-slate-500">Claim Amount</p><p className="text-white font-medium mt-0.5">{formatCurrency(rec.claimAmount)}</p></div>
                  <div><p className="text-slate-500">Insurer</p><p className="text-white font-medium mt-0.5">{rec.organization.name}</p></div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-2">
              <p className="hash-text text-brand-400/70">TX: {shortenHash(rec.txHash)}</p>
              <a href={`https://sepolia.etherscan.io/tx/${rec.txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300">
                <ExternalLink className="h-3 w-3" />View on Etherscan
              </a>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── OWNERSHIP TAB ────────────────────────────────────────────────────────────
function OwnershipTab({ vehicle, history }) {
  const hasCurrentOwnerInHistory = history.length > 0 && history[history.length - 1].to.wallet === vehicle.currentOwner.wallet;

  const allOwners = hasCurrentOwnerInHistory ? history : [
    ...history,
    {
      id: 'current',
      from: { name: history[history.length - 1]?.to?.name || 'Previous Owner', wallet: history[history.length - 1]?.to?.wallet || '—' },
      to: vehicle.currentOwner,
      date: vehicle.currentOwner.since,
      reason: 'Current Owner',
      txHash: vehicle.txHash,
      blockNumber: vehicle.blockNumber,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-4 bottom-4 w-px bg-surface-400" />
        <div className="space-y-4">
          {allOwners.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="relative pl-10">
              <div className={cn(
                'absolute left-2.5 top-5 h-3 w-3 rounded-full border-2 border-surface-0 -translate-x-1/2',
                i === allOwners.length - 1 ? 'bg-success' : 'bg-brand-500',
              )} />
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {i === allOwners.length - 1
                        ? <Badge variant="verified" dot size="sm">Current Owner</Badge>
                        : <Badge variant="default" size="sm">Transfer #{i + 1}</Badge>
                      }
                      <span className="text-xs text-slate-500">{entry.reason}</span>
                    </div>
                    <p className="text-base font-bold text-white">{entry.to.name}</p>
                    <p className="hash-text mt-0.5">{entry.to.wallet}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm text-white font-medium">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-2">
                  <p className="hash-text text-brand-400/70">Block #{entry.blockNumber?.toLocaleString()}</p>
                  <a href={`https://sepolia.etherscan.io/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300">
                    <ExternalLink className="h-3 w-3" />Etherscan
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BLOCKCHAIN TAB ───────────────────────────────────────────────────────────
function BlockchainTab({ vehicle, history }) {
  const events = [
    { label: 'VehicleRegistered', hash: vehicle.txHash, block: vehicle.blockNumber, date: vehicle.registeredAt, type: 'registration' },
    ...history.service.map(r => ({ label: 'ServiceRecordAdded', hash: r.txHash, block: r.blockNumber, date: r.date, type: 'service' })),
    ...history.mileage.map(r => ({ label: 'MileageRecorded', hash: r.txHash, block: r.blockNumber, date: r.date, type: 'mileage' })),
    ...history.accidents.map(r => ({ label: 'AccidentRecorded', hash: r.txHash, block: r.blockNumber, date: r.date, type: 'accident' })),
  ].sort((a, b) => b.block - a.block);

  const typeColors = {
    registration: 'text-success bg-success/10',
    service:      'text-brand-400 bg-brand-600/10',
    mileage:      'text-gold-400 bg-gold-500/10',
    accident:     'text-danger bg-danger/10',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-surface-200 border border-white/[0.05]">
          <p className="text-xs text-slate-500 mb-1">Network</p>
          <p className="text-sm font-semibold text-white">Sepolia Testnet</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-200 border border-white/[0.05]">
          <p className="text-xs text-slate-500 mb-1">Smart Contract</p>
          <p className="text-sm font-semibold text-white">AutoTrust</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-200 border border-white/[0.05]">
          <p className="text-xs text-slate-500 mb-1">Data Integrity</p>
          <p className="text-sm font-semibold text-white">Blockchain-backed</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-200 border border-white/[0.05]">
          <p className="text-xs text-slate-500 mb-1">Verification</p>
          <p className="text-sm font-semibold text-white">On-chain</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{events.length} Blockchain Events</h2>
        <Badge variant="blockchain">{events.length} transactions</Badge>
      </div>
      <div className="card overflow-hidden divide-y divide-white/[0.05]">
        {events.map((ev, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap', typeColors[ev.type])}>
              {ev.label}
            </span>
            <div className="flex-1 min-w-0">
              <p className="hash-text text-brand-400/80 truncate">{ev.hash}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-400">#{ev.block?.toLocaleString()}</p>
              <p className="text-[10px] text-slate-600">{formatDate(ev.date)}</p>
            </div>
            <a href={`https://sepolia.etherscan.io/tx/${ev.hash}`} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-slate-500 hover:text-brand-400 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── DOCUMENTS TAB ────────────────────────────────────────────────────────────
function DocumentsTab({ history }) {
  const docs = [
    ...history.service.map(r => ({ ...r, docType: 'Service Document', source: r.label })),
    ...history.accidents.map(r => ({ ...r, docType: 'Insurance Claim Document', source: r.incidentType })),
  ];

  if (!docs.length) return <EmptyState icon={FileText} title="No documents" description="No documents have been submitted for this vehicle." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-info/10 border border-info/25">
        <Info className="h-4 w-4 text-info shrink-0" />
        <p className="text-xs text-slate-400">
          Document integrity is verified by comparing the SHA-256 hash of the original file against the hash stored immutably on the blockchain.
          Documents are not stored on-chain — only their hashes are.
        </p>
      </div>
      <div className="space-y-3">
        {docs.map((doc, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex items-start gap-4">
              <div className="rounded-xl p-3 bg-success/10 shrink-0">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-white">{doc.source}</p>
                  <Badge variant="verified" size="xs" dot>✓ DOCUMENT VERIFIED</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">{doc.docType} · {formatDate(doc.date)}</p>
                <p className="text-xs text-slate-500 mb-0.5">SHA-256 Hash (on-chain)</p>
                <p className="hash-text text-success/70">{doc.documentHash}</p>
              </div>
              <div className="shrink-0">
                <button className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors px-3 py-1.5 rounded-lg border border-brand-500/30 hover:border-brand-500/60">
                  Verify Document
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
