import React from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  CheckCheck,
  CalendarCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { KehadiranLingkar } from '../types';
import { hitungKehadiran } from '../utils/calculator';

interface KehadiranLingkarCardProps {
  kehadiran?: KehadiranLingkar;
  onChange: (updated: KehadiranLingkar) => void;
  onOpenImportModal: () => void;
}

export const KehadiranLingkarCard: React.FC<KehadiranLingkarCardProps> = ({
  kehadiran,
  onChange,
  onOpenImportModal,
}) => {
  const total = Math.max(1, Math.min(6, kehadiran?.totalPertemuan || 3));
  const pertemuanMap = kehadiran?.pertemuan || {};
  const stats = hitungKehadiran(kehadiran, total);

  // Toggle single meeting attendance (satu per satu pertemuan)
  const handleTogglePertemuan = (pertemuanKe: number, hadir: boolean) => {
    const updatedPertemuan = {
      ...pertemuanMap,
      [pertemuanKe]: hadir,
    };
    onChange({
      totalPertemuan: total,
      pertemuan: updatedPertemuan,
      keterangan: kehadiran?.keterangan,
    });
  };

  // Ubah jumlah total pertemuan (misal 3 atau 4 kali)
  const handleChangeTotal = (newTotal: number) => {
    const clamped = Math.max(1, Math.min(6, newTotal));
    const updatedPertemuan: Record<number, boolean> = {};
    for (let i = 1; i <= clamped; i++) {
      updatedPertemuan[i] = Boolean(pertemuanMap[i]);
    }
    onChange({
      totalPertemuan: clamped,
      pertemuan: updatedPertemuan,
      keterangan: kehadiran?.keterangan,
    });
  };

  // Quick set all
  const handleSetAll = (status: boolean) => {
    const updatedPertemuan: Record<number, boolean> = {};
    for (let i = 1; i <= total; i++) {
      updatedPertemuan[i] = status;
    }
    onChange({
      totalPertemuan: total,
      pertemuan: updatedPertemuan,
      keterangan: kehadiran?.keterangan,
    });
  };

  return (
    <div
      id="kehadiran-lingkar-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4"
    >
      {/* Header with Title and Overall Ratio Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Kehadiran Forum Lingkar Kominfo
            </h3>
            {/* Status Rasio Kehadiran (e.g. 2/3 Hadir) */}
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono transition-colors ${
                stats.hadirCount === stats.totalPertemuan
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : stats.hadirCount > 0
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {stats.ratio} Hadir ({stats.persentase}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Presensi ormawa pada forum diskusi & evaluasi lingkar kominfo
          </p>
        </div>

        {/* Quick Action: Import Excel & Reset All */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="btn-import-excel-attendance"
            onClick={onOpenImportModal}
            className="text-xs px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-2xs"
            title="Import presensi dari berkas Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Import Excel
          </button>
          <button
            type="button"
            onClick={() => handleSetAll(true)}
            className="text-xs px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" /> Semua Hadir
          </button>
          <button
            type="button"
            onClick={() => handleSetAll(false)}
            className="text-xs px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Semua Tidak
          </button>
        </div>
      </div>

      {/* Control Total Pertemuan (Biasa 3-4 kali) */}
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">
            Total Pertemuan Lingkar:
          </span>
          <span className="text-slate-500">
            (Pilih berapa kali forum diadakan di periode ini)
          </span>
        </div>

        {/* Preset Total Pertemuan Pills (2, 3, 4, 5 kali) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[2, 3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              id={`btn-total-pertemuan-${count}`}
              onClick={() => handleChangeTotal(count)}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                total === count
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {count} Kali
            </button>
          ))}
        </div>
      </div>

      {/* Individual Meeting Toggles (Satu persatu pertemuan: P1, P2, P3, P4) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>Daftar Presensi Per Pertemuan:</span>
          <span className="text-slate-400 font-normal">
            Status: {stats.detailText}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stats.pertemuanStatus.map(({ pertemuanKe, hadir }) => (
            <div
              key={pertemuanKe}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                hadir
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                    hadir
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  P{pertemuanKe}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Pertemuan {pertemuanKe}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {hadir ? 'Hadir dalam forum' : 'Tidak hadir / absen'}
                  </p>
                </div>
              </div>

              {/* Toggle Buttons: Hadir vs Tidak Hadir */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  id={`btn-hadir-p${pertemuanKe}`}
                  onClick={() => handleTogglePertemuan(pertemuanKe, true)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    hadir
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Hadir
                </button>
                <button
                  type="button"
                  id={`btn-tidakhadir-p${pertemuanKe}`}
                  onClick={() => handleTogglePertemuan(pertemuanKe, false)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    !hadir
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  Tidak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Indicator Track */}
      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Ringkasan Hasil: Hadir <strong>{stats.hadirCount}</strong> dari{' '}
            <strong>{stats.totalPertemuan}</strong> pertemuan (
            <strong>{stats.ratio}</strong>)
          </span>
        </div>
        <span className="text-[11px] text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-medium">
          Otomatis muncul di kolom Excel download
        </span>
      </div>
    </div>
  );
};
