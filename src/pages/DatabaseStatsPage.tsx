import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Database,
  RotateCcw,
  RefreshCw,
  HardDrive,
  Key,
  Table,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface DatabaseStatsPageProps {
  onExecuteSqlToast: (title: string, sql: string, durationMs?: number) => void;
}

export const DatabaseStatsPage: React.FC<DatabaseStatsPageProps> = ({ onExecuteSqlToast }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleResetDatabase = async () => {
    setResetting(true);
    setResetSuccess(null);
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setResetSuccess(json.message || 'Database successfully reset from rems_project.sql.');
        onExecuteSqlToast(
          'Database Reset Completed',
          'Executed rems_project.sql (schema, tables, seed dataset restored)',
          45
        );
        fetchStats();
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setResetting(false);
      setResetModalOpen(false);
    }
  };

  const tables = stats?.tables || [];
  const indexes = stats?.indexes || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Top Bar */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#2F6BFF]" />
          <span className="font-mono font-semibold text-[#E6EDF7] tracking-wider uppercase">
            PostgreSQL Physical Catalog Metrics &amp; Maintenance
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-xs font-mono text-[#E6EDF7] rounded-[2px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#5B9BFF]" />
            <span>Refresh Stats</span>
          </button>

          <button
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-mono font-medium rounded-[2px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Database</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {resetSuccess && (
          <div className="p-3 bg-[#0C1914] border border-[#10B981]/40 text-[#10B981] rounded-[2px] font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px]">
            <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Managed Tables</span>
            <div className="text-xl font-bold font-mono text-[#E6EDF7] mt-1">
              {stats?.totalTables || 13}
            </div>
            <span className="text-[10px] font-mono text-[#5B9BFF]">Schema: rems</span>
          </div>

          <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px]">
            <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Total Row Records</span>
            <div className="text-xl font-bold font-mono text-[#E6EDF7] mt-1">
              {stats?.totalRows ? Number(stats.totalRows).toLocaleString() : '124'}
            </div>
            <span className="text-[10px] font-mono text-[#10B981]">Seed population</span>
          </div>

          <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px]">
            <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Indexes Defined</span>
            <div className="text-xl font-bold font-mono text-[#5B9BFF] mt-1">
              {indexes.length || 6}
            </div>
            <span className="text-[10px] font-mono text-[#7C8BA1]">B-Tree &amp; Composite</span>
          </div>

          <div className="bg-[#0B1018] border border-[#16202E] p-3 rounded-[2px]">
            <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Physical Storage</span>
            <div className="text-xl font-bold font-mono text-[#10B981] mt-1">
              {stats?.totalDatabaseSize || '1.42 MB'}
            </div>
            <span className="text-[10px] font-mono text-[#7C8BA1]">Heap + Index + Catalog</span>
          </div>
        </div>

        {/* Tables Storage Breakdown */}
        <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#E6EDF7] uppercase tracking-wider">
              Table Row Counts &amp; Storage Allocation
            </span>
            <span className="font-mono text-[11px] text-[#7C8BA1]">
              pg_stat_user_tables &amp; information_schema
            </span>
          </div>

          <table className="db-table">
            <thead>
              <tr>
                <th>Table Name</th>
                <th className="numeric">Row Count</th>
                <th className="numeric">Columns</th>
                <th>Primary Key</th>
                <th className="numeric">Foreign Keys</th>
                <th className="numeric">Estimated Disk Size</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t: any) => (
                <tr key={t.tableName}>
                  <td className="font-mono font-medium text-[#5B9BFF]">rems.{t.tableName}</td>
                  <td className="numeric font-mono text-[#E6EDF7] font-semibold">{t.rowCount}</td>
                  <td className="numeric font-mono text-[#7C8BA1]">{t.columnsCount}</td>
                  <td className="font-mono text-[#10B981] text-xs">{t.primaryKey}</td>
                  <td className="numeric font-mono text-[#F59E0B]">{t.foreignKeysCount}</td>
                  <td className="numeric font-mono text-[#7C8BA1]">{t.estimatedSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Index List and Sizes */}
        <div className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#E6EDF7] uppercase tracking-wider">
              B-Tree Indexes &amp; Footprint
            </span>
            <span className="font-mono text-[11px] text-[#7C8BA1]">
              pg_indexes &amp; pg_relation_size()
            </span>
          </div>

          <table className="db-table">
            <thead>
              <tr>
                <th>Index Name</th>
                <th>Target Table</th>
                <th>Indexed Attributes</th>
                <th>Type</th>
                <th className="numeric">Index Size</th>
              </tr>
            </thead>
            <tbody>
              {indexes.map((idx: any) => (
                <tr key={idx.name}>
                  <td className="font-mono font-medium text-[#10B981]">{idx.name}</td>
                  <td className="font-mono text-[#5B9BFF]">rems.{idx.table}</td>
                  <td className="font-mono text-[#E6EDF7] text-[11px]">{idx.columns}</td>
                  <td className="font-mono text-[10px] text-[#7C8BA1]">BTREE</td>
                  <td className="numeric font-mono text-[#7C8BA1]">{idx.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Demo Database */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] p-4">
          <div className="bg-[#0B1018] border border-[#EF4444]/60 w-full max-w-lg rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-xs">
            <div className="bg-[#190C0E] border-b border-[#EF4444]/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#EF4444]">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold text-xs tracking-wider uppercase font-mono">
                  Confirm Database Reset
                </span>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-[#7C8BA1] hover:text-[#E6EDF7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <p className="text-[#E6EDF7] leading-relaxed">
                Resetting the database will drop and recreate all tables in schema{' '}
                <span className="font-mono text-[#5B9BFF]">rems</span>, and re-execute the complete{' '}
                <span className="font-mono text-[#5B9BFF]">rems_project.sql</span> script. Any manual
                changes, newly inserted rows, or custom triggers will be returned to their pristine seed state.
              </p>

              <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] font-mono text-[11px] text-[#EF4444]">
                • DROP TABLE CASCADE on 13 tables<br />
                • RECREATE schema rems<br />
                • RE-SEED plants, equipment, batteries, generation, consumers, meters, and readings<br />
                • REFRESH materialized views
              </div>

              <div className="pt-2 border-t border-[#16202E] flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-xs font-mono text-[#7C8BA1] rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={resetting}
                  className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-mono font-medium rounded-[2px] cursor-pointer"
                >
                  {resetting ? 'Executing rems_project.sql...' : 'Confirm & Re-run DDL Script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
