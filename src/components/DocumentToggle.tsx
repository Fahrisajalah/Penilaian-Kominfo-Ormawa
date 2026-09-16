import React from 'react';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';

interface DocumentToggleProps {
  id: string;
  label: string;
  description: string;
  isAvailable: boolean;
  onToggle: (val: boolean) => void;
}

export const DocumentToggle: React.FC<DocumentToggleProps> = ({
  id,
  label,
  description,
  isAvailable,
  onToggle,
}) => {
  return (
    <div
      id={`doc-card-${id}`}
      className={`p-4 rounded-xl border transition-all duration-200 ${
        isAvailable
          ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
          : 'bg-slate-50/80 border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg mt-0.5 sm:mt-0 ${
              isAvailable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 text-base">{label}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isAvailable ? 'Ada' : 'Tidak Ada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center bg-white p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            id={`btn-ada-${id}`}
            onClick={() => onToggle(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isAvailable
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ada
          </button>
          <button
            type="button"
            id={`btn-tidak-ada-${id}`}
            onClick={() => onToggle(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !isAvailable
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Tidak Ada
          </button>
        </div>
      </div>
    </div>
  );
};
