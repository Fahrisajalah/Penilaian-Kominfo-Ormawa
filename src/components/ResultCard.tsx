import React, { useState } from 'react';
import {
  Check,
  Copy,
  Calculator,
  FileCheck2,
  SlidersHorizontal,
  BookmarkPlus,
  Users,
  Share2,
} from 'lucide-react';
import { CalculationResult, OrmawaData, DocumentItem } from '../types';
import { generateSummaryReport, hitungKehadiran, getMedpartLevel } from '../utils/calculator';

interface ResultCardProps {
  data: OrmawaData;
  result: CalculationResult;
  docList?: DocumentItem[];
  onSave?: () => void;
  onOpenWeightModal?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  result,
  docList,
  onSave,
  onOpenWeightModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const bKelengkapanRatio = (result.bobotKelengkapan / 100).toFixed(2);
  const bKualitasRatio = (result.bobotKualitas / 100).toFixed(2);
  const kehadiran = hitungKehadiran(data.kehadiranLingkar);
  const medpartInfo = getMedpartLevel(data.jumlahMedpart ?? 0);

  const handleCopy = async () => {
    const text = generateSummaryReport(data, result, docList);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
              <button
                type="button"
                onClick={onOpenWeightModal}
                className="font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 px-2 py-0.5 rounded transition-colors"
                title="Klik untuk ubah bobot persentase"
              >
                Bobot {result.bobotKelengkapan}%
              </button>
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
              <button
                type="button"
                onClick={onOpenWeightModal}
                className="font-semibold text-blue-700 bg-blue-100/70 hover:bg-blue-200/70 px-2 py-0.5 rounded transition-colors"
                title="Klik untuk ubah bobot persentase"
              >
                Bobot {result.bobotKualitas}%
              </button>
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

        {/* Info Tambahan: Kehadiran Lingkar & Keaktifan Medpart */}
        <div className="space-y-2">
          {/* Kehadiran Lingkar Kominfo Highlight Card */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-indigo-950 block">
                  Kehadiran Lingkar Kominfo:
                </span>
                <span className="text-slate-500 text-[11px]">
                  {kehadiran.detailText}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-sm text-indigo-700 block">
                {kehadiran.ratio} Hadir
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({kehadiran.persentase}%)
              </span>
            </div>
          </div>

          {/* Keaktifan Media Partner (Medpart) Highlight Card */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-blue-950 block">
                  Keaktifan Bermedpart:
                </span>
                <span className="text-slate-500 text-[11px]">
                  {medpartInfo.description}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-sm text-blue-700 block">
                {medpartInfo.count} Kali
              </span>
              <span className="text-[10px] text-blue-600 font-medium font-mono">
                {medpartInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Calculation Formula Detailed Step */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-900">
            <span>Rincian Rumus Mengikuti Bobot Anda</span>
            <span className="font-mono text-[11px] text-indigo-700">
              (Kelengkapan × {bKelengkapanRatio}) + (Kualitas × {bKualitasRatio})
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs flex flex-wrap items-center justify-between gap-1 text-slate-800">
            <span>
              ({result.skorKelengkapan.toFixed(1)} × {bKelengkapanRatio}) + ({result.skorKualitas.toFixed(1)} × {bKualitasRatio})
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
            id="btn-save-record"
            onClick={handleSave}
            className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:bg-indigo-800'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Tersimpan di Riwayat
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                Simpan ke Riwayat Penilaian
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-copy-summary"
            onClick={handleCopy}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                Salin Rekap Teks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
