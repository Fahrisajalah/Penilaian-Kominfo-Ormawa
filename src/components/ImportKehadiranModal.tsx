import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KehadiranLingkar, MasterOrmawa, OrmawaData } from '../types';

interface ParsedAttendanceRow {
  namaOrmawa: string;
  pertemuan: Record<number, boolean>;
  totalPertemuan: number;
  hadirCount: number;
  ratio: string;
}

interface ImportKehadiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterList: MasterOrmawa[];
  currentOrmawaName: string;
  onApplyToCurrent: (kehadiran: KehadiranLingkar) => void;
  onBatchApplyToSaved?: (attendanceMap: Record<string, KehadiranLingkar>) => void;
}

export const ImportKehadiranModal: React.FC<ImportKehadiranModalProps> = ({
  isOpen,
  onClose,
  masterList,
  currentOrmawaName,
  onApplyToCurrent,
  onBatchApplyToSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedAttendanceRow[]>([]);
  const [detectedTotal, setDetectedTotal] = useState<number>(3);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to interpret "Hadir", "Ada", "1", "true", "v", "✓"
  const isHadirValue = (val: any): boolean => {
    if (val === true || val === 1) return true;
    if (typeof val === 'string') {
      const v = val.trim().toLowerCase();
      return (
        v === 'hadir' ||
        v === 'h' ||
        v === 'ada' ||
        v === '1' ||
        v === 'ya' ||
        v === 'yes' ||
        v === 'true' ||
        v === 'v' ||
        v === '✓' ||
        v === 'masuk'
      );
    }
    return false;
  };

  // Process raw JSON array from SheetJS
  const processSheetData = (jsonData: any[][]) => {
    if (!jsonData || jsonData.length < 2) {
      setErrorMsg('File kosong atau format header tidak terdeteksi.');
      return;
    }

    // Find header row (first non-empty row)
    let headerRowIdx = 0;
    while (
      headerRowIdx < jsonData.length &&
      (!jsonData[headerRowIdx] || jsonData[headerRowIdx].length === 0)
    ) {
      headerRowIdx++;
    }

    const headers = jsonData[headerRowIdx].map((h: any) =>
      String(h ?? '').trim().toLowerCase()
    );

    // Find Ormawa column index
    let ormawaColIdx = headers.findIndex(
      (h) =>
        h.includes('ormawa') ||
        h.includes('organisasi') ||
        h.includes('nama') ||
        h.includes('lembaga')
    );
    if (ormawaColIdx === -1) ormawaColIdx = 1; // Fallback to 2nd col if 1st is "No"

    // Find meeting columns (e.g. "Pertemuan 1", "P1", "Lingkar 1", "P 1")
    const meetingCols: { colIdx: number; pertemuanKe: number }[] = [];
    headers.forEach((header, idx) => {
      if (idx === ormawaColIdx) return;
      const match = header.match(
        /(?:pertemuan|lingkar|p|kehadiran|sesi)\s*(\d+)/i
      );
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 10) {
          meetingCols.push({ colIdx: idx, pertemuanKe: num });
        }
      }
    });

    // If no explicit header matched, but there are multiple columns after ormawa
    if (meetingCols.length === 0) {
      let mIdx = 1;
      for (let i = 0; i < headers.length; i++) {
        if (i !== ormawaColIdx && !headers[i].includes('no') && !headers[i].includes('ket')) {
          meetingCols.push({ colIdx: i, pertemuanKe: mIdx++ });
          if (mIdx > 4) break;
        }
      }
    }

    meetingCols.sort((a, b) => a.pertemuanKe - b.pertemuanKe);
    const maxMeeting = meetingCols.length > 0 ? Math.max(...meetingCols.map((m) => m.pertemuanKe)) : 3;
    setDetectedTotal(maxMeeting);

    const rows: ParsedAttendanceRow[] = [];
    for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
      const row = jsonData[r];
      if (!row || row.length === 0) continue;

      const rawName = String(row[ormawaColIdx] ?? '').trim();
      if (!rawName || rawName.toLowerCase() === 'nama ormawa' || rawName === '-') {
        continue;
      }

      const pertemuanMap: Record<number, boolean> = {};
      meetingCols.forEach((m) => {
        const cellVal = row[m.colIdx];
        pertemuanMap[m.pertemuanKe] = isHadirValue(cellVal);
      });

      // Fill in any gaps up to maxMeeting
      for (let p = 1; p <= maxMeeting; p++) {
        if (typeof pertemuanMap[p] !== 'boolean') {
          pertemuanMap[p] = false;
        }
      }

      const hadirCount = Object.values(pertemuanMap).filter(Boolean).length;
      rows.push({
        namaOrmawa: rawName,
        pertemuan: pertemuanMap,
        totalPertemuan: maxMeeting,
        hadirCount,
        ratio: `${hadirCount}/${maxMeeting}`,
      });
    }

    if (rows.length === 0) {
      setErrorMsg('Tidak dapat menemukan data ormawa di baris tabel.');
      setParsedRows([]);
    } else {
      setErrorMsg(null);
      setParsedRows(rows);
      setSuccessMsg(`Berhasil membaca ${rows.length} data ormawa (${maxMeeting} pertemuan terdeteksi).`);
    }
  };

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];
        processSheetData(jsonData);
      } catch (err: any) {
        setErrorMsg('Gagal membaca file Excel. Pastikan format file valid (.xlsx, .xls, .csv).');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca file.');
    };
    reader.readAsBinaryString(file);
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Parse pasted text (tabs / commas)
  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Teks paste masih kosong.');
      return;
    }
    const lines = pasteText.trim().split('\n');
    const tableData: string[][] = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(';')) return line.split(';');
      return line.split(',');
    });
    setFileName('Teks Clipboard');
    processSheetData(tableData);
  };

  // Download template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    const defaultOrmawas =
      masterList.length > 0
        ? masterList.map((m) => m.nama)
        : ['BEM FIK', 'HIMA TI', 'HIMA SI', 'DPM FIK', 'UKM Robotika', 'UKM Seni & Budaya'];

    const templateData = [
      ['No', 'Nama Ormawa', 'Pertemuan 1', 'Pertemuan 2', 'Pertemuan 3', 'Keterangan'],
      ...defaultOrmawas.map((name, i) => [
        i + 1,
        name,
        'Hadir',
        i % 2 === 0 ? 'Hadir' : 'Tidak Hadir',
        i === 0 ? 'Hadir' : 'Tidak Hadir',
        i % 2 === 0 ? 'Aktif' : 'Izin pertemuan 2',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    // Set columns width
    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presensi Lingkar');
    XLSX.writeFile(wb, 'template_kehadiran_lingkar_kominfo.xlsx');
  };

  // Apply to current Ormawa being evaluated
  const handleApplyCurrent = (row: ParsedAttendanceRow) => {
    onApplyToCurrent({
      totalPertemuan: row.totalPertemuan,
      pertemuan: row.pertemuan,
    });
    onClose();
  };

  // Batch apply to all saved records matching names
  const handleApplyAll = () => {
    if (parsedRows.length === 0) return;

    // Apply to current if matched
    const matchedCurrent = parsedRows.find(
      (r) =>
        r.namaOrmawa.trim().toLowerCase() === currentOrmawaName.trim().toLowerCase()
    );
    if (matchedCurrent) {
      onApplyToCurrent({
        totalPertemuan: matchedCurrent.totalPertemuan,
        pertemuan: matchedCurrent.pertemuan,
      });
    }

    if (onBatchApplyToSaved) {
      const attendanceMap: Record<string, KehadiranLingkar> = {};
      parsedRows.forEach((r) => {
        attendanceMap[r.namaOrmawa.trim().toLowerCase()] = {
          totalPertemuan: r.totalPertemuan,
          pertemuan: r.pertemuan,
        };
      });
      onBatchApplyToSaved(attendanceMap);
    }

    onClose();
  };

  const matchedCurrentRow = parsedRows.find(
    (r) =>
      r.namaOrmawa.trim().toLowerCase() === currentOrmawaName.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="import-kehadiran-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Import Kehadiran Lingkar Kominfo dari Excel
              </h3>
              <p className="text-xs text-slate-500">
                Unggah berkas Excel (.xlsx / .csv) atau tempel data presensi pertemuan
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

        {/* Tabs & Template Download */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File (.xlsx/.csv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" /> Salin & Tempel
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200/80"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Template Excel
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Pilih atau seret berkas Excel presensi ke sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
              </p>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  {fileName}
                </div>
              )}
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tempel tabel langsung dari Excel / Google Sheets:</span>
                <span className="text-[11px] text-slate-400">Pemisah tab / koma</span>
              </div>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Nama Ormawa\tPertemuan 1\tPertemuan 2\tPertemuan 3\nBEM FIK\tHadir\tHadir\tTidak Hadir\nHIMA TI\tHadir\tHadir\tHadir`}
                className="w-full font-mono text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 leading-relaxed"
              />
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Baca Data Clipboard
              </button>
            </div>
          )}

          {/* Alert Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hasil Deteksi Presensi ({parsedRows.length} Ormawa, {detectedTotal} Pertemuan)
                </span>
                {matchedCurrentRow && (
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-semibold">
                    Ormawa aktif "{currentOrmawaName}": {matchedCurrentRow.ratio} Hadir
                  </span>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Nama Ormawa</th>
                      {Array.from({ length: detectedTotal }, (_, i) => (
                        <th key={i + 1} className="px-3 py-2 text-center">
                          P{i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center">Rasio Kehadiran</th>
                      <th className="px-3 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => {
                      const isCurrent =
                        row.namaOrmawa.trim().toLowerCase() ===
                        currentOrmawaName.trim().toLowerCase();

                      return (
                        <tr
                          key={idx}
                          className={isCurrent ? 'bg-indigo-50/70 font-medium' : 'hover:bg-slate-50'}
                        >
                          <td className="px-3 py-2 text-slate-900 flex items-center gap-1.5">
                            {isCurrent && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-indigo-600"
                                title="Ormawa yang sedang dinilai"
                              />
                            )}
                            {row.namaOrmawa}
                          </td>
                          {Array.from({ length: detectedTotal }, (_, i) => {
                            const pNum = i + 1;
                            const isHadir = Boolean(row.pertemuan[pNum]);
                            return (
                              <td key={pNum} className="px-3 py-2 text-center font-mono">
                                {isHadir ? (
                                  <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    ✗
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-mono font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${
                                row.hadirCount === row.totalPertemuan
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.hadirCount > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {row.ratio}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleApplyCurrent(row)}
                              className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-md text-slate-700 transition-colors font-medium"
                            >
                              Terapkan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Guide hint */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Petunjuk Format Kolom Excel:
            </span>
            <p>
              Header kolom dapat dinamai: <code>Nama Ormawa</code>, <code>Pertemuan 1</code>, <code>Pertemuan 2</code>, <code>Pertemuan 3</code>, dst.
              Nilai cell dapat diisi: <code>Hadir</code> / <code>Tidak Hadir</code> (atau <code>1</code> / <code>0</code>).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {parsedRows.length > 0 && (
              <button
                type="button"
                id="btn-apply-all-attendance"
                onClick={handleApplyAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terapkan Semua ({parsedRows.length} Ormawa)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
