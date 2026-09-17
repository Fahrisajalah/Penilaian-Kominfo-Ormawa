import React from 'react';
import {
  Share2,
  Plus,
  Minus,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { getMedpartLevel } from '../utils/calculator';

interface KeaktifanMedpartCardProps {
  jumlahMedpart?: number;
  onChange: (count: number) => void;
}

export const KeaktifanMedpartCard: React.FC<KeaktifanMedpartCardProps> = ({
  jumlahMedpart = 0,
  onChange,
}) => {
  const currentCount = Math.max(0, Math.floor(Number(jumlahMedpart) || 0));
  const levelInfo = getMedpartLevel(currentCount);

  const handleIncrement = () => {
    onChange(currentCount + 1);
  };

  const handleDecrement = () => {
    if (currentCount > 0) {
      onChange(currentCount - 1);
    }
  };

  const handleDirectInput = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      onChange(0);
    } else {
      onChange(parsed);
    }
  };

  return (
    <div
      id="keaktifan-medpart-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4"
    >
      {/* Header with Title and Level Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Keaktifan Media Partner (Medpart)
            </h3>
            {/* Status Level Badge */}
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border transition-colors ${levelInfo.badgeClass}`}
            >
              {currentCount} Kali • {levelInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Frekuensi kolaborasi publikasi & pengajuan media partner ormawa ke Kominfo
          </p>
        </div>

        {/* Quick Reset to 0 */}
        {currentCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg font-medium transition-colors flex items-center gap-1 self-start sm:self-auto"
            title="Reset jumlah medpart ke 0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset (0)
          </button>
        )}
      </div>

      {/* Interactive Stepper & Direct Input */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-700 block">
            Frekuensi Bermedpart:
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
            {levelInfo.description}
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2">
          {/* Decrement Button */}
          <button
            type="button"
            id="btn-decrement-medpart"
            onClick={handleDecrement}
            disabled={currentCount === 0}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              currentCount === 0
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 active:scale-95 shadow-2xs'
            }`}
            title="Kurang 1 kali medpart"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Number Display & Input */}
          <div className="relative">
            <input
              type="number"
              id="input-jumlah-medpart"
              min="0"
              step="1"
              value={currentCount}
              onChange={(e) => handleDirectInput(e.target.value)}
              className="w-20 sm:w-24 text-center font-mono font-extrabold text-xl py-1.5 px-2 bg-white border border-slate-300 rounded-xl text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium">
              Kali
            </span>
          </div>

          {/* Increment Button */}
          <button
            type="button"
            id="btn-increment-medpart"
            onClick={handleIncrement}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all active:scale-95 shadow-2xs"
            title="Tambah 1 kali medpart"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="pt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Pilihan Cepat:
        </span>
        {[0, 1, 2, 3, 4, 5, 8, 10].map((preset) => (
          <button
            key={preset}
            type="button"
            id={`btn-preset-medpart-${preset}`}
            onClick={() => onChange(preset)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
              currentCount === preset
                ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {preset === 0 ? '0 (Belum)' : `${preset}x`}
          </button>
        ))}
      </div>

      {/* Helpful context notice */}
      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-950">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Data keaktifan: <strong>{currentCount} Kali</strong> ({levelInfo.label}).
          </span>
        </div>
        <span className="text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium">
          Otomatis muncul di kolom Excel saat download
        </span>
      </div>
    </div>
  );
};
