import React, { useState } from 'react';
import { CollectionMeta } from '../types/energy';
import { Copy, Check, Download, FileJson, Search, ExternalLink } from 'lucide-react';

interface JsonViewerProps {
  meta: CollectionMeta;
  data: any[];
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ meta, data }) => {
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');

  const jsonString = React.useMemo(() => {
    if (selectedDocId === 'ALL') {
      if (!filterText.trim()) {
        return JSON.stringify(data, null, 2);
      }
      const filtered = data.filter(d =>
        JSON.stringify(d).toLowerCase().includes(filterText.toLowerCase())
      );
      return JSON.stringify(filtered, null, 2);
    } else {
      const doc = data.find(d => String(d[meta.idField]) === selectedDocId);
      return JSON.stringify(doc || {}, null, 2);
    }
  }, [data, selectedDocId, filterText, meta.idField]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedDocId === 'ALL' ? meta.fileName : `${meta.key}_${selectedDocId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Header bar */}
      <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white font-mono">{meta.fileName}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {data.length} docs
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Primary Key: <code className="text-emerald-400 font-mono">{meta.idField}</code>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Document selector */}
          <select
            value={selectedDocId}
            onChange={e => setSelectedDocId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Entire Collection ({data.length} docs)</option>
            {data.slice(0, 50).map(d => (
              <option key={d[meta.idField]} value={String(d[meta.idField])}>
                Doc: {d[meta.idField]}
              </option>
            ))}
          </select>

          {/* Quick search */}
          {selectedDocId === 'ALL' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter JSON text..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-40"
              />
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
        <pre className="whitespace-pre">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
