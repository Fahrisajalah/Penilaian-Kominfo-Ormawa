import React, { useState } from 'react';
import {
  Check,
  Copy,
  Calculator,
  Award,
  FileCheck2,
  SlidersHorizontal,
  BookmarkPlus,
  Share2,
} from 'lucide-react';
import { CalculationResult, OrmawaData } from '../types';
import { generateSummaryReport } from '../utils/calculator';

interface ResultCardProps {
  data: OrmawaData;
  result: CalculationResult;
  onSave?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  result,
  onSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    const text = generateSummaryReport(data, result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div
      id="result-summary-card"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Top Banner with Final Score */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 rounded-lg text-indigo-200">
              <Calculator className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium tracking-wide uppercase text-indigo-200">
              Hasil Penilaian Administrasi
            </span>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${result.predikat.badgeColor}`}
          >
            {result.predikat.label}
          </span>
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {data.namaOrmawa || 'Ormawa Tanpa Nama'}
            </h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Status: {result.predikat.description}
            </p>
          </div>
          <div className="flex items-baseline gap-1 mt-2 sm:mt-0">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {result.nilaiAkhir.toFixed(2)}
            </span>
            <span className="text-indigo-300 font-medium text-sm">/ 10.0</span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Kelengkapan Dokumen Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Kelengkapan Dokumen
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                Bobot 60%
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {result.skorKelengkapan.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">
                  ({result.docCount}/{result.totalDocs} Ada)
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Kontribusi:</span>
                <span className="text-sm font-bold text-indigo-600 font-mono">
                  +{result.kontribusiKelengkapan.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Kualitas File Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Kualitas File
              </span>
              <span className="font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                Bobot 40%
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {result.skorKualitas.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">(Skor Input)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Kontribusi:</span>
                <span className="text-sm font-bold text-indigo-600 font-mono">
                  +{result.kontribusiKualitas.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Formula Detailed Step */}
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between font-semibold text-indigo-950">
            <span>Rincian Rumus Terupdate</span>
            <span className="font-mono text-[11px] text-indigo-700">
              (Kelengkapan × 0.6) + (Kualitas × 0.4)
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-indigo-100 font-mono text-xs flex flex-wrap items-center justify-between gap-1 text-slate-800">
            <span>
              ({result.skorKelengkapan.toFixed(1)} × 0.6) + ({result.skorKualitas.toFixed(1)} × 0.4)
            </span>
            <span className="text-indigo-600 font-bold">
              = {result.kontribusiKelengkapan.toFixed(2)} + {result.kontribusiKualitas.toFixed(2)} = {result.nilaiAkhir.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            id="btn-copy-summary"
            onClick={handleCopy}
            className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              copied
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Format Ringkasan (WA)
              </>
            )}
          </button>

          {onSave && (
            <button
              type="button"
              id="btn-save-record"
              onClick={handleSave}
              className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                saved
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-indigo-600" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-slate-600" />
                  Simpan Riwayat
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
