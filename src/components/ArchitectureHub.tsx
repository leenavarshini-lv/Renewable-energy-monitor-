import React, { useState } from 'react';
import {
  Workflow,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Clock,
  Radio,
  Server,
  Database,
  Smartphone,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ArchitectureHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dfd' | 'lifecycle' | 'rbac' | 'topology'>('topology');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <Workflow className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  System Architecture & Production Blueprints Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Critical engineering diagrams and system topologies required alongside the ER model
                </p>
              </div>
            </div>
          </div>

          {/* Blueprint Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'topology'
                  ? 'bg-teal-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Grid Power Topology
            </button>
            <button
              onClick={() => setActiveTab('dfd')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dfd'
                  ? 'bg-teal-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔄 End-to-End Data Flow (DFD)
            </button>
            <button
              onClick={() => setActiveTab('lifecycle')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'lifecycle'
                  ? 'bg-teal-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📑 Net-Billing State Machine
            </button>
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'rbac'
                  ? 'bg-teal-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ RBAC Security Matrix
            </button>
          </div>
        </div>
      </div>

      {/* 1. Grid Power Topology & Energy Flow */}
      {activeTab === 'topology' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Grid Power Distribution & Balance Topology
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Visualizes physical and electrical dispatch from renewable generation to consumer load and BESS storage
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                Live Indian Grid Balance
              </span>
            </div>

            {/* Interactive Flow Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
              {/* Generation Nodes */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  1. Renewable Sources
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 shadow">
                  <div className="text-amber-400 font-bold text-sm">☀️ Solar PV Parks</div>
                  <div className="text-xs text-slate-400 mt-1">Bhadla, Pavagada, Rewa</div>
                  <div className="text-base font-mono font-bold text-white mt-2">1,250 MWp</div>
                  <span className="text-[10px] text-amber-300">Peaks: 11:00 - 14:00</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/30 shadow">
                  <div className="text-sky-400 font-bold text-sm">💨 Wind Farm Clusters</div>
                  <div className="text-xs text-slate-400 mt-1">Muppandal, Jaisalmer</div>
                  <div className="text-base font-mono font-bold text-white mt-2">840 MW</div>
                  <span className="text-[10px] text-sky-300">Irregular gust curve</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 shadow">
                  <div className="text-cyan-400 font-bold text-sm">🌊 Hydroelectric Hydel</div>
                  <div className="text-xs text-slate-400 mt-1">Koyna, Tehri, Sharavathi</div>
                  <div className="text-base font-mono font-bold text-white mt-2">680 MW</div>
                  <span className="text-[10px] text-cyan-300">Baseload & peak dispatch</span>
                </div>
              </div>

              {/* Grid Substation & BESS */}
              <div className="space-y-3 md:col-span-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Transmission & Stabilization
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-teal-500/40 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-teal-400 font-bold text-base">
                        ⚡ Regional 400kV / 220kV Pooling Substation
                      </div>
                      <div className="text-xs text-slate-400">SCADA Inverter Aggregation & Frequency Control</div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                      50.02 Hz
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Grid Injection</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">2,770 MW</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Transmission Efficiency</span>
                      <span className="font-mono text-white font-bold text-sm">96.8% (T&D)</span>
                    </div>
                  </div>

                  {/* Battery BESS Coupling */}
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold">🔋 Battery Energy Storage (BESS)</span>
                      <span className="font-mono text-emerald-300">320 MWh Active Bank</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[78%]"></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>SoC: 78% (Peak Smoothing)</span>
                      <span>Health: GOOD (Cycle: 420)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consumer Demand Endpoints */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  3. Load & Prosumers
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 shadow">
                  <div className="text-indigo-400 font-bold text-sm">🏭 Industrial Foundries</div>
                  <div className="text-xs text-slate-400 mt-1">HT Tariff: ₹7.50 / kWh</div>
                  <div className="text-base font-mono font-bold text-white mt-2">1,420 MW</div>
                  <span className="text-[10px] text-slate-400">Captive solar export</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 shadow">
                  <div className="text-purple-400 font-bold text-sm">🏢 Commercial Tech Parks</div>
                  <div className="text-xs text-slate-400 mt-1">Commercial: ₹8.50 / kWh</div>
                  <div className="text-base font-mono font-bold text-white mt-2">720 MW</div>
                  <span className="text-[10px] text-purple-300">Daytime peak cooling load</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 shadow">
                  <div className="text-emerald-400 font-bold text-sm">🏡 Residential Prosumers</div>
                  <div className="text-xs text-slate-400 mt-1">Household: ₹6.50 / kWh</div>
                  <div className="text-base font-mono font-bold text-white mt-2">510 MW</div>
                  <span className="text-[10px] text-amber-300">Bidirectional Net Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. End-to-End Data Flow Diagram (DFD) */}
      {activeTab === 'dfd' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              End-to-End IoT & Billing Data Flow Architecture (DFD)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              How meter readings, plant telemetry, and tariffs flow into Cloud Firestore and user applications
            </p>
          </div>

          <div className="relative border-l-2 border-indigo-500/40 ml-4 pl-6 space-y-8 my-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-300">
                1
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Edge Ingestion Layer
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Smart Bidirectional Meters (`meters`) transmit 15-minute interval import/export values (`readings`). Plant SCADA systems stream hourly generation units and battery state-of-charge over MQTT/Modbus protocols.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-300">
                2
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">
                  Cloud Ingestion & Threshold Rules Engine
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cloud Functions evaluate incoming telemetry against `config` rules. If Battery SoC &lt; 20%, low-output deviation &gt; 60%, or equipment warranty expires within 30 days, an automated record is dispatched to `alerts`.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-300">
                3
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Discom Net-Metering Settlement Daemon
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  At month-end, the settlement daemon reads accumulated import and export kWh from `readings`, looks up active rates from `tariffs` (Household ₹6.5, Commercial ₹8.5, Industrial ₹7.5), computes net units (`net = import - export - creditIn`), rolls over surplus credits, and creates `bills`.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-300">
                4
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Compliance & Audit Logging
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Any tariff schedule adjustment, meter recalibration, or bill override creates an immutable entry in `audit_logs` storing delta changes (`old_data`, `new_data`), actor credentials, and regulatory reasons.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Net-Billing State Machine */}
      {activeTab === 'lifecycle' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Net-Metering Billing Settlement State Machine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Formal lifecycle states of energy units from meter reading to invoice settlement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">State 1</span>
              <h4 className="text-sm font-bold text-white">METER_READING</h4>
              <p className="text-xs text-slate-400">
                Smart meter records cumulative importKwh and solar exportKwh during billing cycle.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">State 2</span>
              <h4 className="text-sm font-bold text-amber-300">NET_CALCULATION</h4>
              <p className="text-xs text-slate-400">
                Formula evaluated: <code className="text-amber-400 text-[11px]">net = import - export - creditIn</code>
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">State 3</span>
              <h4 className="text-sm font-bold text-indigo-400">TARIFF_BRANCH</h4>
              <p className="text-xs text-slate-400">
                If net &lt; 0: amount = ₹0, creditOut = -net.<br />
                If net &gt; 0: amount = net × tariff rate.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">State 4</span>
              <h4 className="text-sm font-bold text-emerald-400">SETTLED (PAID)</h4>
              <p className="text-xs text-slate-400">
                Invoice marked PAID via online gateway; surplus solar rolled over into next cycle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. RBAC Security Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Role-Based Access Control (RBAC) Permission Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enforced by <code className="text-indigo-300">firestore.rules</code> across Admin, Operator, and Consumer accounts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Collection</th>
                  <th className="py-2.5 px-3 text-center">Admin Clearance</th>
                  <th className="py-2.5 px-3 text-center">Grid Operator</th>
                  <th className="py-2.5 px-3 text-center">Prosumer Consumer</th>
                  <th className="py-2.5 px-3">Security Rule Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {[
                  { col: 'plants', admin: 'CRUD', op: 'Read / Update', cons: 'Deny', rule: 'Operational authority check' },
                  { col: 'equipment', admin: 'CRUD', op: 'Read / Update', cons: 'Deny', rule: 'SCADA machine monitoring' },
                  { col: 'batteries', admin: 'CRUD', op: 'Read / Update', cons: 'Deny', rule: 'BESS dispatch control' },
                  { col: 'generation', admin: 'CRUD', op: 'Read / Write', cons: 'Deny', rule: 'Telemetry ingestion only' },
                  { col: 'consumers', admin: 'CRUD', op: 'Deny', cons: 'Read Own Profile', rule: 'resource.id == auth.uid' },
                  { col: 'meters', admin: 'CRUD', op: 'Read / Calibrate', cons: 'Read Own Meter', rule: 'consumerId ownership' },
                  { col: 'readings', admin: 'CRUD', op: 'Read', cons: 'Read Own Meter', rule: 'meterId ownership verify' },
                  { col: 'bills', admin: 'CRUD', op: 'Deny', cons: 'Read & Pay Own', rule: 'consumerId isolation' },
                  { col: 'alerts', admin: 'CRUD', op: 'Read / Acknowledge', cons: 'Deny', rule: 'SCADA operations dispatch' },
                  { col: 'tariffs', admin: 'CRUD', op: 'Read Only', cons: 'Read Rates', rule: 'State commission authority' },
                  { col: 'config', admin: 'CRUD', op: 'Read Only', cons: 'Deny', rule: 'System parameters protection' },
                  { col: 'users', admin: 'CRUD', op: 'Deny', cons: 'Read Own', rule: 'Strict user authentication' },
                  { col: 'auditLogs', admin: 'Read Only', op: 'Deny', cons: 'Deny', rule: 'Immutable append-only ledger' }
                ].map(r => (
                  <tr key={r.col} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">{r.col}</td>
                    <td className="py-2 px-3 text-center text-emerald-400 font-semibold">{r.admin}</td>
                    <td className="py-2 px-3 text-center text-sky-400">{r.op}</td>
                    <td className="py-2 px-3 text-center text-purple-400">{r.cons}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{r.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
