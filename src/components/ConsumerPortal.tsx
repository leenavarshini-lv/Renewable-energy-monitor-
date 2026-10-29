import React, { useState } from 'react';
import { collectionsData } from '../data/allCollections';
import {
  User,
  Zap,
  Gauge,
  Receipt,
  Sun,
  CheckCircle2,
  Calendar,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const ConsumerPortal: React.FC = () => {
  const [selectedConsumerId, setSelectedConsumerId] = useState<string>('CONS_001');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const consumer = collectionsData.consumers.find(c => c.consumerId === selectedConsumerId) || collectionsData.consumers[0];
  const meter = collectionsData.meters.find(m => m.consumerId === consumer.consumerId);
  const myReadings = collectionsData.readings.filter(r => r.meterId === meter?.meterId);
  const myBills = collectionsData.bills.filter(b => b.consumerId === consumer.consumerId);
  const latestBill = myBills[0] || collectionsData.bills[0];

  const handlePayBill = (billId: string) => {
    setPaymentSuccess(billId);
    setTimeout(() => setPaymentSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Consumer Selector Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <User className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Prosumer Self-Service Energy Portal
                </h2>
                <p className="text-xs text-slate-400">
                  Consumer view: Bidirectional metering, solar exports, and net-metered settlement invoices
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-400 font-medium">Switch Consumer:</label>
            <select
              value={selectedConsumerId}
              onChange={e => setSelectedConsumerId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {collectionsData.consumers.slice(0, 15).map(c => (
                <option key={c.consumerId} value={c.consumerId}>
                  {c.name} ({c.category}) {c.hasSolar ? '☀️ Solar' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Consumer Profile Card */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Consumer Name & Category</span>
            <div className="text-sm font-bold text-white">{consumer.name}</div>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {consumer.category}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Assigned Smart Meter</span>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {meter?.meterId || 'MTR_UNKNOWN'}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Commissioned: {meter?.installedOn.split('T')[0]}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Rooftop Solar PV Setup</span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              {consumer.hasSolar ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-semibold">Active Prosumer</span>
                </>
              ) : (
                <span className="text-slate-400 font-normal">Grid Consumer Only</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {consumer.hasSolar ? 'Eligible for Net-Export Credits' : 'No rooftop generation'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-1">Service Address</span>
            <div className="text-xs text-slate-300 leading-tight truncate" title={consumer.address}>
              {consumer.address}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Net Metered Bill Spotlight */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Latest Net-Metered Settlement Bill ({latestBill.billMonth})
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              latestBill.status === 'PAID' || paymentSuccess === latestBill.billId
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {paymentSuccess === latestBill.billId ? 'PAID NOW ✓' : latestBill.status}
          </span>
        </div>

        {/* Math Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" /> Import Grid Energy
            </span>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {latestBill.importKwh} <span className="text-xs text-slate-500">kWh</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Export Solar PV
            </span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {latestBill.exportKwh} <span className="text-xs text-slate-500">kWh</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Credit In (Roll-over)</span>
            <div className="text-lg font-bold text-amber-300 font-mono mt-1">
              {latestBill.creditInKwh} <span className="text-xs text-slate-500">kWh</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Net Billed Energy</span>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                latestBill.netKwh <= 0 ? 'text-emerald-400' : 'text-slate-200'
              }`}
            >
              {latestBill.netKwh} <span className="text-xs text-slate-500">kWh</span>
            </div>
          </div>

          <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 block font-semibold">Total Payable</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              ₹{latestBill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Solar Surplus Note if applicable */}
        {latestBill.creditOutKwh > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>
                <strong>Solar Surplus Generated:</strong> You produced {latestBill.creditOutKwh} kWh in excess of your consumption. ₹0 bill charged; credits roll over to next cycle!
              </span>
            </span>
          </div>
        )}

        {/* Pay action */}
        {latestBill.status === 'UNPAID' && paymentSuccess !== latestBill.billId && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handlePayBill(latestBill.billId)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Bill Online (₹{latestBill.amount.toFixed(2)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Meter Readings History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-4">
          <Gauge className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Meter Interval Readings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Reading ID</th>
                <th className="py-2.5 px-3">Interval Date</th>
                <th className="py-2.5 px-3">Import (kWh)</th>
                <th className="py-2.5 px-3">Export (kWh)</th>
                <th className="py-2.5 px-3">Prosumer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {myReadings.map(r => (
                <tr key={r.readingId} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{r.readingId}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{r.date.split('T')[0]}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{r.importKwh} kWh</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">{r.exportKwh} kWh</td>
                  <td className="py-2.5 px-3">
                    {r.exportKwh > 0 ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Exporting
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Import only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
