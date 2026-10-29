import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, User, AlertCircle, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types/rems';

interface SearchResult {
  type: 'plant' | 'consumer' | 'alert';
  id: number;
  title: string;
  subtitle: string;
  targetView: ViewMode;
  targetTable?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode, targetTable?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/db/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-[1px] p-4">
      <div className="bg-[#0B1018] border border-[#16202E] w-full max-w-xl rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#16202E] bg-[#0E141F]">
          <Search className="w-4 h-4 text-[#7C8BA1] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plants, consumers, alerts (e.g. Bhadla, Arun, Low SoC)..."
            className="w-full bg-transparent text-[#E6EDF7] text-xs outline-none font-sans placeholder:text-[#7C8BA1]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#7C8BA1] hover:text-[#E6EDF7]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="font-mono text-[10px] bg-[#16202E] text-[#7C8BA1] px-1.5 py-0.5 rounded-[2px] border border-[#16202E]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {loading && (
            <div className="p-4 text-center text-[#7C8BA1] text-xs font-mono">
              Searching database...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-[#7C8BA1] text-xs">
              No matching plants, consumers, or alerts found for "{query}".
            </div>
          )}

          {!query && (
            <div className="p-4 text-center text-[#7C8BA1] text-xs">
              Type keywords to search across plants, consumers, and system alerts.
            </div>
          )}

          {results.map((item, i) => (
            <button
              key={`${item.type}-${item.id}-${i}`}
              onClick={() => {
                onNavigate(item.targetView, item.targetTable);
                onClose();
              }}
              className="flex items-center justify-between p-2 hover:bg-[#111824] rounded-[2px] transition-colors text-left group cursor-pointer border border-transparent hover:border-[#16202E]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-1 rounded-[2px] bg-[#05070B] border border-[#16202E] shrink-0 text-[#2F6BFF]">
                  {item.type === 'plant' && <Zap className="w-3.5 h-3.5" />}
                  {item.type === 'consumer' && <User className="w-3.5 h-3.5" />}
                  {item.type === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />}
                </div>
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#E6EDF7] truncate">{item.title}</span>
                    <span className="font-mono text-[10px] uppercase text-[#7C8BA1] bg-[#16202E] px-1 py-0.2 rounded-[2px]">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7C8BA1] truncate">{item.subtitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#7C8BA1] group-hover:text-[#5B9BFF] shrink-0 ml-2">
                <span className="text-[10px] font-mono">Open</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
