import React, { useState } from 'react';
import {
  Download,
  Trash2,
  RotateCcw,
  Building2,
  Copy,
  Check,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { OrmawaData } from '../types';
import { hitungNilaiAdministrasi } from '../utils/calculator';

interface SavedOrmawaListProps {
  records: OrmawaData[];
  onSelect: (record: OrmawaData) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const SavedOrmawaList: React.FC<SavedOrmawaListProps> = ({
  records,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (records.length === 0) return null;

  // Prepare structured table data exactly matching web table
  const getTableRows = () => {
    return records.map((rec, index) => {
      const res = hitungNilaiAdministrasi(rec);
      const waktu = rec.timestamp
        ? new Date(rec.timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';

      return {
        no: index + 1,
        namaOrmawa: rec.namaOrmawa,
        sopPressRelease: rec.sopPressRelease ? 'Ada' : 'Tidak Ada',
        contentPlanner: rec.contentPlanner ? 'Ada' : 'Tidak Ada',
        insightSosmed: rec.insightSosmed ? 'Ada' : 'Tidak Ada',
        sopMedpart: rec.sopMedpart ? 'Ada' : 'Tidak Ada',
        totalDokumen: `${res.docCount}/4`,
        skorKelengkapan: res.skorKelengkapan.toFixed(1),
        skorKualitas: res.skorKualitas.toFixed(1),
        nilaiAkhir: res.nilaiAkhir.toFixed(2),
        predikat: res.predikat.label,
        waktu,
      };
    });
  };

  // Export CSV / Excel file
  const handleExport = (delimiter: ';' | ',') => {
    const tableData = getTableRows();

    const headers = [
      'No',
      'Nama Ormawa',
      'Ringkasan Dokumen',
      'SOP Press Release',
      'Content Planner',
      'Insight Bulanan Sosmed',
      'SOP Medpart',
      'Skor Kelengkapan (60%)',
      'Skor Kualitas File (40%)',
      'Nilai Akhir',
      'Predikat',
      'Waktu Penilaian',
    ];

    // Escape cell for CSV
    const formatCell = (val: string | number) => {
      const stringVal = String(val ?? '');
      // If contains delimiter, quote, or newline, wrap in quotes and escape quotes
      if (
        stringVal.includes(delimiter) ||
        stringVal.includes('"') ||
        stringVal.includes('\n')
      ) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const headerLine = headers.map(formatCell).join(delimiter);
    const dataLines = tableData.map((row) =>
      [
        row.no,
        row.namaOrmawa,
        row.totalDokumen,
        row.sopPressRelease,
        row.contentPlanner,
        row.insightSosmed,
        row.sopMedpart,
        row.skorKelengkapan,
        row.skorKualitas,
        row.nilaiAkhir,
        row.predikat,
        row.waktu,
      ]
        .map(formatCell)
        .join(delimiter)
    );

    // Add UTF-8 BOM so Excel opens with proper encoding & recognizes characters
    const csvContent =
      '\uFEFF' +
      (delimiter === ';' ? '' : 'sep=,\n') +
      [headerLine, ...dataLines].join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileSuffix = delimiter === ';' ? 'excel_titik_koma' : 'standar';
    link.download = `rekap_administrasi_ormawa_${fileSuffix}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  // Copy directly to clipboard for Excel / Google Sheets
  const handleCopyTable = async () => {
    const tableData = getTableRows();
    const headers = [
      'No',
      'Nama Ormawa',
      'Ringkasan Dokumen',
      'SOP Press Release',
      'Content Planner',
      'Insight Bulanan Sosmed',
      'SOP Medpart',
      'Skor Kelengkapan (60%)',
      'Skor Kualitas File (40%)',
      'Nilai Akhir',
      'Predikat',
      'Waktu Penilaian',
    ];

    // TSV for Excel paste
    const tsvContent = [
      headers.join('\t'),
      ...tableData.map((r) =>
        [
          r.no,
          r.namaOrmawa,
          r.totalDokumen,
          r.sopPressRelease,
          r.contentPlanner,
          r.insightSosmed,
          r.sopMedpart,
          r.skorKelengkapan,
          r.skorKualitas,
          r.nilaiAkhir,
          r.predikat,
          r.waktu,
        ].join('\t')
      ),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = tsvContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="saved-records-section"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mt-6"
    >
      {/* Top Header with Actions */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Tabel Rekap Nilai Ormawa ({records.length})
            </h3>
            <p className="text-xs text-slate-500">
              Hasil penilaian lengkap dengan rincian dokumen dan nilai akhir
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Copy Table to Clipboard */}
          <button
            type="button"
            onClick={handleCopyTable}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Salin seluruh tabel (Bisa langsung Ctrl+V di Microsoft Excel atau Google Sheets)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersalin! Paste di Excel</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin ke Excel (Ctrl+V)</span>
              </>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="btn-export-csv"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor File CSV / Excel</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pilih Format Delimiter
                </div>
                {/* Format 1: Titik Koma (Optimal untuk Excel Indonesia) */}
                <button
                  type="button"
                  onClick={() => handleExport(';')}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg text-xs text-slate-800 flex items-start gap-2 transition-colors mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">
                      Excel Indonesia (Separator &apos;;&apos;)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Kolom langsung terpisah rapi (tidak menyatu/tergabung).
                    </span>
                  </div>
                </button>

                {/* Format 2: Standar Koma */}
                <button
                  type="button"
                  onClick={() => handleExport(',')}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg text-xs text-slate-800 flex items-start gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">
                      CSV Standar (Separator &apos;,&apos;)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Cocok untuk Google Sheets, Numbers, atau Python/Pandas.
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {isConfirmingClear ? (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-rose-800 font-semibold text-[11px]">Hapus semua?</span>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingClear(false);
                  onClearAll();
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold transition-colors"
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-1.5 py-0.5 bg-white text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 text-[11px] transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Structured Table matching web specifications */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-center w-12">No</th>
              <th className="px-4 py-3 min-w-[140px]">Nama Ormawa</th>
              <th className="px-3 py-3 text-center">Dokumen</th>
              <th className="px-3 py-3 text-center">SOP Press Release</th>
              <th className="px-3 py-3 text-center">Content Planner</th>
              <th className="px-3 py-3 text-center">Insight Sosmed</th>
              <th className="px-3 py-3 text-center">SOP Medpart</th>
              <th className="px-3 py-3 text-center">Skor Dokumen (60%)</th>
              <th className="px-3 py-3 text-center">Kualitas File (40%)</th>
              <th className="px-4 py-3 text-right">Nilai Akhir</th>
              <th className="px-3 py-3 text-center">Predikat</th>
              <th className="px-3 py-3 text-center">Waktu</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec, idx) => {
              const res = hitungNilaiAdministrasi(rec);
              const waktuFormatted = rec.timestamp
                ? new Date(rec.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-';

              return (
                <tr key={rec.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3 text-center font-mono text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {rec.namaOrmawa}
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      {res.docCount}/4
                    </span>
                  </td>
                  {/* Status 4 Dokumen */}
                  <td className="px-3 py-3 text-center">
                    {rec.sopPressRelease ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300 inline" /> Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.contentPlanner ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300 inline" /> Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.insightSosmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300 inline" /> Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.sopMedpart ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300 inline" /> Tidak
                      </span>
                    )}
                  </td>

                  {/* Skor & Nilai Akhir */}
                  <td className="px-3 py-3 text-center font-mono font-medium text-slate-800">
                    {res.skorKelengkapan.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium text-slate-800">
                    {res.skorKualitas.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-sm">
                    {res.nilaiAkhir.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${res.predikat.badgeColor}`}
                    >
                      {res.predikat.label.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-400 text-[11px]">
                    {waktuFormatted}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelect(rec)}
                        title="Muat kembali ke kalkulator"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rec.id && onDelete(rec.id)}
                        title="Hapus record ini"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
