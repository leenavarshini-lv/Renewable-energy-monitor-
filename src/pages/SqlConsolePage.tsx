import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Clock,
  Database,
  History,
  Bookmark,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { QueryResult, QueryError } from '../types/rems';
import { DestructiveModal } from '../components/DestructiveModal';

interface SqlConsolePageProps {
  onExecuteSqlToast: (title: string, sql: string, durationMs?: number) => void;
  inTransaction: boolean;
  onSetInTransaction: (active: boolean) => void;
}

export const SAVED_QUERIES = [
  {
    id: 'Q1',
    title: 'Q1: Active Solar Plants > 500kW',
    category: 'Facilities',
    sql: `SELECT plant_id, name, capacity_kw, location, commissioned_on 
FROM rems.plant 
WHERE plant_type = 'SOLAR' AND capacity_kw > 500 
ORDER BY capacity_kw DESC;`
  },
  {
    id: 'Q2',
    title: 'Q2: Daily Generation by Plant Type',
    category: 'Generation',
    sql: `SELECT p.plant_type, g.gen_date, COUNT(DISTINCT p.plant_id) AS total_plants, 
       SUM(g.units_kwh) AS total_kwh, ROUND(AVG(g.units_kwh), 2) AS avg_kwh 
FROM rems.generation_record g 
JOIN rems.plant p ON g.plant_id = p.plant_id 
GROUP BY p.plant_type, g.gen_date 
ORDER BY g.gen_date DESC, total_kwh DESC;`
  },
  {
    id: 'Q3',
    title: 'Q3: Net-Metered Monthly Billing Analysis',
    category: 'Billing',
    sql: `SELECT c.name AS consumer_name, c.category, b.bill_month, 
       b.import_kwh, b.export_kwh, b.net_kwh, b.credit_out_kwh, 
       b.amount, b.status 
FROM rems.bill b 
JOIN rems.consumer c ON b.consumer_id = c.consumer_id 
ORDER BY b.bill_month DESC, b.amount DESC;`
  },
  {
    id: 'Q4',
    title: 'Q4: Top 5 Highest CO2 Avoidance Plants',
    category: 'Carbon Credits',
    sql: `SELECT p.name, p.plant_type, 
       SUM(c.co2_avoided_kg) AS total_co2_kg, 
       SUM(c.units_kwh) AS total_kwh_generated 
FROM rems.carbon_credit c 
JOIN rems.plant p ON c.plant_id = p.plant_id 
GROUP BY p.name, p.plant_type 
ORDER BY total_co2_kg DESC 
LIMIT 5;`
  },
  {
    id: 'Q5',
    title: 'Q5: Critical Battery SoC (<20%) & Cycles',
    category: 'Storage',
    sql: `SELECT b.battery_id, p.name AS plant_name, b.capacity_kwh, 
       b.charge_pct, b.cycles 
FROM rems.battery b 
JOIN rems.plant p ON b.plant_id = p.plant_id 
WHERE b.charge_pct < 20.0 
ORDER BY b.charge_pct ASC;`
  },
  {
    id: 'Q6',
    title: 'Q6: Equipment Warranty Expiring in 60 Days',
    category: 'Equipment',
    sql: `SELECT e.equipment_id, e.equip_type, e.model, p.name AS plant_name, 
       e.warranty_end, (e.warranty_end - CURRENT_DATE) AS days_remaining, e.health 
FROM rems.equipment e 
JOIN rems.plant p ON e.plant_id = p.plant_id 
WHERE e.warranty_end BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days') 
ORDER BY days_remaining ASC;`
  },
  {
    id: 'Q7',
    title: 'Q7: Unpaid Revenue by Tariff Category',
    category: 'Billing',
    sql: `SELECT t.category, COUNT(b.bill_id) AS unpaid_bill_count, 
       SUM(b.amount) AS total_outstanding_inr 
FROM rems.bill b 
JOIN rems.consumer c ON b.consumer_id = c.consumer_id 
JOIN rems.tariff t ON c.tariff_id = t.tariff_id 
WHERE b.status = 'UNPAID' 
GROUP BY t.category 
ORDER BY total_outstanding_inr DESC;`
  },
  {
    id: 'Q8',
    title: 'Q8: Tariff Audit Log History',
    category: 'Audit',
    sql: `SELECT a.log_id, a.action, a.old_data->>'category' AS category, 
       (a.old_data->>'import_rate')::NUMERIC AS old_rate, 
       (a.new_data->>'import_rate')::NUMERIC AS new_rate, 
       a.changed_by, a.changed_at 
FROM rems.audit_log a 
WHERE a.table_name = 'tariff' 
ORDER BY a.changed_at DESC;`
  },
  {
    id: 'Q9',
    title: 'Q9: Meter Peak Import vs Export Ratio',
    category: 'Metering',
    sql: `SELECT m.meter_id, c.name AS consumer, mr.reading_date, 
       mr.import_kwh, mr.export_kwh, 
       ROUND(mr.export_kwh / NULLIF(mr.import_kwh, 0) * 100, 2) AS solar_offset_pct 
FROM rems.meter_reading mr 
JOIN rems.meter m ON mr.meter_id = m.meter_id 
JOIN rems.consumer c ON m.consumer_id = c.consumer_id 
WHERE c.has_solar = TRUE 
ORDER BY solar_offset_pct DESC NULLS LAST 
LIMIT 20;`
  },
  {
    id: 'Q10',
    title: 'Q10: Unresolved High Priority Operational Alerts',
    category: 'Alerts',
    sql: `SELECT a.alert_id, a.alert_type, a.ref_table, a.ref_id, 
       a.message, a.created_at 
FROM rems.alert a 
WHERE a.resolved = FALSE 
ORDER BY a.created_at DESC;`
  },
  {
    id: 'Q11',
    title: 'Q11: Consumer Solar vs Non-Solar Breakdown',
    category: 'Consumers',
    sql: `SELECT c.has_solar, COUNT(DISTINCT c.consumer_id) AS total_consumers, 
       ROUND(AVG(b.import_kwh), 2) AS avg_monthly_import, 
       ROUND(AVG(b.export_kwh), 2) AS avg_monthly_export, 
       ROUND(AVG(b.amount), 2) AS avg_monthly_bill 
FROM rems.consumer c 
JOIN rems.bill b ON c.consumer_id = b.consumer_id 
GROUP BY c.has_solar;`
  },
  {
    id: 'Q12',
    title: 'Q12: Meter Readings Performance Benchmark',
    category: 'Benchmark',
    sql: `SELECT meter_id, reading_date, import_kwh, export_kwh 
FROM rems.meter_reading 
WHERE meter_id = 101 AND reading_date >= '2026-10-01' 
ORDER BY reading_date;`
  }
];

export const SqlConsolePage: React.FC<SqlConsolePageProps> = ({
  onExecuteSqlToast,
  inTransaction,
  onSetInTransaction,
}) => {
  const [sql, setSql] = useState<string>(SAVED_QUERIES[0].sql);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<QueryError | null>(null);
  const [explainMode, setExplainMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'explain' | 'history'>('results');
  const [queryHistory, setQueryHistory] = useState<{ sql: string; timestamp: string; duration: number }[]>([]);
  const [sessionId] = useState<string>(() => 'sess-' + Math.random().toString(36).substring(2, 9));

  // Destructive modal state
  const [destructiveModalOpen, setDestructiveModalOpen] = useState(false);
  const [isDropSchema, setIsDropSchema] = useState(false);
  const [pendingSql, setPendingSql] = useState('');

  // Handle Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePreExecute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sql, explainMode]);

  const checkDestructive = (rawSql: string): { isDestructive: boolean; isDropSchema: boolean } => {
    const upper = rawSql.toUpperCase().trim();
    const hasWhere = upper.includes('WHERE');
    const isDeleteNoWhere = upper.startsWith('DELETE') && !hasWhere;
    const isUpdateNoWhere = upper.startsWith('UPDATE') && !hasWhere;
    const isDropTable = upper.includes('DROP TABLE');
    const isTruncate = upper.includes('TRUNCATE');
    const isAlter = upper.includes('ALTER TABLE');
    const isDropSch = upper.includes('DROP SCHEMA') || upper.includes('DROP DATABASE');

    const isDestructive = isDeleteNoWhere || isUpdateNoWhere || isDropTable || isTruncate || isAlter || isDropSch;
    return { isDestructive, isDropSchema: isDropSch };
  };

  const handlePreExecute = () => {
    if (!sql.trim()) return;
    const { isDestructive, isDropSchema } = checkDestructive(sql);
    if (isDestructive) {
      setPendingSql(sql);
      setIsDropSchema(isDropSchema);
      setDestructiveModalOpen(true);
      return;
    }
    executeSql(sql);
  };

  const executeSql = async (queryText: string) => {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: queryText,
          explain: explainMode,
          sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data);
        setResult(null);
      } else {
        setResult(data);
        setError(null);
        if (explainMode || queryText.toUpperCase().startsWith('EXPLAIN')) {
          setActiveTab('explain');
        } else {
          setActiveTab('results');
        }
        setQueryHistory((prev) => [
          { sql: queryText, timestamp: new Date().toLocaleTimeString(), duration: data.durationMs },
          ...prev.slice(0, 24),
        ]);
        onExecuteSqlToast(
          `Executed: ${data.command || 'SELECT'}`,
          queryText,
          data.durationMs
        );
      }
    } catch (err: any) {
      setError({ error: err.message });
      setResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleTransactionAction = async (action: 'begin' | 'commit' | 'rollback') => {
    setExecuting(true);
    try {
      const res = await fetch('/api/db/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        onSetInTransaction(action === 'begin');
        onExecuteSqlToast(
          action.toUpperCase(),
          `${action.toUpperCase()}; -- Transaction session: ${sessionId}`,
          5
        );
      } else {
        setError(data);
      }
    } catch (err: any) {
      setError({ error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const exportCsv = () => {
    if (!result || !result.rows || result.rows.length === 0) return;
    const headers = result.fields.map((f) => f.name).join(',');
    const rows = result.rows.map((row) =>
      result.fields
        .map((f) => {
          const val = row[f.name];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rems_query_export_${Date.now()}.csv`;
    link.click();
  };

  const copyAsSql = () => {
    if (!result || !result.rows.length) return;
    const cols = result.fields.map((f) => f.name);
    const insertStatements = result.rows
      .map(
        (r) =>
          `INSERT INTO query_result (${cols.join(', ')}) VALUES (${cols
            .map((c) => (typeof r[c] === 'string' ? `'${r[c]}'` : r[c] ?? 'NULL'))
            .join(', ')});`
      )
      .join('\n');
    navigator.clipboard.writeText(insertStatements);
    onExecuteSqlToast('Copied INSERT statements to clipboard', insertStatements.slice(0, 100) + '...', 1);
  };

  const copyAsCsv = () => {
    if (!result || !result.rows.length) return;
    const headers = result.fields.map((f) => f.name).join('\t');
    const rows = result.rows.map((r) => result.fields.map((f) => r[f.name] ?? '').join('\t'));
    navigator.clipboard.writeText([headers, ...rows].join('\n'));
    onExecuteSqlToast('Copied TSV grid to clipboard', 'Ready to paste into Google Sheets / Excel', 1);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Top Controls Toolbar */}
      <div className="h-10 bg-[#0B1018] border-b border-[#16202E] px-3 flex items-center justify-between shrink-0 text-xs">
        {/* Left: Run button & Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreExecute}
            disabled={executing}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono font-medium rounded-[2px] transition-colors cursor-pointer shadow-sm disabled:bg-[#16202E] disabled:text-[#7C8BA1]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{executing ? 'Executing...' : 'Run Query'}</span>
            <kbd className="font-mono text-[9px] bg-black/30 px-1 py-0.2 rounded-[2px]">
              Ctrl+Enter
            </kbd>
          </button>

          {/* Explain Analyze Toggle */}
          <button
            onClick={() => setExplainMode(!explainMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[2px] border font-mono transition-colors cursor-pointer ${
              explainMode
                ? 'bg-[#5B9BFF]/20 text-[#5B9BFF] border-[#5B9BFF]/50'
                : 'bg-[#101722] hover:bg-[#16202E] text-[#7C8BA1] border-[#16202E]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>EXPLAIN ANALYZE</span>
          </button>

          {/* Preset Queries Dropdown */}
          <div className="flex items-center gap-1 pl-2 border-l border-[#16202E]">
            <Bookmark className="w-3.5 h-3.5 text-[#7C8BA1]" />
            <select
              onChange={(e) => {
                const found = SAVED_QUERIES.find((q) => q.id === e.target.value);
                if (found) setSql(found.sql);
              }}
              defaultValue="Q1"
              className="bg-[#05070B] border border-[#16202E] text-[#E6EDF7] text-xs px-2 py-1 rounded-[2px] font-mono outline-none cursor-pointer"
            >
              {SAVED_QUERIES.map((q) => (
                <option key={q.id} value={q.id} className="bg-[#0B1018] text-[#E6EDF7]">
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Transaction Mode Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#7C8BA1] uppercase mr-1 hidden sm:inline">
            ACID Transaction:
          </span>
          <button
            onClick={() => handleTransactionAction('begin')}
            disabled={executing || inTransaction}
            className={`px-2 py-0.5 rounded-[2px] border font-mono text-[11px] cursor-pointer ${
              inTransaction
                ? 'bg-[#101722] text-[#7C8BA1] border-[#16202E] cursor-not-allowed'
                : 'bg-[#101722] hover:bg-[#16202E] text-[#5B9BFF] border-[#16202E]'
            }`}
          >
            BEGIN
          </button>
          <button
            onClick={() => handleTransactionAction('commit')}
            disabled={executing || !inTransaction}
            className={`px-2 py-0.5 rounded-[2px] border font-mono text-[11px] cursor-pointer ${
              !inTransaction
                ? 'bg-[#101722] text-[#7C8BA1] border-[#16202E] cursor-not-allowed'
                : 'bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border-[#10B981]/40'
            }`}
          >
            COMMIT
          </button>
          <button
            onClick={() => handleTransactionAction('rollback')}
            disabled={executing || !inTransaction}
            className={`px-2 py-0.5 rounded-[2px] border font-mono text-[11px] cursor-pointer ${
              !inTransaction
                ? 'bg-[#101722] text-[#7C8BA1] border-[#16202E] cursor-not-allowed'
                : 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border-[#EF4444]/40'
            }`}
          >
            ROLLBACK
          </button>
        </div>
      </div>

      {/* Monaco SQL Editor Split */}
      <div className="h-60 border-b border-[#16202E] relative shrink-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme="vs-dark"
          value={sql}
          onChange={(val) => setSql(val || '')}
          options={{
            fontSize: 12,
            fontFamily: 'IBM Plex Mono, monospace',
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Results Header Tabs & Action Toolbar */}
      <div className="h-9 bg-[#0E141F] border-b border-[#16202E] px-3 flex items-center justify-between shrink-0 text-xs select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'results'
                ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
            }`}
          >
            Results {result && `(${result.rowCount} rows)`}
          </button>

          {result?.plan && (
            <button
              onClick={() => setActiveTab('explain')}
              className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'explain'
                  ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                  : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
              }`}
            >
              Execution Plan
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
            }`}
          >
            History ({queryHistory.length})
          </button>
        </div>

        {/* Execution Metrics & Grid Export Tools */}
        <div className="flex items-center gap-3">
          {result && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#7C8BA1]">
              <span className="flex items-center gap-1 text-[#10B981]">
                <Clock className="w-3 h-3" />
                {result.durationMs}ms
              </span>
              <span>•</span>
              <span className="text-[#E6EDF7]">{result.rowCount} rows</span>
            </div>
          )}

          {result && result.rows.length > 0 && activeTab === 'results' && (
            <div className="flex items-center gap-1.5 border-l border-[#16202E] pl-2">
              <button
                onClick={copyAsSql}
                title="Copy rows as SQL INSERT statements"
                className="p-1 hover:bg-[#16202E] text-[#7C8BA1] hover:text-[#5B9BFF] rounded-[2px]"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={copyAsCsv}
                title="Copy grid data to clipboard (TSV)"
                className="p-1 hover:bg-[#16202E] text-[#7C8BA1] hover:text-[#5B9BFF] rounded-[2px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={exportCsv}
                title="Download CSV file"
                className="p-1 hover:bg-[#16202E] text-[#7C8BA1] hover:text-[#10B981] rounded-[2px]"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Panel if query failed */}
      {error && (
        <div className="bg-[#190C0E] border-b border-[#EF4444]/40 p-3 font-mono text-xs flex flex-col gap-1 text-[#EF4444] shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>ERROR [{error.code || '42000'}]: {error.error}</span>
          </div>
          {error.detail && <div className="text-[11px] text-[#EF4444]/80 ml-6">DETAIL: {error.detail}</div>}
          {error.hint && <div className="text-[11px] text-[#5B9BFF] ml-6">HINT: {error.hint}</div>}
        </div>
      )}

      {/* Tab Panels: Results Grid / Execution Plan / History */}
      <div className="flex-1 overflow-auto bg-[#05070B] relative">
        {activeTab === 'results' && (
          <>
            {!result && !error && (
              <div className="h-full flex items-center justify-center font-mono text-xs text-[#7C8BA1]">
                Execute a query or choose a preset query to view PostgreSQL results.
              </div>
            )}

            {result && result.rows.length === 0 && (
              <div className="h-full flex items-center justify-center font-mono text-xs text-[#7C8BA1]">
                Query executed successfully. 0 rows returned.
              </div>
            )}

            {result && result.rows.length > 0 && (
              <table className="db-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center text-[#7C8BA1]">#</th>
                    {result.fields.map((field) => {
                      const isNumeric = result.rows.some(
                        (r) => typeof r[field.name] === 'number'
                      );
                      return (
                        <th
                          key={field.name}
                          className={isNumeric ? 'numeric' : 'text-left'}
                        >
                          {field.name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-center text-[#7C8BA1] text-[10px]">
                        {idx + 1}
                      </td>
                      {result.fields.map((field) => {
                        const val = row[field.name];
                        const isNum = typeof val === 'number';
                        return (
                          <td
                            key={field.name}
                            className={`font-mono text-xs ${
                              isNum ? 'numeric text-[#5B9BFF]' : 'text-[#E6EDF7]'
                            }`}
                          >
                            {val === null || val === undefined ? (
                              <span className="text-[#7C8BA1]/50 italic">null</span>
                            ) : typeof val === 'boolean' ? (
                              <span className={val ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                                {String(val)}
                              </span>
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Explain Analyze Tab */}
        {activeTab === 'explain' && result?.plan && (
          <div className="p-4 flex flex-col gap-3 font-mono text-xs text-[#E6EDF7]">
            <div className="flex items-center justify-between pb-2 border-b border-[#16202E]">
              <span className="text-[#5B9BFF] font-semibold">
                PostgreSQL Query Planner Node Tree (EXPLAIN ANALYZE)
              </span>
              <span className="text-[11px] text-[#7C8BA1]">
                Execution: {result.durationMs}ms
              </span>
            </div>
            <pre className="p-3 bg-[#0B1018] border border-[#16202E] rounded-[2px] text-[11px] text-[#A6C0FE] overflow-x-auto whitespace-pre">
              {typeof result.plan === 'string'
                ? result.plan
                : JSON.stringify(result.plan, null, 2)}
            </pre>
          </div>
        )}

        {/* Query History Tab */}
        {activeTab === 'history' && (
          <div className="p-3 flex flex-col gap-2">
            {queryHistory.length === 0 ? (
              <div className="p-6 text-center text-[#7C8BA1] font-mono text-xs">
                No queries executed in this session yet.
              </div>
            ) : (
              queryHistory.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#0B1018] border border-[#16202E] rounded-[2px] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex flex-col truncate max-w-xl">
                    <span className="text-[#E6EDF7] truncate">{h.sql}</span>
                    <span className="text-[10px] text-[#7C8BA1]">
                      {h.timestamp} • {h.duration}ms
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSql(h.sql);
                      setActiveTab('results');
                    }}
                    className="px-2 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#5B9BFF] text-[11px] rounded-[2px] cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Destructive Safeguard Modal */}
      <DestructiveModal
        isOpen={destructiveModalOpen}
        sql={pendingSql}
        isDropSchema={isDropSchema}
        onConfirm={() => {
          setDestructiveModalOpen(false);
          executeSql(pendingSql);
        }}
        onCancel={() => setDestructiveModalOpen(false)}
      />
    </div>
  );
};
