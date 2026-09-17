import React, { useState } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { WeightSettings } from '../types';
import { DEFAULT_WEIGHTS } from '../utils/calculator';

interface WeightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: WeightSettings;
  onSaveWeights: (newWeights: WeightSettings) => void;
}

export const WeightSettingsModal: React.FC<WeightSettingsModalProps> = ({
  isOpen,
  onClose,
  weights,
  onSaveWeights,
}) => {
  const [bKelengkapan, setBKelengkapan] = useState<number>(weights.bobotKelengkapan);
  const [bKualitas, setBKualitas] = useState<number>(weights.bobotKualitas);
  const [autoBalance, setAutoBalance] = useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen) {
      setBKelengkapan(weights.bobotKelengkapan);
      setBKualitas(weights.bobotKualitas);
    }
  }, [isOpen, weights]);

  if (!isOpen) return null;

  const handleKelengkapanChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setBKelengkapan(clamped);
    if (autoBalance) {
      setBKualitas(100 - clamped);
    }
  };

  const handleKualitasChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setBKualitas(clamped);
    if (autoBalance) {
      setBKelengkapan(100 - clamped);
    }
  };

  const handlePreset = (k: number, q: number) => {
    setBKelengkapan(k);
    setBKualitas(q);
  };

  const handleReset = () => {
    setBKelengkapan(DEFAULT_WEIGHTS.bobotKelengkapan);
    setBKualitas(DEFAULT_WEIGHTS.bobotKualitas);
  };

  const handleBalanceTo100 = () => {
    const sum = bKelengkapan + bKualitas;
    if (sum === 0) {
      setBKelengkapan(60);
      setBKualitas(40);
      return;
    }
    const newK = Math.round((bKelengkapan / sum) * 100);
    setBKelengkapan(newK);
    setBKualitas(100 - newK);
  };

  const handleSave = () => {
    onSaveWeights({
      bobotKelengkapan: bKelengkapan,
      bobotKualitas: bKualitas,
    });
    onClose();
  };

  const total = bKelengkapan + bKualitas;
  const isPerfect100 = total === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Kustomisasi Bobot Persentase Penilaian
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan porsi kontribusi kelengkapan dokumen vs kualitas file
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Total Bobot */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              isPerfect100
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isPerfect100 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                Total Bobot: <strong>{total}%</strong> {isPerfect100 ? '(Ideal = 100%)' : '(Bukan 100%)'}
              </span>
            </div>
            {!isPerfect100 && (
              <button
                type="button"
                onClick={handleBalanceTo100}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
              >
                Seimbangkan ke 100%
              </button>
            )}
          </div>

          {/* Setting 1: Bobot Kelengkapan Dokumen */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-800 block">
                  1. Bobot Kelengkapan Dokumen
                </label>
                <span className="text-[11px] text-slate-500">
                  Kontribusi dari kelengkapan berkas yang diserahkan
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bKelengkapan}
                  onChange={(e) => handleKelengkapanChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bKelengkapan}
              onChange={(e) => handleKelengkapanChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Setting 2: Bobot Skor Kualitas File */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-800 block">
                  2. Bobot Kualitas File
                </label>
                <span className="text-[11px] text-slate-500">
                  Kontribusi dari mutu atau kerapian berkas (skor 1-10)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bKualitas}
                  onChange={(e) => handleKualitasChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bKualitas}
              onChange={(e) => handleKualitasChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Auto Balance Toggle & Presets */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={autoBalance}
                  onChange={(e) => setAutoBalance(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Otomatis sesuaikan pasangan bobot agar total selalu 100%</span>
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Standar
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Preset:
              </span>
              {[
                { k: 60, q: 40, label: '60% : 40% (Standar)' },
                { k: 70, q: 30, label: '70% : 30%' },
                { k: 50, q: 50, label: '50% : 50%' },
                { k: 80, q: 20, label: '80% : 20%' },
                { k: 40, q: 60, label: '40% : 60%' },
              ].map((p) => {
                const isActive = bKelengkapan === p.k && bKualitas === p.q;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p.k, p.q)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview of Dynamic Formula */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-indigo-950 block">
              Rumus Penilaian yang Dihasilkan:
            </span>
            <div className="font-mono text-[11px] text-indigo-700 bg-white p-2 rounded-lg border border-indigo-100">
              Nilai Akhir = (Skor Kelengkapan × {(bKelengkapan / 100).toFixed(2)}) + (Skor Kualitas × {(bKualitas / 100).toFixed(2)})
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            Terapkan Bobot
          </button>
        </div>
      </div>
    </div>
  );
};
