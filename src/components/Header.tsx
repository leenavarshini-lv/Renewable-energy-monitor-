import React from 'react';
import { Database, Search, Download, Settings, Server, Activity } from 'lucide-react';
import { DBStatus } from '../types/rems';

interface HeaderProps {
  status: DBStatus | null;
  onOpenConnectionModal: () => void;
  onOpenSearch: () => void;
  onExportReport: () => void;
  inTransaction: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onOpenConnectionModal,
  onOpenSearch,
  onExportReport,
  inTransaction,
}) => {
  return (
    <header className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Branding & Connected Database Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#16202E]">
          <span className="font-mono font-bold text-xs tracking-wider text-[#5B9BFF]">
            REMS
          </span>
          <span className="text-[11px] font-mono text-[#7C8BA1] uppercase">
            Console
          </span>
        </div>

        {/* Connected DB Indicator */}
        <button
          onClick={onOpenConnectionModal}
          title="Click to view connection parameters or switch database"
          className="flex items-center gap-2 px-2 py-1 rounded-[2px] hover:bg-[#111824] border border-transparent hover:border-[#16202E] transition-colors cursor-pointer group"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status?.mode === 'postgres' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status?.mode === 'postgres' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
              }`}
            />
          </span>

          <span className="font-mono text-xs font-medium text-[#E6EDF7] group-hover:text-[#5B9BFF] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#7C8BA1] group-hover:text-[#5B9BFF]" />
            <span>{status?.dbName || 'rems_db'}</span>
          </span>

          <span className="font-mono text-[10px] text-[#7C8BA1] bg-[#05070B] px-1 py-0.2 border border-[#16202E] rounded-[2px]">
            {status?.mode === 'postgres' ? 'pg-live' : 'emulated'}
          </span>
        </button>

        {inTransaction && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B] font-mono text-[11px] rounded-[2px] animate-pulse">
            <Activity className="w-3 h-3" />
            <span>TRANSACTION ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right: Search, Export, Connection Settings */}
      <div className="flex items-center gap-2">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1 bg-[#05070B] hover:bg-[#0E141F] border border-[#16202E] rounded-[2px] text-xs text-[#7C8BA1] hover:text-[#E6EDF7] transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#7C8BA1]" />
          <span className="hidden sm:inline">Search entities...</span>
          <kbd className="font-mono text-[10px] bg-[#16202E] px-1 py-0.5 rounded-[2px] text-[#7C8BA1] ml-1">
            Ctrl+K
          </kbd>
        </button>

        {/* Report Export Button */}
        <button
          onClick={onExportReport}
          title="Download report-ready dataset (DDL, tables, stats, snapshot)"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-xs text-[#E6EDF7] rounded-[2px] font-mono transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#5B9BFF]" />
          <span className="hidden md:inline">Export Report</span>
        </button>

        {/* Connection Settings */}
        <button
          onClick={onOpenConnectionModal}
          title="Database Configuration"
          className="p-1.5 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#7C8BA1] hover:text-[#E6EDF7] rounded-[2px] transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
