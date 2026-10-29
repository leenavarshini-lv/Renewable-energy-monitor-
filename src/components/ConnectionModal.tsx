import React, { useState } from 'react';
import { Database, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DBStatus } from '../types/rems';

interface ConnectionModalProps {
  isOpen: boolean;
  status: DBStatus | null;
  onClose: () => void;
  onConnect: (url: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onRefresh: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  status,
  onClose,
  onConnect,
  onDisconnect,
  onRefresh,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onConnect(url.trim());
      setSuccessMsg('Successfully connected to PostgreSQL database!');
      setUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onDisconnect();
      setSuccessMsg('Switched back to emulated PostgreSQL mode.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] p-4">
      <div className="bg-[#0B1018] border border-[#16202E] w-full max-w-lg rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-[#0E141F] border-b border-[#16202E] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#2F6BFF]" />
            <span className="font-semibold text-xs tracking-wider uppercase font-mono text-[#E6EDF7]">
              PostgreSQL Database Connection
            </span>
          </div>
          <button onClick={onClose} className="text-[#7C8BA1] hover:text-[#E6EDF7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Box */}
        <div className="p-4 flex flex-col gap-3">
          <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#7C8BA1]">Active Engine:</span>
              <span className="font-mono flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.mode === 'postgres' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                  }`}
                />
                <span className={status?.mode === 'postgres' ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                  {status?.mode === 'postgres' ? 'Live PostgreSQL Pool' : 'PostgreSQL Emulated Engine'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#7C8BA1]">Database Name:</span>
              <span className="font-mono text-[#E6EDF7]">{status?.dbName || 'rems'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#7C8BA1]">Host / Server:</span>
              <span className="font-mono text-[#E6EDF7]">{status?.host || 'localhost'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#7C8BA1]">PostgreSQL Version:</span>
              <span className="font-mono text-[#7C8BA1]">{status?.version || 'PostgreSQL 16'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#7C8BA1]">Managed Tables:</span>
              <span className="font-mono text-[#5B9BFF]">{status?.tableCount || 13} tables in schema 'rems'</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-[#190C0E] border border-[#EF4444]/40 text-[#EF4444] rounded-[2px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-all">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-[#0C1914] border border-[#10B981]/40 text-[#10B981] rounded-[2px] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Connect Form */}
          <form onSubmit={handleConnect} className="flex flex-col gap-2 mt-1">
            <label className="text-[11px] text-[#7C8BA1] font-medium">
              Connect to External PostgreSQL Database (Neon / Supabase / Railway / Local):
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="postgresql://user:password@host:5432/dbname?sslmode=require"
              className="bg-[#05070B] border border-[#16202E] focus:border-[#2F6BFF] px-2.5 py-1.5 text-xs text-[#E6EDF7] font-mono outline-none rounded-[2px]"
            />
            <p className="text-[11px] text-[#7C8BA1] leading-relaxed">
              DATABASE_URL lives securely on the Express server backend only. The browser never connects directly to the database.
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#16202E]">
              {status?.mode === 'postgres' ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-[#EF4444] rounded-[2px] font-mono font-medium cursor-pointer"
                >
                  Disconnect from Live PG
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="flex items-center gap-1.5 text-[#7C8BA1] hover:text-[#E6EDF7]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className={`px-3 py-1.5 rounded-[2px] font-mono font-medium cursor-pointer transition-colors ${
                  loading || !url.trim()
                    ? 'bg-[#16202E] text-[#7C8BA1] cursor-not-allowed'
                    : 'bg-[#2F6BFF] hover:bg-[#5B9BFF] text-white'
                }`}
              >
                {loading ? 'Testing Connection...' : 'Connect to Database'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
