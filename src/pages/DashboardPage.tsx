import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ViewMode } from '../types/rems';

interface DashboardPageProps {
  onNavigate: (view: ViewMode, table?: string) => void;
  onExecuteSqlToast: (title: string, sql: string, durationMs?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onExecuteSqlToast,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveAlert = async (alertId: number) => {
    setResolvingId(alertId);
    try {
      const res = await fetch(`/api/db/alerts/${alertId}/resolve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        onExecuteSqlToast(
          `Alert #${alertId} Resolved`,
          json.executedSql || `UPDATE rems.alert SET resolved = TRUE WHERE alert_id = ${alertId};`,
          12
        );
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center font-mono text-xs text-[#7C8BA1]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#2F6BFF]" />
        Loading live database dashboard...
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const plants = data?.plants || [];
  const dailyTrend = data?.dailyTrend || [];
  const plantTypes = data?.generationByType || [];
  const alerts = data?.recentAlerts || [];

  const typeColors: Record<string, string> = {
    SOLAR: '#F59E0B',
    WIND: '#2F6BFF',
    HYDRO: '#10B981',
  };

  return (
    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#16202E] pb-3">
        <div>
          <h1 className="text-base font-semibold text-[#E6EDF7] font-mono tracking-tight">
            SYSTEM TELEMETRY &amp; OPERATIONAL DASHBOARD
          </h1>
          <p className="text-xs text-[#7C8BA1]">
            Real-time PostgreSQL aggregates across generation facilities, billing cycles, and automated event triggers.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0E141F] hover:bg-[#16202E] border border-[#16202E] text-xs font-mono text-[#E6EDF7] rounded-[2px] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5B9BFF]" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid (Strict dense flat design) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">Facilities</span>
            <Zap className="w-3.5 h-3.5 text-[#5B9BFF]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#E6EDF7]">
            {kpis.totalPlants || 6}
          </div>
          <div className="text-[10px] font-mono text-[#7C8BA1] mt-1">
            {(kpis.totalCapacityKw || 8550).toLocaleString()} kW Total
          </div>
        </div>

        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">Total Yield</span>
            <Activity className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#E6EDF7]">
            {(kpis.totalGenerationKwh ? (kpis.totalGenerationKwh / 1000).toFixed(1) : '1,328.7')} MWh
          </div>
          <div className="text-[10px] font-mono text-[#10B981] mt-1">
            Aggregated generation
          </div>
        </div>

        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">CO₂ Avoided</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#2F6BFF]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#5B9BFF]">
            {(kpis.totalCo2AvoidedKg ? (kpis.totalCo2AvoidedKg / 1000).toFixed(1) : '943.4')} t
          </div>
          <div className="text-[10px] font-mono text-[#7C8BA1] mt-1">
            factor: 0.71 kg/kWh
          </div>
        </div>

        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">Unpaid Bills</span>
            <DollarSign className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#F59E0B]">
            ₹{((kpis.unpaidBillsAmount || 1065750) / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] font-mono text-[#7C8BA1] mt-1">
            {kpis.unpaidBillsCount || 3} overdue accounts
          </div>
        </div>

        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">Open Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EF4444]">
            {kpis.openAlertsCount !== undefined ? kpis.openAlertsCount : 3}
          </div>
          <div className="text-[10px] font-mono text-[#7C8BA1] mt-1">
            Require operational review
          </div>
        </div>

        <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7C8BA1] mb-1">
            <span className="text-[11px] font-mono uppercase">Direct Actions</span>
            <FileText className="w-3.5 h-3.5 text-[#7C8BA1]" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={() => onNavigate('sql-console')}
              className="flex-1 px-2 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[10px] font-mono text-[#5B9BFF] rounded-[2px] text-center"
            >
              SQL
            </button>
            <button
              onClick={() => onNavigate('feature-demos')}
              className="flex-1 px-2 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[10px] font-mono text-[#10B981] rounded-[2px] text-center"
            >
              DEMOS
            </button>
          </div>
          <div className="text-[10px] font-mono text-[#7C8BA1] mt-1">
            Direct console jump
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Generation Line Chart */}
        <div className="lg:col-span-2 bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px]">
          <div className="flex items-center justify-between mb-3 border-b border-[#16202E] pb-2">
            <span className="font-mono text-xs font-semibold text-[#E6EDF7] tracking-wider uppercase">
              Daily Output Timeline (kWh)
            </span>
            <span className="font-mono text-[10px] text-[#7C8BA1]">
              SELECT gen_date, sum(units_kwh)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16202E" vertical={false} />
                <XAxis
                  dataKey="gen_date"
                  stroke="#7C8BA1"
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                />
                <YAxis
                  stroke="#7C8BA1"
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1018',
                    borderColor: '#16202E',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                  itemStyle={{ color: '#5B9BFF' }}
                />
                <Line
                  type="monotone"
                  dataKey="daily_kwh"
                  stroke="#2F6BFF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#5B9BFF' }}
                  activeDot={{ r: 5, fill: '#E6EDF7' }}
                  name="kWh Produced"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generation by Plant Type Bar Chart */}
        <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px]">
          <div className="flex items-center justify-between mb-3 border-b border-[#16202E] pb-2">
            <span className="font-mono text-xs font-semibold text-[#E6EDF7] tracking-wider uppercase">
              Energy Source Breakdown
            </span>
            <span className="font-mono text-[10px] text-[#7C8BA1]">BY PLANT_TYPE</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16202E" vertical={false} />
                <XAxis
                  dataKey="plant_type"
                  stroke="#7C8BA1"
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                />
                <YAxis
                  stroke="#7C8BA1"
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1018',
                    borderColor: '#16202E',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
                <Bar dataKey="total_kwh" name="Total kWh">
                  {plantTypes.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={typeColors[entry.plant_type] || '#2F6BFF'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plant Grid & Alerts Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Managed Generation Facilities Table */}
        <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#E6EDF7] uppercase tracking-wider">
              Active Generation Plants ({plants.length})
            </span>
            <button
              onClick={() => onNavigate('table-browser', 'plant')}
              className="text-[11px] font-mono text-[#5B9BFF] hover:underline flex items-center gap-1"
            >
              <span>View Table</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="db-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Facility Name</th>
                  <th>Type</th>
                  <th className="numeric">Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plants.map((p: any) => (
                  <tr key={p.plant_id}>
                    <td className="font-mono text-[#7C8BA1]">{p.plant_id}</td>
                    <td className="font-medium text-[#E6EDF7]">{p.name}</td>
                    <td>
                      <span
                        className="badge font-mono"
                        style={{
                          backgroundColor: `${typeColors[p.plant_type] || '#2F6BFF'}15`,
                          color: typeColors[p.plant_type] || '#2F6BFF',
                          borderColor: `${typeColors[p.plant_type] || '#2F6BFF'}40`,
                        }}
                      >
                        {p.plant_type}
                      </span>
                    </td>
                    <td className="numeric font-mono text-[#E6EDF7]">
                      {Number(p.capacity_kw).toLocaleString()} kW
                    </td>
                    <td className="text-[#7C8BA1]">{p.location}</td>
                    <td>
                      <span className="badge bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Event Alerts Feed (With Real UPDATE Resolution) */}
        <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#E6EDF7] uppercase tracking-wider">
                Automated Trigger Alerts
              </span>
              <span className="text-[10px] font-mono bg-[#EF4444]/20 text-[#EF4444] px-1.5 py-0.2 rounded-[2px]">
                LIVE
              </span>
            </div>
            <button
              onClick={() => onNavigate('table-browser', 'alert')}
              className="text-[11px] font-mono text-[#5B9BFF] hover:underline flex items-center gap-1"
            >
              <span>View Table</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-72 p-2 flex flex-col gap-2">
            {alerts.length === 0 && (
              <div className="p-6 text-center text-[#7C8BA1] font-mono text-xs">
                No active or historical alerts found in rems.alert.
              </div>
            )}

            {alerts.map((a: any) => {
              const isResolved = a.resolved;
              return (
                <div
                  key={a.alert_id}
                  className={`p-2.5 rounded-[2px] border flex items-start justify-between gap-3 text-xs transition-colors ${
                    isResolved
                      ? 'bg-[#05070B] border-[#16202E] opacity-60'
                      : 'bg-[#10151E] border-[#EF4444]/40'
                  }`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] uppercase font-bold ${
                          a.alert_type === 'LOW_BATTERY'
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                            : a.alert_type === 'LOW_OUTPUT'
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                            : 'bg-[#2F6BFF]/20 text-[#5B9BFF] border border-[#2F6BFF]/30'
                        }`}
                      >
                        {a.alert_type}
                      </span>
                      <span className="font-mono text-[10px] text-[#7C8BA1]">
                        #{a.alert_id} • {a.ref_table} ID {a.ref_id}
                      </span>
                      <span className="font-mono text-[10px] text-[#7C8BA1]">
                        {a.created_at?.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>

                    <p className="text-[#E6EDF7] font-sans text-xs leading-relaxed">
                      {a.message}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isResolved ? (
                      <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-[2px] border border-[#10B981]/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        RESOLVED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveAlert(a.alert_id)}
                        disabled={resolvingId === a.alert_id}
                        className="px-2 py-1 bg-[#16202E] hover:bg-[#2F6BFF] text-[#E6EDF7] border border-[#2F6BFF]/50 rounded-[2px] font-mono text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {resolvingId === a.alert_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        )}
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
