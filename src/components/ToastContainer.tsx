import React from 'react';
import { ToastItem } from '../types/rems';
import { CheckCircle2, AlertCircle, Info, Copy, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-lg w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#0B1018] border border-[#16202E] p-3 shadow-2xl rounded-[3px] flex flex-col gap-1.5 transition-all text-xs border-l-4"
          style={{
            borderLeftColor:
              toast.type === 'success'
                ? '#10B981'
                : toast.type === 'error'
                ? '#EF4444'
                : '#2F6BFF',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-[#E6EDF7]">
              {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
              {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />}
              {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-[#2F6BFF]" />}
              <span>{toast.title}</span>
              {toast.durationMs !== undefined && (
                <span className="font-mono text-[10px] text-[#7C8BA1] bg-[#16202E] px-1 py-0.5 rounded-[2px]">
                  {toast.durationMs}ms
                </span>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#7C8BA1] hover:text-[#E6EDF7] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {toast.sql && (
            <div className="flex items-start justify-between bg-[#05070B] border border-[#16202E] p-1.5 rounded-[2px] font-mono text-[11px] text-[#A6C0FE] overflow-x-auto gap-2">
              <span className="break-all whitespace-pre-wrap">{toast.sql}</span>
              <button
                onClick={() => copyToClipboard(toast.sql!)}
                title="Copy SQL"
                className="text-[#7C8BA1] hover:text-[#5B9BFF] shrink-0 p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
