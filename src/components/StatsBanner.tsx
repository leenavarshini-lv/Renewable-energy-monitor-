import React from 'react';
import { collectionsData } from '../data/allCollections';
import { Sun, Wind, Droplet, Battery, Users, Leaf, IndianRupee, ShieldAlert } from 'lucide-react';

export const StatsBanner: React.FC = () => {
  // Compute realistic metrics
  const solarCount = collectionsData.plants.filter(p => p.type === 'SOLAR').length;
  const windCount = collectionsData.plants.filter(p => p.type === 'WIND').length;
  const hydroCount = collectionsData.plants.filter(p => p.type === 'HYDRO').length;

  const totalCapacityMw = (
    collectionsData.plants.reduce((sum, p) => sum + p.capacityKw, 0) / 1000
  ).toFixed(1);

  const totalBatteryKwh = collectionsData.batteries.reduce((sum, b) => sum + b.capacityKwh, 0);
  const avgBatteryCharge = Math.round(
    collectionsData.batteries.reduce((sum, b) => sum + b.chargePct, 0) / collectionsData.batteries.length
  );

  const solarProsumers = collectionsData.consumers.filter(c => c.hasSolar).length;
  const totalConsumers = collectionsData.consumers.length;

  const emissionFactor = collectionsData.config.find(c => c.key === 'emissionFactor')?.value || 0.71;
  const totalGenerationKwh = collectionsData.generation.reduce((sum, g) => sum + g.unitsKwh, 0);
  const totalAvoidedCo2Tonnes = ((totalGenerationKwh * emissionFactor) / 1000).toFixed(1);

  const paidBillsCount = collectionsData.bills.filter(b => b.status === 'PAID').length;
  const totalBilledRevenue = collectionsData.bills
    .reduce((sum, b) => sum + b.amount, 0)
    .toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const activeAlerts = collectionsData.alerts.filter(a => !a.resolved).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Generation Capacity */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Grid Capacity</span>
          <div className="flex space-x-1 text-xs">
            <span title="Solar" className="text-amber-400 flex items-center"><Sun className="w-3 h-3 mr-0.5" />{solarCount}</span>
            <span title="Wind" className="text-sky-400 flex items-center"><Wind className="w-3 h-3 mr-0.5" />{windCount}</span>
            <span title="Hydro" className="text-cyan-400 flex items-center"><Droplet className="w-3 h-3 mr-0.5" />{hydroCount}</span>
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {totalCapacityMw} <span className="text-xs text-slate-400 font-normal">MW</span>
        </div>
        <div className="text-[11px] text-emerald-400 mt-1 flex items-center">
          120 Power Plants in India
        </div>
      </div>

      {/* 2. Batteries BESS */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">BESS Storage</span>
          <Battery className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {(totalBatteryKwh / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">MWh</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Avg State of Charge: <span className="text-emerald-400 font-semibold">{avgBatteryCharge}%</span>
        </div>
      </div>

      {/* 3. Consumers & Solar Prosumers */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Consumers</span>
          <Users className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {totalConsumers} <span className="text-xs text-slate-400 font-normal">Total</span>
        </div>
        <div className="text-[11px] text-amber-300 mt-1">
          {solarProsumers} with Rooftop Solar ({(solarProsumers/totalConsumers*100).toFixed(0)}%)
        </div>
      </div>

      {/* 4. Carbon CO2 Avoided */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">CO₂ Avoided</span>
          <Leaf className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-xl font-bold text-emerald-400 tracking-tight">
          {totalAvoidedCo2Tonnes} <span className="text-xs text-slate-400 font-normal">tCO₂e</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          CEA factor: 0.71 kg/kWh
        </div>
      </div>

      {/* 5. Net Metering Revenue */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Net Billed Rev</span>
          <IndianRupee className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          ₹{totalBilledRevenue}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Paid: <span className="text-emerald-400 font-semibold">{paidBillsCount}</span> / 120 bills
        </div>
      </div>

      {/* 6. Active Grid Alerts */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-600 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Operational Alerts</span>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {activeAlerts} <span className="text-xs text-rose-400 font-medium">Active</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {120 - activeAlerts} Resolved / Closed
        </div>
      </div>
    </div>
  );
};
