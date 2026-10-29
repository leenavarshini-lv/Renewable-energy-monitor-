import React from 'react';
import { runFullDataAudit, AuditReport } from '../utils/audit';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Cpu,
  Sun,
  IndianRupee,
  Calendar,
  Layers,
  Leaf
} from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const reports = runFullDataAudit();
  const allPassed = reports.every(r => r.passed);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COUNTS':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'FOREIGN_KEYS':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'SOLAR_RULES':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'BILLING_LOGIC':
        return <IndianRupee className="w-4 h-4 text-yellow-400" />;
      case 'CARBON_FORMULA':
        return <Leaf className="w-4 h-4 text-teal-400" />;
      case 'DATES':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Seed Data Engineering Audit</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {allPassed ? '100% Rules Passed' : 'Violations Found'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rigorous automated validation of all 7 technical and domain rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {reports.map((report, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                report.passed
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {getCategoryIcon(report.category)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{report.details}</p>
                  </div>
                </div>

                <div>
                  {report.passed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Stats pill list */}
              {report.stats && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(report.stats).map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 text-[11px]"
                    >
                      <span className="text-slate-500 block truncate">{k}</span>
                      <span className="text-slate-200 font-mono font-semibold truncate block">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/60 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Audit executed across <span className="text-white font-medium">1,200 records</span> in memory
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
