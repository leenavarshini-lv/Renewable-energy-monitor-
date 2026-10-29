import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DestructiveModalProps {
  isOpen: boolean;
  sql: string;
  isDropSchema: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DestructiveModal: React.FC<DestructiveModalProps> = ({
  isOpen,
  sql,
  isDropSchema,
  onConfirm,
  onCancel,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');

  if (!isOpen) return null;

  const canExecute = !isDropSchema || typedConfirmation.trim().toLowerCase() === 'rems';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] p-4">
      <div className="bg-[#0B1018] border border-[#EF4444]/60 w-full max-w-lg rounded-[3px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#190C0E] border-b border-[#EF4444]/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-wider uppercase font-mono">
              Destructive Query Safeguard
            </span>
          </div>
          <button onClick={onCancel} className="text-[#7C8BA1] hover:text-[#E6EDF7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 text-xs">
          <p className="text-[#E6EDF7] leading-relaxed">
            This SQL statement involves destructive or structural modifications. Please review carefully before proceeding:
          </p>

          <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] font-mono text-[11px] text-[#EF4444] max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
            {sql}
          </div>

          {isDropSchema && (
            <div className="flex flex-col gap-1.5 mt-2 bg-[#0E141F] border border-[#16202E] p-3 rounded-[2px]">
              <label className="text-[11px] text-[#E6EDF7] font-medium">
                To confirm schema/database destruction, type <span className="font-mono text-[#EF4444]">rems</span> below:
              </label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="type 'rems' to confirm"
                className="bg-[#05070B] border border-[#16202E] focus:border-[#EF4444] px-2.5 py-1.5 text-xs text-[#E6EDF7] font-mono outline-none rounded-[2px]"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#080D14] border-t border-[#16202E] px-4 py-3 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-[#101722] hover:bg-[#16202E] text-[#7C8BA1] hover:text-[#E6EDF7] border border-[#16202E] rounded-[2px] text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canExecute}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-medium font-mono cursor-pointer transition-colors ${
              canExecute
                ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                : 'bg-[#EF4444]/30 text-white/40 cursor-not-allowed'
            }`}
          >
            Execute Destructive Query
          </button>
        </div>
      </div>
    </div>
  );
};
