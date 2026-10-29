import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  DollarSign,
  TrendingUp,
  Gauge,
  Shield,
  FileSpreadsheet,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  BarChart2,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface FeatureDemosPageProps {
  onExecuteSqlToast: (title: string, sql: string, durationMs?: number) => void;
}

export const FeatureDemosPage: React.FC<FeatureDemosPageProps> = ({ onExecuteSqlToast }) => {
  const [activeDemo, setActiveDemo] = useState<
    'triggers' | 'billing' | 'carbon' | 'benchmark' | 'roles' | 'audit'
  >('triggers');

  // Trigger demo state
  const [batteryId, setBatteryId] = useState('2');
  const [batteryPct, setBatteryPct] = useState('14.5');
  const [triggerBatteryResult, setTriggerBatteryResult] = useState<any>(null);
  const [lowPlantId, setLowPlantId] = useState('1');
  const [lowUnits, setLowUnits] = useState('420.0');
  const [triggerLowResult, setTriggerLowResult] = useState<any>(null);
  const [warrantyResult, setWarrantyResult] = useState<any>(null);

  // Billing demo state
  const [selectedConsumerId, setSelectedConsumerId] = useState('1');
  const [targetBillingMonth, setTargetBillingMonth] = useState('2026-10-01');
  const [billingResult, setBillingResult] = useState<any>(null);
  const [consumerBills, setConsumerBills] = useState<any[]>([]);

  // Carbon demo state
  const [carbonMonth, setCarbonMonth] = useState('2026-10-01');
  const [carbonResult, setCarbonResult] = useState<any>(null);

  // Benchmark demo state
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  // Roles demo state
  const [selectedRole, setSelectedRole] = useState<'rems_admin' | 'rems_operator' | 'rems_consumer'>('rems_operator');
  const [selectedRoleAction, setSelectedRoleAction] = useState('update_tariff');
  const [roleResult, setRoleResult] = useState<any>(null);

  // Audit log demo state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTableFilter, setAuditTableFilter] = useState('ALL');

  // Generic loading
  const [loading, setLoading] = useState(false);

  // 1. Run Trigger Demos
  const runBatteryTrigger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/trigger-battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batteryId, chargePct: batteryPct }),
      });
      const data = await res.json();
      setTriggerBatteryResult(data);
      onExecuteSqlToast('trg_battery_low Trigger Fired', data.executedSql, 15);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runLowOutputTrigger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/trigger-low-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantId: lowPlantId, unitsKwh: lowUnits }),
      });
      const data = await res.json();
      setTriggerLowResult(data);
      onExecuteSqlToast('trg_low_output Trigger Fired', data.executedSql, 18);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runWarrantyCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/run-warranty', { method: 'POST' });
      const data = await res.json();
      setWarrantyResult(data);
      onExecuteSqlToast('rems.check_warranty_alerts() Executed', data.executedSql, 22);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Run Billing Demo
  const runBillingGeneration = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/generate-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: targetBillingMonth }),
      });
      const data = await res.json();
      setBillingResult(data);
      onExecuteSqlToast('rems.generate_bills() Computed', data.executedSql, 35);
      fetchConsumerBills();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumerBills = async () => {
    try {
      const res = await fetch(`/api/db/tables/bill?limit=50`);
      const data = await res.json();
      setConsumerBills(
        (data.rows || []).filter(
          (b: any) => String(b.consumer_id) === String(selectedConsumerId)
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeDemo === 'billing') fetchConsumerBills();
  }, [activeDemo, selectedConsumerId]);

  // 3. Run Carbon Credits Demo
  const runCarbonCredits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/calc-carbon-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: carbonMonth }),
      });
      const data = await res.json();
      setCarbonResult(data);
      onExecuteSqlToast('rems.calc_carbon_credits() Processed', data.executedSql, 28);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Run Benchmark Demo
  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/db/demos/benchmark-index', { method: 'POST' });
      const data = await res.json();
      setBenchmarkResult(data);
      onExecuteSqlToast(
        'Index Benchmark Completed',
        'EXPLAIN (ANALYZE) ... with idx_reading_meter_date vs Seq Scan',
        Math.round(data.sequentialScan.durationMs)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setBenchmarking(false);
    }
  };

  // 5. Run Role Demo
  const runRoleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/demos/test-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, action: selectedRoleAction }),
      });
      const data = await res.json();
      setRoleResult(data);
      onExecuteSqlToast(
        `Role Test: ${selectedRole}`,
        data.executedSql || `SET LOCAL ROLE ${selectedRole};`,
        8
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 6. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/db/tables/audit_log?limit=50');
      const data = await res.json();
      setAuditLogs(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeDemo === 'audit') fetchAuditLogs();
  }, [activeDemo]);

  const demos = [
    { id: 'triggers', label: 'Automated Triggers', icon: Zap },
    { id: 'billing', label: 'Net-Metered Billing', icon: DollarSign },
    { id: 'carbon', label: 'Carbon Credits (CO₂)', icon: TrendingUp },
    { id: 'benchmark', label: 'Index Performance Benchmark', icon: Gauge },
    { id: 'roles', label: 'RBAC Roles & Security', icon: Shield },
    { id: 'audit', label: 'Immutable Audit Trail', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Sub-Nav Bar */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center gap-1 shrink-0 overflow-x-auto text-xs select-none">
        {demos.map((d) => {
          const Icon = d.icon;
          const isActive = activeDemo === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDemo(d.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-mono transition-colors cursor-pointer shrink-0 border-b-2 ${
                isActive
                  ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824] font-medium'
                  : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7] hover:bg-[#0E141F]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5B9BFF]' : 'text-[#7C8BA1]'}`} />
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* Demo Content Container */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* DEMO 1: TRIGGERS */}
        {activeDemo === 'triggers' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                PostgreSQL Automated Event Triggers
              </h2>
              <p className="text-xs text-[#7C8BA1]">
                Demonstrates how database-level event hooks execute logic immediately upon DML without application polling.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Trigger A: Low Battery */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#EF4444] font-mono text-xs font-semibold">
                    <Zap className="w-4 h-4" />
                    <span>trg_battery_low</span>
                  </div>
                  <p className="text-[11px] text-[#7C8BA1] leading-relaxed">
                    Fires when <code className="text-[#E6EDF7] font-mono">rems.battery.charge_pct</code> drops below the threshold (20% in <code className="text-[#E6EDF7] font-mono">rems.config</code>). Automatically raises a <code className="text-[#EF4444] font-mono">LOW_BATTERY</code> alert.
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] font-mono text-[#7C8BA1]">Target Battery</label>
                      <select
                        value={batteryId}
                        onChange={(e) => setBatteryId(e.target.value)}
                        className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                      >
                        <option value="1">Battery #1 (Bhadla Solar)</option>
                        <option value="2">Battery #2 (Pavagada Solar)</option>
                        <option value="3">Battery #3 (Muppandal Wind)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[10px] font-mono text-[#7C8BA1]">Set SoC %</label>
                      <input
                        type="number"
                        value={batteryPct}
                        onChange={(e) => setBatteryPct(e.target.value)}
                        className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#16202E]">
                  <button
                    onClick={runBatteryTrigger}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Trigger SoC Drop</span>
                  </button>

                  {triggerBatteryResult && (
                    <div className="p-2 bg-[#05070B] border border-[#EF4444]/40 rounded-[2px] font-mono text-[10px] text-[#EF4444] flex flex-col gap-1">
                      <div className="font-semibold text-white">Alert Generated:</div>
                      <div>{triggerBatteryResult.alert?.message || 'New LOW_BATTERY alert created'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trigger B: Low Output */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#F59E0B] font-mono text-xs font-semibold">
                    <Activity className="w-4 h-4" />
                    <span>trg_low_output</span>
                  </div>
                  <p className="text-[11px] text-[#7C8BA1] leading-relaxed">
                    Fires ON INSERT into <code className="text-[#E6EDF7] font-mono">generation_record</code>. Compares generation against plant capacity × sunlight hours. Below 60% expected yield triggers <code className="text-[#F59E0B] font-mono">LOW_OUTPUT</code>.
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] font-mono text-[#7C8BA1]">Target Plant</label>
                      <select
                        value={lowPlantId}
                        onChange={(e) => setLowPlantId(e.target.value)}
                        className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                      >
                        <option value="1">Bhadla Solar (1250 kW)</option>
                        <option value="2">Pavagada Solar (950 kW)</option>
                        <option value="6">Rewa Ultra Mega (750 kW)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[10px] font-mono text-[#7C8BA1]">Output (kWh)</label>
                      <input
                        type="number"
                        value={lowUnits}
                        onChange={(e) => setLowUnits(e.target.value)}
                        className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#16202E]">
                  <button
                    onClick={runLowOutputTrigger}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Insert Sub-Par Record</span>
                  </button>

                  {triggerLowResult && (
                    <div className="p-2 bg-[#05070B] border border-[#F59E0B]/40 rounded-[2px] font-mono text-[10px] text-[#F59E0B] flex flex-col gap-1">
                      <div className="font-semibold text-white">Alert Generated:</div>
                      <div>{triggerLowResult.alert?.message || 'New LOW_OUTPUT alert created'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Function: Warranty Checks */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#5B9BFF] font-mono text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>check_warranty_alerts()</span>
                  </div>
                  <p className="text-[11px] text-[#7C8BA1] leading-relaxed">
                    Executes stored PL/pgSQL function checking equipment where <code className="text-[#E6EDF7] font-mono">warranty_end &lt;= CURRENT_DATE + 30 days</code>. Generates deduplicated alerts.
                  </p>

                  <div className="p-2 bg-[#05070B] border border-[#16202E] rounded-[2px] font-mono text-[10px] text-[#7C8BA1]">
                    Evaluates 9 equipment assets against rems.config threshold.
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#16202E]">
                  <button
                    onClick={runWarrantyCheck}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Warranty Scan</span>
                  </button>

                  {warrantyResult && (
                    <div className="p-2 bg-[#05070B] border border-[#10B981]/40 rounded-[2px] font-mono text-[10px] text-[#10B981] flex flex-col gap-1">
                      <div>Function completed: {warrantyResult.alertsCreated} alerts created / validated.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO 2: NET-METERED BILLING */}
        {activeDemo === 'billing' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#16202E] pb-3">
              <div>
                <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                  Net-Metered Consumer Billing Engine
                </h2>
                <p className="text-xs text-[#7C8BA1]">
                  Executes <code className="text-[#5B9BFF] font-mono">rems.generate_bills(target_month)</code>. Applies net consumption = (Import - Export) - Prior Credit In, calculates tariffs, and carries excess export credit forward.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={targetBillingMonth}
                  onChange={(e) => setTargetBillingMonth(e.target.value)}
                  className="bg-[#0B1018] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                />
                <button
                  onClick={runBillingGeneration}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute generate_bills()</span>
                </button>
              </div>
            </div>

            {/* Consumer Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-[#7C8BA1]">Select Consumer:</label>
              <select
                value={selectedConsumerId}
                onChange={(e) => setSelectedConsumerId(e.target.value)}
                className="bg-[#0B1018] border border-[#16202E] text-xs font-mono px-2.5 py-1.5 rounded-[2px] text-[#E6EDF7]"
              >
                <option value="1">Consumer #1: Arun Mehta (HOUSEHOLD • Solar Prosumer)</option>
                <option value="2">Consumer #2: Sunita Sharma (HOUSEHOLD • Grid Only)</option>
                <option value="3">Consumer #3: Apex Data Centers (COMMERCIAL • Solar)</option>
                <option value="4">Consumer #4: Meridian Cold Storage (COMMERCIAL)</option>
                <option value="5">Consumer #5: Kalyani Precision (INDUSTRIAL • Solar)</option>
              </select>
            </div>

            {/* Billing Table */}
            <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Month</th>
                    <th className="numeric">Import (kWh)</th>
                    <th className="numeric">Export (kWh)</th>
                    <th className="numeric">Credit In</th>
                    <th className="numeric">Net (kWh)</th>
                    <th className="numeric">Credit Out</th>
                    <th className="numeric">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consumerBills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-4 text-[#7C8BA1]">
                        No bills found for consumer #{selectedConsumerId}. Click "Execute generate_bills()" above!
                      </td>
                    </tr>
                  ) : (
                    consumerBills.map((b: any) => (
                      <tr key={b.bill_id}>
                        <td className="font-mono text-[#7C8BA1]">{b.bill_id}</td>
                        <td className="font-mono text-[#E6EDF7]">{b.bill_month}</td>
                        <td className="numeric font-mono text-[#E6EDF7]">{b.import_kwh}</td>
                        <td className="numeric font-mono text-[#10B981]">{b.export_kwh}</td>
                        <td className="numeric font-mono text-[#7C8BA1]">{b.credit_in_kwh}</td>
                        <td className="numeric font-mono text-[#5B9BFF] font-semibold">{b.net_kwh}</td>
                        <td className="numeric font-mono text-[#F59E0B]">{b.credit_out_kwh}</td>
                        <td className="numeric font-mono text-[#E6EDF7] font-bold">
                          ₹{Number(b.amount).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === 'PAID'
                                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                                : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEMO 3: CARBON CREDITS */}
        {activeDemo === 'carbon' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#16202E] pb-3">
              <div>
                <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                  Carbon Credit Accounting Procedure
                </h2>
                <p className="text-xs text-[#7C8BA1]">
                  Executes <code className="text-[#5B9BFF] font-mono">rems.calc_carbon_credits(target_month)</code>. Computes avoided greenhouse gas emissions by multiplying total green yield by the grid factor (0.71 kg CO₂ / kWh).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={carbonMonth}
                  onChange={(e) => setCarbonMonth(e.target.value)}
                  className="bg-[#0B1018] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                />
                <button
                  onClick={runCarbonCredits}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute calc_carbon_credits()</span>
                </button>
              </div>
            </div>

            {/* Carbon Output Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-3">
                <span className="font-mono text-xs font-semibold text-[#E6EDF7]">
                  Monthly CO₂ Avoided by Generation Facility (kg)
                </span>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        carbonResult?.credits || [
                          { plant_name: 'Bhadla Solar', co2_avoided_kg: 117434 },
                          { plant_name: 'Pavagada Solar', co2_avoided_kg: 88182 },
                          { plant_name: 'Muppandal Wind', co2_avoided_kg: 202350 },
                          { plant_name: 'Jaisalmer Wind', co2_avoided_kg: 148035 },
                          { plant_name: 'Tehri Hydro', co2_avoided_kg: 315950 },
                          { plant_name: 'Rewa Solar', co2_avoided_kg: 71852 },
                        ]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#16202E" vertical={false} />
                      <XAxis dataKey="plant_name" stroke="#7C8BA1" fontSize={9} fontFamily="IBM Plex Mono" />
                      <YAxis stroke="#7C8BA1" fontSize={10} fontFamily="IBM Plex Mono" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1018',
                          borderColor: '#16202E',
                          borderRadius: '2px',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="co2_avoided_kg" fill="#10B981" name="kg CO₂ Avoided" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table View */}
              <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden flex flex-col">
                <div className="p-3 bg-[#0E141F] border-b border-[#16202E] font-mono text-xs font-semibold text-[#E6EDF7]">
                  rems.carbon_credit Ledger
                </div>
                <div className="overflow-auto max-h-72">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Credit ID</th>
                        <th>Plant</th>
                        <th>Month</th>
                        <th className="numeric">Yield (kWh)</th>
                        <th className="numeric">Avoided CO₂ (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(carbonResult?.credits || []).map((c: any) => (
                        <tr key={c.credit_id}>
                          <td className="font-mono text-[#7C8BA1]">{c.credit_id}</td>
                          <td className="font-medium text-[#E6EDF7]">{c.plant_name || `Plant ${c.plant_id}`}</td>
                          <td className="font-mono text-[#7C8BA1]">{c.credit_month}</td>
                          <td className="numeric font-mono text-[#5B9BFF]">{Number(c.units_kwh).toLocaleString()}</td>
                          <td className="numeric font-mono text-[#10B981] font-bold">{Number(c.co2_avoided_kg).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO 4: INDEX PERFORMANCE BENCHMARK */}
        {activeDemo === 'benchmark' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#16202E] pb-3">
              <div>
                <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                  B-Tree Index Scan vs. Sequential Scan Benchmark
                </h2>
                <p className="text-xs text-[#7C8BA1]">
                  Compares query execution time with composite B-Tree index <code className="text-[#5B9BFF] font-mono">idx_reading_meter_date (meter_id, reading_date)</code> versus an unindexed Sequential Scan.
                </p>
              </div>

              <button
                onClick={runBenchmark}
                disabled={benchmarking}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{benchmarking ? 'Benchmarking Plans...' : 'Run Comparative Benchmark'}</span>
              </button>
            </div>

            {/* Benchmark Query Code Display */}
            <div className="p-3 bg-[#0B1018] border border-[#16202E] rounded-[2px] font-mono text-[11px] text-[#A6C0FE]">
              <span className="text-[#7C8BA1]">-- Benchmark Target Query:</span>
              <br />
              SELECT meter_id, reading_date, import_kwh, export_kwh FROM rems.meter_reading WHERE meter_id = 101 AND reading_date &gt;= '2026-10-01' ORDER BY reading_date;
            </div>

            {/* Comparison Metrics Grid */}
            {benchmarkResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0B1018] border border-[#10B981]/40 p-4 rounded-[2px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#10B981] font-mono text-xs font-semibold">
                    <span>INDEX SCAN</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#10B981] my-2">
                    {benchmarkResult.indexUsed.durationMs}ms
                  </div>
                  <div className="text-[11px] font-mono text-[#7C8BA1]">
                    Using index: <code className="text-[#5B9BFF]">idx_reading_meter_date</code>
                  </div>
                </div>

                <div className="bg-[#0B1018] border border-[#EF4444]/40 p-4 rounded-[2px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#EF4444] font-mono text-xs font-semibold">
                    <span>SEQUENTIAL SCAN</span>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#EF4444] my-2">
                    {benchmarkResult.sequentialScan.durationMs}ms
                  </div>
                  <div className="text-[11px] font-mono text-[#7C8BA1]">
                    Full table sequential heap scan
                  </div>
                </div>

                <div className="bg-[#0B1018] border border-[#2F6BFF]/40 p-4 rounded-[2px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#5B9BFF] font-mono text-xs font-semibold">
                    <span>SPEEDUP FACTOR</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#5B9BFF] my-2">
                    {benchmarkResult.speedup}x
                  </div>
                  <div className="text-[11px] font-mono text-[#7C8BA1]">
                    Latency reduction with B-Tree index
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#0B1018] border border-[#16202E] rounded-[2px] text-center font-mono text-xs text-[#7C8BA1]">
                Click "Run Comparative Benchmark" to execute the queries side-by-side with and without index.
              </div>
            )}
          </div>
        )}

        {/* DEMO 5: ROLES & RBAC */}
        {activeDemo === 'roles' && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#16202E] pb-3">
              <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                PostgreSQL Role-Based Access Control (RBAC)
              </h2>
              <p className="text-xs text-[#7C8BA1]">
                Demonstrates how <code className="text-[#5B9BFF] font-mono">SET LOCAL ROLE</code> enforces privilege boundaries at the PostgreSQL kernel level.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-3">
                <span className="font-mono text-xs font-semibold text-[#E6EDF7]">
                  Role Selection &amp; Intended Action
                </span>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-[#7C8BA1]">Active Role:</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2.5 py-1.5 rounded-[2px] text-[#E6EDF7]"
                  >
                    <option value="rems_admin">rems_admin (Superuser authority)</option>
                    <option value="rems_operator">rems_operator (Telemetry ops only)</option>
                    <option value="rems_consumer">rems_consumer (Prosumer read only)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-[#7C8BA1]">Action to Execute:</label>
                  <select
                    value={selectedRoleAction}
                    onChange={(e) => setSelectedRoleAction(e.target.value)}
                    className="bg-[#05070B] border border-[#16202E] text-xs font-mono px-2.5 py-1.5 rounded-[2px] text-[#E6EDF7]"
                  >
                    <option value="read_plants">SELECT FROM rems.plant (Read Telemetry)</option>
                    <option value="update_tariff">UPDATE rems.tariff (Modify Financial Rates)</option>
                    <option value="read_audit">SELECT FROM rems.audit_log (Audit Trail)</option>
                    <option value="insert_generation">INSERT INTO rems.generation_record</option>
                  </select>
                </div>

                <button
                  onClick={runRoleTest}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer mt-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Under Role</span>
                </button>
              </div>

              {/* Execution Feedback */}
              <div className="lg:col-span-2 bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col justify-between">
                <span className="font-mono text-xs font-semibold text-[#E6EDF7] mb-2">
                  PostgreSQL Privilege Enforcement Response
                </span>

                {roleResult ? (
                  <div
                    className={`p-3 rounded-[2px] border font-mono text-xs flex flex-col gap-2 ${
                      roleResult.allowed
                        ? 'bg-[#0C1914] border-[#10B981]/40 text-[#10B981]'
                        : 'bg-[#190C0E] border-[#EF4444]/40 text-[#EF4444]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {roleResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>
                        {roleResult.allowed
                          ? 'PRIVILEGE PERMITTED (Granted by Role Grants)'
                          : 'PERMISSION DENIED (Enforced by PostgreSQL Kernel)'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#E6EDF7] bg-[#05070B] p-2 rounded-[2px] border border-[#16202E]">
                      {roleResult.allowed
                        ? `Query executed successfully as ${roleResult.role}. Returned ${roleResult.rowCount} rows.`
                        : roleResult.error}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#7C8BA1] font-mono text-xs">
                    Select a role and action to test privilege validation.
                  </div>
                )}

                <div className="text-[11px] font-mono text-[#7C8BA1] mt-3">
                  SQL Executed: <code className="text-[#5B9BFF]">BEGIN; SET LOCAL ROLE {selectedRole}; ... COMMIT;</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO 6: AUDIT LOG */}
        {activeDemo === 'audit' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#16202E] pb-3">
              <div>
                <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                  PostgreSQL Immutable Audit Trail (rems.audit_log)
                </h2>
                <p className="text-xs text-[#7C8BA1]">
                  Trigger-maintained audit log capturing exact old and new state, actor, and timestamp for all modifications to tariffs and bills.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#7C8BA1]">Filter Table:</span>
                <select
                  value={auditTableFilter}
                  onChange={(e) => setAuditTableFilter(e.target.value)}
                  className="bg-[#0B1018] border border-[#16202E] text-xs font-mono px-2 py-1 rounded-[2px] text-[#E6EDF7]"
                >
                  <option value="ALL">ALL TABLES</option>
                  <option value="tariff">rems.tariff</option>
                  <option value="bill">rems.bill</option>
                </select>
              </div>
            </div>

            <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Table</th>
                    <th>Action</th>
                    <th>Actor (changed_by)</th>
                    <th>Timestamp</th>
                    <th>Old Data (JSONB)</th>
                    <th>New Data (JSONB)</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(
                      (l) => auditTableFilter === 'ALL' || l.table_name === auditTableFilter
                    )
                    .map((l: any) => (
                      <tr key={l.log_id}>
                        <td className="font-mono text-[#7C8BA1]">{l.log_id}</td>
                        <td className="font-mono text-[#5B9BFF] font-semibold">{l.table_name}</td>
                        <td>
                          <span
                            className={`badge ${
                              l.action === 'INSERT'
                                ? 'bg-[#10B981]/10 text-[#10B981]'
                                : l.action === 'UPDATE'
                                ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                : 'bg-[#EF4444]/10 text-[#EF4444]'
                            }`}
                          >
                            {l.action}
                          </span>
                        </td>
                        <td className="font-mono text-[#E6EDF7]">{l.changed_by}</td>
                        <td className="font-mono text-[#7C8BA1] text-[10px]">{l.changed_at}</td>
                        <td className="font-mono text-[10px] text-[#EF4444]/80 max-w-xs truncate">
                          {l.old_data ? JSON.stringify(l.old_data) : 'null'}
                        </td>
                        <td className="font-mono text-[10px] text-[#10B981] max-w-xs truncate">
                          {l.new_data ? JSON.stringify(l.new_data) : 'null'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
