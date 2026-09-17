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
  Users,
  Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OrmawaData, DocumentItem, WeightSettings } from '../types';
import {
  hitungNilaiAdministrasi,
  hitungKehadiran,
  getMedpartLevel,
  DEFAULT_DOKUMEN_LIST,
  DEFAULT_WEIGHTS,
} from '../utils/calculator';

interface SavedOrmawaListProps {
  records: OrmawaData[];
  docList?: DocumentItem[];
  weights?: WeightSettings;
  onSelect: (record: OrmawaData) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const SavedOrmawaList: React.FC<SavedOrmawaListProps> = ({
  records,
  docList = DEFAULT_DOKUMEN_LIST,
  weights = DEFAULT_WEIGHTS,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (records.length === 0) return null;

  // Prepare structured table data exactly matching web table and Excel export
  const getTableRows = () => {
    return records.map((rec, index) => {
      const res = hitungNilaiAdministrasi(rec, docList, weights);
      const kehadiran = hitungKehadiran(rec.kehadiranLingkar);
      const medpartCount = Math.max(0, Math.floor(Number(rec.jumlahMedpart) || 0));
      const medpartInfo = getMedpartLevel(medpartCount);
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
        kehadiranRatio: kehadiran.ratio,
        kehadiranSummary: `${kehadiran.ratio} (${kehadiran.persentase}%)`,
        kehadiranDetail: kehadiran.detailText,
        jumlahMedpart: medpartCount,
        medpartSummary: `${medpartCount} Kali (${medpartInfo.label})`,
        totalDokumen: `${res.docCount}/${res.totalDocs}`,
        sopPressRelease: rec.sopPressRelease ? 'Ada' : 'Tidak Ada',
        contentPlanner: rec.contentPlanner ? 'Ada' : 'Tidak Ada',
        insightSosmed: rec.insightSosmed ? 'Ada' : 'Tidak Ada',
        sopMedpart: rec.sopMedpart ? 'Ada' : 'Tidak Ada',
        skorKelengkapan: res.skorKelengkapan.toFixed(1),
        skorKualitas: res.skorKualitas.toFixed(1),
        nilaiAkhir: res.nilaiAkhir.toFixed(2),
        predikat: res.predikat.label,
        waktu,
        rawRecord: rec,
      };
    });
  };

  // Export Native Excel (.xlsx) file
  const handleExportXLSX = () => {
    const tableData = getTableRows();

    const headers = [
      'No',
      'Nama Ormawa',
      'Kehadiran Lingkar Kominfo',
      'Rincian Presensi Lingkar',
      'Keaktifan Medpart (Frekuensi)',
      'Kelengkapan Dokumen',
      'SOP Press Release',
      'Content Planner',
      'Insight Bulanan Sosmed',
      'SOP Medpart',
      `Skor Dokumen (${weights.bobotKelengkapan}%)`,
      `Skor Kualitas File (${weights.bobotKualitas}%)`,
      'Nilai Akhir',
      'Predikat',
      'Waktu Penilaian',
    ];

    const rows = tableData.map((row) => [
      row.no,
      row.namaOrmawa,
      row.kehadiranSummary,
      row.kehadiranDetail,
      row.medpartSummary,
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
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths for beautiful layout in Microsoft Excel
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 22 }, // Nama Ormawa
      { wch: 26 }, // Kehadiran Lingkar
      { wch: 32 }, // Rincian Presensi Lingkar
      { wch: 24 }, // Keaktifan Medpart
      { wch: 20 }, // Kelengkapan Dokumen
      { wch: 18 }, // SOP Press Release
      { wch: 16 }, // Content Planner
      { wch: 22 }, // Insight Bulanan Sosmed
      { wch: 16 }, // SOP Medpart
      { wch: 18 }, // Skor Dokumen
      { wch: 20 }, // Skor Kualitas
      { wch: 14 }, // Nilai Akhir
      { wch: 18 }, // Predikat
      { wch: 20 }, // Waktu Penilaian
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Administrasi Ormawa');

    const fileName = `rekap_administrasi_ormawa_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setExportMenuOpen(false);
  };

  // Export CSV file (Titik Koma atau Koma) with Kehadiran Lingkar
  const handleExportCSV = (delimiter: ';' | ',') => {
    const tableData = getTableRows();

    const headers = [
      'No',
      'Nama Ormawa',
      'Kehadiran Lingkar Kominfo',
      'Rincian Presensi Lingkar',
      'Keaktifan Medpart',
      'Kelengkapan Dokumen',
      'SOP Press Release',
      'Content Planner',
      'Insight Bulanan Sosmed',
      'SOP Medpart',
      `Skor Dokumen (${weights.bobotKelengkapan}%)`,
      `Skor Kualitas File (${weights.bobotKualitas}%)`,
      'Nilai Akhir',
      'Predikat',
      'Waktu Penilaian',
    ];

    // Escape cell for CSV
    const formatCell = (val: string | number) => {
      const stringVal = String(val ?? '');
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
        row.kehadiranSummary,
        row.kehadiranDetail,
        row.medpartSummary,
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

    // Add UTF-8 BOM so Excel opens with proper Indonesian formatting
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
      'Kehadiran Lingkar Kominfo',
      'Rincian Presensi',
      'Keaktifan Medpart',
      'Ringkasan Dokumen',
      'SOP Press Release',
      'Content Planner',
      'Insight Bulanan Sosmed',
      'SOP Medpart',
      `Skor Dokumen (${weights.bobotKelengkapan}%)`,
      `Skor Kualitas File (${weights.bobotKualitas}%)`,
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
          r.kehadiranSummary,
          r.kehadiranDetail,
          r.medpartSummary,
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
              Hasil penilaian lengkap dengan rincian dokumen, kehadiran lingkar, dan nilai akhir
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
              id="btn-export-excel"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel / CSV</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pilih Format Berkas
                </div>

                {/* Format 1: Native Microsoft Excel (.xlsx) */}
                <button
                  type="button"
                  id="btn-export-xlsx"
                  onClick={handleExportXLSX}
                  className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 rounded-lg text-xs text-slate-800 flex items-start gap-2.5 transition-colors mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">
                      File Microsoft Excel (.xlsx)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Format resmi Excel langsung dengan kolom Kehadiran Lingkar & lebar rapi.
                    </span>
                  </div>
                </button>

                {/* Format 2: Titik Koma (Optimal untuk Excel Indonesia CSV) */}
                <button
                  type="button"
                  onClick={() => handleExportCSV(';')}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg text-xs text-slate-800 flex items-start gap-2.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">
                      CSV Excel Indonesia (Pemisah &apos;;&apos;)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Kompatibel langsung dengan Excel region Indonesia.
                    </span>
                  </div>
                </button>

                {/* Format 3: Standar Koma */}
                <button
                  type="button"
                  onClick={() => handleExportCSV(',')}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg text-xs text-slate-800 flex items-start gap-2.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">
                      CSV Standar (Pemisah &apos;,&apos;)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Cocok untuk Google Sheets, Numbers, atau Python Pandas.
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

      {/* Structured Table matching web specifications with Kehadiran Lingkar Column */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-center w-12">No</th>
              <th className="px-4 py-3 min-w-[140px]">Nama Ormawa</th>
              {/* Kolom Kehadiran Lingkar Kominfo */}
              <th className="px-3 py-3 text-center min-w-[130px]">
                Kehadiran Lingkar
              </th>
              {/* Kolom Keaktifan Medpart */}
              <th className="px-3 py-3 text-center min-w-[110px]">
                Keaktifan Medpart
              </th>
              <th className="px-3 py-3 text-center">Dokumen</th>
              <th className="px-3 py-3 text-center">SOP Press Release</th>
              <th className="px-3 py-3 text-center">Content Planner</th>
              <th className="px-3 py-3 text-center">Insight Sosmed</th>
              <th className="px-3 py-3 text-center">SOP Medpart</th>
              <th className="px-3 py-3 text-center">Skor Dokumen</th>
              <th className="px-3 py-3 text-center">Kualitas File</th>
              <th className="px-4 py-3 text-right">Nilai Akhir</th>
              <th className="px-3 py-3 text-center">Predikat</th>
              <th className="px-3 py-3 text-center">Waktu</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec, idx) => {
              const res = hitungNilaiAdministrasi(rec, docList, weights);
              const kehadiran = hitungKehadiran(rec.kehadiranLingkar);
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

                  {/* Kehadiran Lingkar Badge & Dots */}
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          kehadiran.hadirCount === kehadiran.totalPertemuan
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : kehadiran.hadirCount > 0
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title={kehadiran.detailText}
                      >
                        {kehadiran.ratio} Hadir
                      </span>
                      {/* Mini meeting indicators */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {kehadiran.pertemuanStatus.map((p) => (
                          <span
                            key={p.pertemuanKe}
                            title={`Pertemuan ${p.pertemuanKe}: ${p.hadir ? 'Hadir' : 'Tidak Hadir'}`}
                            className={`w-2 h-2 rounded-full ${
                              p.hadir ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Keaktifan Medpart Badge */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        (rec.jumlahMedpart || 0) >= 6
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : (rec.jumlahMedpart || 0) >= 3
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : (rec.jumlahMedpart || 0) >= 1
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title={`Frekuensi Medpart: ${rec.jumlahMedpart || 0} Kali`}
                    >
                      {rec.jumlahMedpart || 0} Kali
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center font-mono">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      {res.docCount}/{res.totalDocs}
                    </span>
                  </td>

                  {/* Status 4 Dokumen */}
                  <td className="px-3 py-3 text-center">
                    {rec.sopPressRelease ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300" />
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.contentPlanner ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300" />
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.insightSosmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300" />
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rec.sopMedpart ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300" />
                        Tidak
                      </span>
                    )}
                  </td>

                  {/* Skor Kelengkapan & Kualitas */}
                  <td className="px-3 py-3 text-center font-mono font-medium text-slate-700">
                    {res.skorKelengkapan.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium text-slate-700">
                    {res.skorKualitas.toFixed(1)}
                  </td>

                  {/* Nilai Akhir */}
                  <td className="px-4 py-3 text-right font-mono font-bold text-sm text-indigo-700">
                    {res.nilaiAkhir.toFixed(2)}
                  </td>

                  {/* Predikat Badge */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${res.predikat.badgeColor}`}
                    >
                      {res.predikat.label.split(' ')[0]}
                    </span>
                  </td>

                  {/* Waktu */}
                  <td className="px-3 py-3 text-center text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {waktuFormatted}
                    </span>
                  </td>

                  {/* Actions: Muat ke Form & Hapus */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelect(rec)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                        title="Muat data ini kembali ke formulir penilaian"
                      >
                        Muat
                      </button>
                      {rec.id && (
                        <button
                          type="button"
                          onClick={() => onDelete(rec.id!)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Hapus baris ini dari riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
