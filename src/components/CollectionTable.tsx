import React, { useState, useMemo } from 'react';
import {
  CollectionMeta,
  Plant,
  Equipment,
  Battery,
  Generation,
  Consumer,
  Meter,
  Reading,
  Bill,
  Alert,
  CollectionKey
} from '../types/energy';
import {
  Search,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface CollectionTableProps {
  meta: CollectionMeta;
  data: any[];
  onSelectEntity?: (collection: CollectionKey, id: string) => void;
}

export const CollectionTable: React.FC<CollectionTableProps> = ({
  meta,
  data,
  onSelectEntity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>(meta.idField);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [copied, setCopied] = useState<boolean>(false);

  // Column definitions dynamically inferred or predefined
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Filter & Search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }, [filteredData, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper for rendering badges / clickable IDs
  const renderCell = (field: string, val: any, row: any) => {
    if (val === null || val === undefined) return <span className="text-slate-600">—</span>;

    // Dates
    if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
      const datePart = val.split('T')[0];
      const timePart = val.split('T')[1]?.replace('.000Z', '');
      return (
        <span className="font-mono text-xs text-slate-300" title={val}>
          {datePart} <span className="text-slate-500">{timePart}</span>
        </span>
      );
    }

    // Status / Health / Type badges
    if (field === 'status') {
      const isGood = val === 'ACTIVE' || val === 'OPERATIONAL' || val === 'PAID';
      return (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
            isGood
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
          }`}
        >
          {val}
        </span>
      );
    }

    if (field === 'health') {
      const isGood = val === 'GOOD';
      const isWarn = val === 'WARNING';
      return (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
            isGood
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isWarn
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {val}
        </span>
      );
    }

    if (field === 'type') {
      const color =
        val === 'SOLAR'
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : val === 'WIND'
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${color}`}>
          {val}
        </span>
      );
    }

    if (field === 'category') {
      const color =
        val === 'HOUSEHOLD'
          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
          : val === 'COMMERCIAL'
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          : 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${color}`}>
          {val}
        </span>
      );
    }

    if (field === 'hasSolar' || field === 'resolved') {
      return val ? (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-400 gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center text-xs text-slate-500 gap-1">
          No
        </span>
      );
    }

    // Currency
    if (field === 'amount') {
      return (
        <span className="font-mono text-emerald-400 font-semibold">
          ₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      );
    }

    // Capacity / KWh values
    if (field.toLowerCase().includes('kwh') || field.toLowerCase().includes('kw')) {
      return (
        <span className="font-mono text-slate-200">
          {Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
      );
    }

    // CO2 Avoided
    if (field === 'co2AvoidedKg') {
      return (
        <span className="font-mono text-teal-300 font-medium">
          {Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })} kg
        </span>
      );
    }

    // Foreign Key clickable links
    if (
      onSelectEntity &&
      (field === 'plantId' ||
        field === 'consumerId' ||
        field === 'meterId' ||
        (field === 'refId' && row.type))
    ) {
      let targetCollection: CollectionKey = 'plants';
      if (field === 'consumerId') targetCollection = 'consumers';
      if (field === 'meterId') targetCollection = 'meters';
      if (field === 'refId') {
        if (row.type === 'LOW_BATTERY') targetCollection = 'batteries';
        else if (row.type === 'LOW_OUTPUT') targetCollection = 'plants';
        else if (row.type === 'WARRANTY_EXPIRY') targetCollection = 'equipment';
      }

      return (
        <button
          onClick={() => onSelectEntity(targetCollection, String(val))}
          className="font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
          title={`Jump to ${targetCollection} (${val})`}
        >
          {val}
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      );
    }

    // Primary Key
    if (field === meta.idField) {
      return (
        <span className="font-mono font-bold text-xs text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60">
          {val}
        </span>
      );
    }

    return <span className="text-slate-300">{String(val)}</span>;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Collection Info & Search */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${data.length} records in ${meta.label}...`}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="text-white font-medium">{sortedData.length}</span> of{' '}
            <span className="text-white font-medium">{data.length}</span> documents
          </div>
        </div>

        {/* Actions: Export JSON, Copy, Page Size */}
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={120}>All 120 items</option>
          </select>

          <button
            onClick={handleCopyJson}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy entire collection JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title={`Download ${meta.fileName}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {meta.fileName}</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-2.5 px-3 w-12 text-center text-slate-500">#</th>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortField === col ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500">
                  No records matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowIndex = (page - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={row[meta.idField] || idx}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {rowIndex}
                    </td>
                    {columns.map(col => (
                      <td key={col} className="py-2.5 px-3 whitespace-nowrap">
                        {renderCell(col, row[col], row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Page <span className="text-white font-medium">{page}</span> of{' '}
          <span className="text-white font-medium">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
