import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertTriangle,
  Code2,
  Check,
} from 'lucide-react';
import { TableMeta, TableColumn } from '../types/rems';

interface TableBrowserPageProps {
  initialTable?: string;
  onExecuteSqlToast: (title: string, sql: string, durationMs?: number) => void;
}

export const TableBrowserPage: React.FC<TableBrowserPageProps> = ({
  initialTable = 'plant',
  onExecuteSqlToast,
}) => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form modal state
  const [modalMode, setModalMode] = useState<'insert' | 'edit' | 'delete' | null>(null);
  const [activeRow, setActiveRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch schema tables
  useEffect(() => {
    fetch('/api/db/schema')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          setTables(data.tables);
          if (!selectedTable && data.tables.length > 0) {
            setSelectedTable(data.tables[0].tableName);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch table rows
  const fetchTableData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(sortBy ? { sortBy, sortDir } : {}),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/db/tables/${selectedTable}?${queryParams}`);
      const data = await res.json();
      setRows(data.rows || []);
      setTotalRows(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [selectedTable, page, sortBy, sortDir]);

  const currentTableMeta = tables.find((t) => t.tableName === selectedTable);
  const columns: TableColumn[] = currentTableMeta?.columns || [];
  const pkCol = columns.find((c) => c.isPrimaryKey)?.columnName || `${selectedTable}_id`;

  // Compute live SQL preview for modal
  const computeLiveSql = (): string => {
    if (!modalMode || !currentTableMeta) return '';
    if (modalMode === 'insert') {
      const cols = Object.keys(formData).filter((k) => formData[k] !== undefined && formData[k] !== '');
      const vals = cols.map((k) => {
        const v = formData[k];
        if (typeof v === 'string') return `'${v}'`;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return v;
      });
      return `INSERT INTO rems.${selectedTable} (${cols.join(', ')})\nVALUES (${vals.join(', ')})\nRETURNING *;`;
    }
    if (modalMode === 'edit') {
      const assignments = Object.keys(formData)
        .filter((k) => k !== pkCol)
        .map((k) => {
          const v = formData[k];
          const formatted = typeof v === 'string' ? `'${v}'` : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : v;
          return `${k} = ${formatted}`;
        });
      return `UPDATE rems.${selectedTable}\nSET ${assignments.join(',\n    ')}\nWHERE ${pkCol} = ${activeRow[pkCol]}\nRETURNING *;`;
    }
    if (modalMode === 'delete') {
      return `DELETE FROM rems.${selectedTable}\nWHERE ${pkCol} = ${activeRow?.[pkCol]}\nRETURNING *;`;
    }
    return '';
  };

  const handleOpenInsert = () => {
    const initData: Record<string, any> = {};
    columns.forEach((c) => {
      if (!c.isPrimaryKey) {
        initData[c.columnName] = c.dataType === 'boolean' ? false : '';
      }
    });
    setFormData(initData);
    setConstraintError(null);
    setModalMode('insert');
  };

  const handleOpenEdit = (row: any) => {
    setActiveRow(row);
    setFormData({ ...row });
    setConstraintError(null);
    setModalMode('edit');
  };

  const handleOpenDelete = (row: any) => {
    setActiveRow(row);
    setConstraintError(null);
    setModalMode('delete');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setConstraintError(null);
    const sqlPreview = computeLiveSql();

    try {
      if (modalMode === 'insert') {
        const res = await fetch(`/api/db/tables/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: formData }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Insert failed');
        onExecuteSqlToast(`INSERT INTO ${selectedTable}`, sqlPreview, 14);
      } else if (modalMode === 'edit') {
        const idVal = activeRow[pkCol];
        const res = await fetch(`/api/db/tables/${selectedTable}/${idVal}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: formData, idCol: pkCol }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Update failed');
        onExecuteSqlToast(`UPDATE ${selectedTable}`, sqlPreview, 12);
      } else if (modalMode === 'delete') {
        const idVal = activeRow[pkCol];
        const res = await fetch(`/api/db/tables/${selectedTable}/${idVal}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idCol: pkCol }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Delete failed');
        onExecuteSqlToast(`DELETE FROM ${selectedTable}`, sqlPreview, 10);
      }

      setModalMode(null);
      fetchTableData();
    } catch (err: any) {
      setConstraintError(err.message || 'Operation failed due to database constraint violation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Top Table Selector & Toolbar */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs">
        {/* Table Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[#E6EDF7] font-semibold">
            <TableProperties className="w-4 h-4 text-[#2F6BFF]" />
            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setPage(1);
                setSortBy('');
              }}
              className="bg-[#05070B] border border-[#16202E] text-[#E6EDF7] text-xs px-2.5 py-1 rounded-[2px] font-mono outline-none cursor-pointer"
            >
              {tables.map((t) => (
                <option key={t.tableName} value={t.tableName} className="bg-[#0B1018]">
                  rems.{t.tableName} ({t.rowCount} rows)
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-mono text-[#7C8BA1]">
            {totalRows} records
          </span>
        </div>

        {/* Actions & Insert Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTableData}
            title="Refresh rows"
            className="p-1.5 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#7C8BA1] hover:text-[#E6EDF7] rounded-[2px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenInsert}
            className="flex items-center gap-1 px-3 py-1 bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white font-mono text-xs rounded-[2px] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert Row</span>
          </button>
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="flex-1 overflow-auto bg-[#05070B] relative">
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-mono text-xs text-[#5B9BFF] z-20">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Querying rems.{selectedTable}...
          </div>
        )}

        {rows.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center font-mono text-xs text-[#7C8BA1]">
            No records found in table rems.{selectedTable}.
          </div>
        ) : (
          <table className="db-table">
            <thead>
              <tr>
                <th className="w-16 text-center text-[#7C8BA1]">Actions</th>
                {columns.map((col) => {
                  const isSorted = sortBy === col.columnName;
                  return (
                    <th
                      key={col.columnName}
                      onClick={() => {
                        if (sortBy === col.columnName) {
                          setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
                        } else {
                          setSortBy(col.columnName);
                          setSortDir('ASC');
                        }
                      }}
                      className="cursor-pointer hover:text-[#E6EDF7]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={col.isPrimaryKey ? 'text-[#5B9BFF] font-bold' : ''}>
                          {col.columnName}
                        </span>
                        {col.isPrimaryKey && (
                          <span className="text-[9px] font-mono text-[#5B9BFF] border border-[#2F6BFF]/50 px-0.5 rounded-[1px]">
                            PK
                          </span>
                        )}
                        {col.foreignKey && (
                          <span
                            title={`References rems.${col.foreignKey.foreignTable}(${col.foreignKey.foreignColumn})`}
                            className="text-[9px] font-mono text-[#F59E0B] border border-[#F59E0B]/50 px-0.5 rounded-[1px]"
                          >
                            FK
                          </span>
                        )}
                        {isSorted && (
                          <span className="text-[#2F6BFF] text-[10px]">
                            {sortDir === 'ASC' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center font-mono text-xs">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(row)}
                        title="Edit row"
                        className="p-1 text-[#7C8BA1] hover:text-[#5B9BFF] rounded-[2px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(row)}
                        title="Delete row"
                        className="p-1 text-[#7C8BA1] hover:text-[#EF4444] rounded-[2px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  {columns.map((col) => {
                    const val = row[col.columnName];
                    const isNum = typeof val === 'number';
                    return (
                      <td
                        key={col.columnName}
                        className={`font-mono text-xs ${
                          isNum ? 'numeric text-[#5B9BFF]' : 'text-[#E6EDF7]'
                        }`}
                      >
                        {val === null || val === undefined ? (
                          <span className="text-[#7C8BA1]/40 italic">null</span>
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
      </div>

      {/* Pagination Footer */}
      <div className="h-10 bg-[#0B1018] border-t border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs font-mono">
        <span className="text-[#7C8BA1]">
          Showing {Math.min(rows.length, (page - 1) * limit + 1)} -{' '}
          {Math.min(totalRows, page * limit)} of {totalRows} rows
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#E6EDF7] rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[#E6EDF7]">
            Page {page} of {Math.max(1, Math.ceil(totalRows / limit))}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalRows / limit)}
            className="p-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#E6EDF7] rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add / Edit / Delete Modal with Live SQL Preview */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] p-4">
          <div className="bg-[#0B1018] border border-[#16202E] w-full max-w-xl rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-xs max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0E141F] border-b border-[#16202E] px-4 py-3 flex items-center justify-between">
              <span className="font-mono font-semibold text-xs tracking-wider uppercase text-[#E6EDF7]">
                {modalMode === 'insert' && `Insert Row into rems.${selectedTable}`}
                {modalMode === 'edit' && `Edit Row in rems.${selectedTable}`}
                {modalMode === 'delete' && `Delete Row from rems.${selectedTable}`}
              </span>
              <button
                onClick={() => setModalMode(null)}
                className="text-[#7C8BA1] hover:text-[#E6EDF7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-4 flex flex-col gap-3 overflow-y-auto">
              {constraintError && (
                <div className="p-2.5 bg-[#190C0E] border border-[#EF4444]/40 text-[#EF4444] rounded-[2px] font-mono text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="break-all">{constraintError}</span>
                </div>
              )}

              {modalMode === 'delete' ? (
                <p className="text-[#E6EDF7] leading-relaxed">
                  Are you sure you want to permanently delete record{' '}
                  <span className="font-mono text-[#EF4444]">
                    {pkCol} = {activeRow?.[pkCol]}
                  </span>{' '}
                  from <span className="font-mono text-[#5B9BFF]">rems.{selectedTable}</span>?
                  Foreign key constraints may cascade or reject this deletion.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {columns.map((col) => {
                    const isPk = col.isPrimaryKey;
                    return (
                      <div key={col.columnName} className="flex flex-col gap-1">
                        <label className="text-[11px] font-mono text-[#7C8BA1] flex items-center justify-between">
                          <span className={isPk ? 'text-[#5B9BFF]' : 'text-[#E6EDF7]'}>
                            {col.columnName}
                          </span>
                          <span className="text-[9px] text-[#7C8BA1]/70">
                            {col.dataType}
                          </span>
                        </label>

                        {col.dataType === 'boolean' ? (
                          <select
                            value={String(formData[col.columnName] ?? false)}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [col.columnName]: e.target.value === 'true',
                              })
                            }
                            className="bg-[#05070B] border border-[#16202E] text-[#E6EDF7] text-xs px-2.5 py-1.5 rounded-[2px] font-mono outline-none"
                          >
                            <option value="true">TRUE</option>
                            <option value="false">FALSE</option>
                          </select>
                        ) : (
                          <input
                            type={
                              col.dataType.includes('int') || col.dataType.includes('numeric')
                                ? 'number'
                                : col.dataType === 'date'
                                ? 'date'
                                : 'text'
                            }
                            step={col.dataType.includes('numeric') ? '0.01' : undefined}
                            value={formData[col.columnName] ?? ''}
                            disabled={isPk && modalMode === 'edit'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [col.columnName]: e.target.value,
                              })
                            }
                            placeholder={isPk ? 'auto-generated sequence' : ''}
                            className="bg-[#05070B] border border-[#16202E] focus:border-[#2F6BFF] text-[#E6EDF7] text-xs px-2.5 py-1.5 rounded-[2px] font-mono outline-none disabled:opacity-50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live SQL Preview Panel */}
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5B9BFF]">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Live SQL Preview (Before Execution):</span>
                </div>
                <pre className="p-2.5 bg-[#05070B] border border-[#16202E] rounded-[2px] font-mono text-[11px] text-[#A6C0FE] overflow-x-auto whitespace-pre-wrap">
                  {computeLiveSql()}
                </pre>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#16202E] mt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3 py-1.5 bg-[#101722] hover:bg-[#16202E] text-[#7C8BA1] hover:text-[#E6EDF7] border border-[#16202E] rounded-[2px] font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-3 py-1.5 rounded-[2px] font-mono text-xs font-medium cursor-pointer transition-colors ${
                    modalMode === 'delete'
                      ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                      : 'bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white'
                  }`}
                >
                  {submitting
                    ? 'Executing...'
                    : modalMode === 'delete'
                    ? 'Confirm Delete'
                    : 'Execute & Persist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
