/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calculator,
  RotateCcw,
  ClipboardPaste,
  CheckCheck,
  XCircle,
  Sliders,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  Scale,
  PlusCircle,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import {
  OrmawaData,
  MasterOrmawa,
  DocumentItem,
  WeightSettings,
  KehadiranLingkar,
} from './types';
import {
  DEFAULT_DOKUMEN_LIST,
  DEFAULT_WEIGHTS,
  hitungNilaiAdministrasi,
  generateRawText,
} from './utils/calculator';
import { DocumentToggle } from './components/DocumentToggle';
import { ResultCard } from './components/ResultCard';
import { RawInputModal } from './components/RawInputModal';
import { ScoringRulesCard } from './components/ScoringRulesCard';
import { SavedOrmawaList } from './components/SavedOrmawaList';
import { SupabaseStatusModal } from './components/SupabaseStatusModal';
import { OrmawaSelect } from './components/OrmawaSelect';
import { MasterOrmawaModal } from './components/MasterOrmawaModal';
import { ManageDocumentsModal } from './components/ManageDocumentsModal';
import { WeightSettingsModal } from './components/WeightSettingsModal';
import { KehadiranLingkarCard } from './components/KehadiranLingkarCard';
import { ImportKehadiranModal } from './components/ImportKehadiranModal';
import { KeaktifanMedpartCard } from './components/KeaktifanMedpartCard';
import {
  fetchSupabaseStatus,
  fetchOrmawaRecords,
  saveOrmawaRecord,
  deleteOrmawaRecord,
  clearAllOrmawaRecords,
  fetchMasterOrmawa,
  createMasterOrmawa,
  updateMasterOrmawa,
  deleteMasterOrmawa,
  SupabaseStatus,
} from './services/api';

const INITIAL_DATA: OrmawaData = {
  namaOrmawa: 'BEM FIK',
  sopPressRelease: true,
  contentPlanner: true,
  insightSosmed: true,
  sopMedpart: false,
  docs: {
    sopPressRelease: true,
    contentPlanner: true,
    insightSosmed: true,
    sopMedpart: false,
  },
  skorKualitas: 8.0, // Standar baku di angka 8.0
  kehadiranLingkar: {
    totalPertemuan: 3,
    pertemuan: { 1: true, 2: true, 3: false }, // Contoh 2/3 Hadir
  },
  jumlahMedpart: 3, // Contoh 3 kali kolaborasi medpart
};

const DEFAULT_MASTER: MasterOrmawa[] = [
  { id: 'ormawa_bem_fik', nama: 'BEM FIK', kategori: 'BEM' },
  { id: 'ormawa_dpm_fik', nama: 'DPM FIK', kategori: 'DPM' },
  { id: 'ormawa_hima_ti', nama: 'HIMA TI', kategori: 'Himpunan' },
  { id: 'ormawa_hima_si', nama: 'HIMA SI', kategori: 'Himpunan' },
  { id: 'ormawa_ukm_robotika', nama: 'UKM Robotika', kategori: 'UKM' },
  { id: 'ormawa_ukm_seni', nama: 'UKM Seni & Budaya', kategori: 'UKM' },
  { id: 'ormawa_ukm_olahraga', nama: 'UKM Olahraga', kategori: 'UKM' },
  { id: 'ormawa_gdsc', nama: 'GDSC', kategori: 'Komunitas' },
];

export default function App() {
  // 1. Dokumen Persyaratan (CRUD-able)
  const [docList, setDocList] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('kominfo_doc_requirements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_DOKUMEN_LIST;
  });

  // 2. Bobot Persentase Penilaian (Customizable)
  const [weights, setWeights] = useState<WeightSettings>(() => {
    const saved = localStorage.getItem('kominfo_weight_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.bobotKelengkapan === 'number' &&
          typeof parsed.bobotKualitas === 'number'
        ) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_WEIGHTS;
  });

  // 3. Form Data Ormawa Aktif
  const [data, setData] = useState<OrmawaData>(() => {
    const saved = localStorage.getItem('kominfo_current_ormawa');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DATA,
          ...parsed,
          skorKualitas: parsed.skorKualitas ?? 8.0,
          kehadiranLingkar: parsed.kehadiranLingkar || INITIAL_DATA.kehadiranLingkar,
        };
      } catch {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  // 4. Riwayat Penilaian
  const [savedRecords, setSavedRecords] = useState<OrmawaData[]>(() => {
    const saved = localStorage.getItem('kominfo_saved_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // 5. Master Ormawa
  const [masterList, setMasterList] = useState<MasterOrmawa[]>(() => {
    const saved = localStorage.getItem('kominfo_master_ormawa');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_MASTER;
  });

  // 6. UI Modals
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isImportKehadiranOpen, setIsImportKehadiranOpen] = useState(false);

  // 7. Supabase status & Sync
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Check Supabase and load records
  const checkStatusAndLoadRecords = useCallback(async () => {
    setIsCheckingSupabase(true);
    try {
      const status = await fetchSupabaseStatus();
      setSupabaseStatus(status);

      if (status.connected && status.masterTableReady) {
        const masterRes = await fetchMasterOrmawa();
        if (masterRes.success && masterRes.records && masterRes.records.length > 0) {
          setMasterList(masterRes.records);
        }
      }

      if (status.connected && status.tableReady) {
        const recordsRes = await fetchOrmawaRecords();
        if (recordsRes.success && recordsRes.records) {
          setSavedRecords(recordsRes.records);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsCheckingSupabase(false);
    }
  }, []);

  useEffect(() => {
    checkStatusAndLoadRecords();
  }, [checkStatusAndLoadRecords]);

  // Local storage auto-sync
  useEffect(() => {
    localStorage.setItem('kominfo_current_ormawa', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('kominfo_saved_records', JSON.stringify(savedRecords));
  }, [savedRecords]);

  useEffect(() => {
    localStorage.setItem('kominfo_master_ormawa', JSON.stringify(masterList));
  }, [masterList]);

  useEffect(() => {
    localStorage.setItem('kominfo_doc_requirements', JSON.stringify(docList));
  }, [docList]);

  useEffect(() => {
    localStorage.setItem('kominfo_weight_settings', JSON.stringify(weights));
  }, [weights]);

  // Master Ormawa CRUD actions
  const handleAddMaster = async (nama: string, kategori?: string) => {
    const res = await createMasterOrmawa(nama, kategori);
    if (res.success && res.record) {
      setMasterList((prev) => [
        res.record,
        ...prev.filter(
          (m) =>
            m.id !== res.record.id &&
            m.nama.toLowerCase() !== nama.toLowerCase()
        ),
      ]);
    } else {
      const newRecord: MasterOrmawa = {
        id: `ormawa_${Date.now()}`,
        nama,
        kategori: kategori || 'Ormawa',
        createdAt: Date.now(),
      };
      setMasterList((prev) => [
        newRecord,
        ...prev.filter((m) => m.nama.toLowerCase() !== nama.toLowerCase()),
      ]);
    }
    setSyncToast(`Ormawa "${nama}" ditambahkan ke master.`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleQuickAddMaster = async (nama: string) => {
    await handleAddMaster(nama);
    setData((prev) => ({ ...prev, namaOrmawa: nama }));
  };

  const handleUpdateMaster = async (id: string, nama: string, kategori?: string) => {
    const res = await updateMasterOrmawa(id, nama, kategori);
    if (res.success && res.record) {
      setMasterList((prev) =>
        prev.map((item) => (item.id === id ? res.record : item))
      );
    } else {
      setMasterList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, nama, kategori: kategori || item.kategori }
            : item
        )
      );
    }
    setSyncToast(`Ormawa "${nama}" berhasil diperbarui.`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleDeleteMaster = async (id: string, nama?: string) => {
    await deleteMasterOrmawa(id, nama);
    setMasterList((prev) =>
      prev.filter(
        (item) =>
          item.id !== id &&
          (!nama || item.nama.trim().toLowerCase() !== nama.trim().toLowerCase())
      )
    );
    setSyncToast(`Ormawa "${nama || id}" berhasil dihapus.`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Kalkulasi nilai dinamis dengan dokumen & bobot saat ini
  const calculation = hitungNilaiAdministrasi(data, docList, weights);

  const handleDocToggle = (docId: string, val: boolean) => {
    setData((prev) => ({
      ...prev,
      [docId]: val,
      docs: {
        ...(prev.docs || {}),
        [docId]: val,
      },
    }));
  };

  const handleSetAllDocs = (status: boolean) => {
    const newDocs: Record<string, boolean> = {};
    docList.forEach((d) => {
      newDocs[d.id] = status;
    });

    setData((prev) => ({
      ...prev,
      sopPressRelease: status,
      contentPlanner: status,
      insightSosmed: status,
      sopMedpart: status,
      docs: newDocs,
    }));
  };

  const handleQualityChange = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(val as string);
    if (isNaN(num)) {
      setData((prev) => ({ ...prev, skorKualitas: 0 }));
    } else {
      const clamped = Math.min(10, Math.max(0, parseFloat(num.toFixed(1))));
      setData((prev) => ({ ...prev, skorKualitas: clamped }));
    }
  };

  // Kehadiran Lingkar Kominfo Handler
  const handleKehadiranChange = (kehadiran: KehadiranLingkar) => {
    setData((prev) => ({
      ...prev,
      kehadiranLingkar: kehadiran,
    }));
  };

  // Keaktifan Medpart Handler
  const handleMedpartChange = (count: number) => {
    setData((prev) => ({
      ...prev,
      jumlahMedpart: Math.max(0, Math.floor(Number(count) || 0)),
    }));
  };

  // Batch apply attendance from Excel import to matching saved records
  const handleBatchApplyAttendance = (
    attendanceMap: Record<string, KehadiranLingkar>
  ) => {
    setSavedRecords((prev) =>
      prev.map((rec) => {
        const key = rec.namaOrmawa.trim().toLowerCase();
        if (attendanceMap[key]) {
          return {
            ...rec,
            kehadiranLingkar: attendanceMap[key],
          };
        }
        return rec;
      })
    );
    setSyncToast('Presensi Lingkar berhasil diterapkan ke riwayat penilaian!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleApplyRaw = (parsed: Partial<OrmawaData>) => {
    setData((prev) => ({
      ...prev,
      ...parsed,
      docs: {
        ...(prev.docs || {}),
        ...(parsed.docs || {}),
      },
    }));
    setSyncToast('Data mentah berhasil diterapkan ke form!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleReset = () => {
    const emptyDocs: Record<string, boolean> = {};
    docList.forEach((d) => {
      emptyDocs[d.id] = false;
    });

    setData({
      namaOrmawa: '',
      sopPressRelease: false,
      contentPlanner: false,
      insightSosmed: false,
      sopMedpart: false,
      docs: emptyDocs,
      skorKualitas: 8.0, // Standar baku di angka 8.0
      kehadiranLingkar: {
        totalPertemuan: 3,
        pertemuan: { 1: false, 2: false, 3: false },
      },
      jumlahMedpart: 0,
    });
  };

  const handleSaveCurrent = async () => {
    const newRecord: OrmawaData = {
      ...data,
      id: `ormawa_${Date.now()}`,
      namaOrmawa: data.namaOrmawa.trim() || 'Ormawa Tanpa Nama',
      skorKualitas: data.skorKualitas ?? 8.0,
      kehadiranLingkar: data.kehadiranLingkar,
      jumlahMedpart: data.jumlahMedpart ?? 0,
      timestamp: Date.now(),
    };

    setSavedRecords((prev) => [newRecord, ...prev]);

    if (supabaseStatus?.connected) {
      const res = await saveOrmawaRecord({
        ...newRecord,
        ...data,
      });

      if (res.success) {
        setSyncToast('Tersimpan di Cloud Supabase & Lokal!');
      } else {
        setSyncToast('Tersimpan di Lokal (Tabel Supabase belum dibuat)');
      }
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
    if (supabaseStatus?.tableReady) {
      await deleteOrmawaRecord(id);
    }
  };

  const handleClearAllRecords = async () => {
    setSavedRecords([]);
    if (supabaseStatus?.tableReady) {
      await clearAllOrmawaRecords();
    }
    setSyncToast('Semua riwayat penilaian berhasil dibersihkan.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full space-y-5">
        {/* Header Bar */}
        <header className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                <Calculator className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Kalkulator Administrasi Kominfo
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sistem Penilaian Administrasi & Presensi Lingkar Kominfo Ormawa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Supabase Status Chip Button */}
            <button
              type="button"
              id="btn-supabase-status"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                supabaseStatus?.tableReady
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : supabaseStatus?.connected
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Periksa koneksi & skema Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {supabaseStatus?.tableReady
                  ? 'Supabase Terhubung'
                  : supabaseStatus?.connected
                  ? 'Setup Tabel Supabase'
                  : 'Supabase'}
              </span>
              {supabaseStatus?.tableReady ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              )}
            </button>

            {/* Import Kehadiran Excel Trigger */}
            <button
              type="button"
              id="btn-open-import-kehadiran-header"
              onClick={() => setIsImportKehadiranOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200 border border-emerald-200/80 rounded-xl transition-colors flex items-center gap-1.5"
              title="Import presensi Lingkar Kominfo dari file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Presensi
            </button>

            {/* Atur Bobot Penilaian Modal Trigger */}
            <button
              type="button"
              id="btn-open-weight-modal"
              onClick={() => setIsWeightModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100/80 active:bg-purple-200 border border-purple-200/80 rounded-xl transition-colors flex items-center gap-1.5"
              title="Ubah persentase bobot kelengkapan dan kualitas file"
            >
              <Scale className="w-3.5 h-3.5" />
              Bobot ({weights.bobotKelengkapan}% : {weights.bobotKualitas}%)
            </button>

            <button
              type="button"
              id="btn-open-raw-modal"
              onClick={() => setIsRawModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200 border border-indigo-200/80 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ClipboardPaste className="w-4 h-4" />
              Input Mentah
            </button>

            <button
              type="button"
              id="btn-reset-form"
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Kosongkan
            </button>
          </div>
        </header>

        {/* Supabase Notice Banner if table not ready */}
        {supabaseStatus?.connected && !supabaseStatus?.tableReady && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Supabase Terhubung!</strong> URL:{' '}
                <code className="font-mono text-[11px] bg-amber-100/80 px-1 py-0.5 rounded">
                  {supabaseStatus.url}
                </code>
                . Buat tabel database agar data tersimpan permanen di cloud.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg self-start sm:self-auto transition-colors"
            >
              Lihat Kode SQL Tabel
            </button>
          </div>
        )}

        {/* Sync Toast Notification */}
        {syncToast && (
          <div className="bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Inputs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Nama Ormawa Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-3">
              <div>
                <label
                  htmlFor="nama-ormawa-input"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Nama Ormawa
                </label>
                <p className="text-xs text-slate-500">
                  Pilih dari dropdown, telusuri nama, atau kelola master ormawa (CRUD)
                </p>
              </div>

              <OrmawaSelect
                value={data.namaOrmawa}
                onChange={(val) => setData((prev) => ({ ...prev, namaOrmawa: val }))}
                masterList={masterList}
                onOpenManageModal={() => setIsMasterModalOpen(true)}
                onQuickAdd={handleQuickAddMaster}
              />
            </div>

            {/* 2. Kehadiran Forum Lingkar Kominfo (Manual & Import Excel, e.g. 2/3 Hadir) */}
            <KehadiranLingkarCard
              kehadiran={data.kehadiranLingkar}
              onChange={handleKehadiranChange}
              onOpenImportModal={() => setIsImportKehadiranOpen(true)}
            />

            {/* 3. Keaktifan Media Partner (Medpart) */}
            <KeaktifanMedpartCard
              jumlahMedpart={data.jumlahMedpart}
              onChange={handleMedpartChange}
            />

            {/* 4. Dokumen Persyaratan Card (CRUD & Bobot Customizable) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Kelengkapan Dokumen ({docList.length} Persyaratan)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsWeightModalOpen(true)}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition-colors flex items-center gap-1"
                      title="Klik untuk mengubah bobot persentase"
                    >
                      Bobot {weights.bobotKelengkapan}%
                      <Scale className="w-3 h-3 ml-0.5 opacity-70" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan ketersediaan masing-masing berkas persyaratan
                  </p>
                </div>

                {/* Quick CRUD & Select All Actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(true)}
                    className="text-xs px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                    title="Kelola, tambah, ubah, atau hapus dokumen persyaratan"
                  >
                    <PlusCircle className="w-3 h-3 text-indigo-600" />
                    Kelola Dokumen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllDocs(true)}
                    className="text-xs px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Semua Ada
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllDocs(false)}
                    className="text-xs px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Semua Tidak
                  </button>
                </div>
              </div>

              {/* Dynamic Document toggles list */}
              <div className="space-y-2.5">
                {docList.map((doc) => {
                  const isAvail =
                    data.docs && typeof data.docs[doc.id] === 'boolean'
                      ? data.docs[doc.id]
                      : Boolean(data[doc.id]);

                  return (
                    <DocumentToggle
                      key={doc.id}
                      id={doc.id}
                      label={doc.label}
                      description={doc.description}
                      isAvailable={isAvail}
                      onToggle={(val) => handleDocToggle(doc.id, val)}
                    />
                  );
                })}
              </div>
            </div>

            {/* 4. Skor Kualitas File Card (Standar 8.0 & Bobot Customizable) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Skor Kualitas File
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsWeightModalOpen(true)}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold transition-colors flex items-center gap-1"
                      title="Klik untuk mengubah bobot persentase"
                    >
                      Bobot {weights.bobotKualitas}%
                      <Scale className="w-3 h-3 ml-0.5 opacity-70" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rentang penilaian: 1.0 s/d 10.0 (standar baku: <strong>8.0</strong>)
                  </p>
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    id="skor-kualitas-input"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={data.skorKualitas}
                    onChange={(e) => handleQualityChange(e.target.value)}
                    className="w-20 px-3 py-1.5 text-right font-mono font-bold text-lg text-indigo-700 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">/ 10</span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={data.skorKualitas}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>1.0 (Min)</span>
                  <span>5.0</span>
                  <span className="text-indigo-600 font-semibold">8.0 (Standar)</span>
                  <span>10.0 (Maks)</span>
                </div>
              </div>

              {/* Preset Chips: Termasuk Standar 8.0 */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Preset:
                </span>
                {[6.0, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleQualityChange(score)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                      data.skorKualitas === score
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-2xs'
                        : score === 8.0
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {score === 8.0 ? '8.0 (Std)' : score.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scoring Rules Collapsible: Dinamis dengan Bobot & Total Dokumen */}
            <ScoringRulesCard
              currentDocsCount={calculation.docCount}
              totalDocs={calculation.totalDocs}
              bobotKelengkapan={weights.bobotKelengkapan}
              bobotKualitas={weights.bobotKualitas}
            />
          </div>

          {/* Right Column: Output & Calculations (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
            <ResultCard
              data={data}
              result={calculation}
              docList={docList}
              onSave={handleSaveCurrent}
              onOpenWeightModal={() => setIsWeightModalOpen(true)}
            />

            {/* Quick Helper / Template raw copy */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Format Mentah Data Ormawa Ini
                </span>
                <button
                  type="button"
                  onClick={() => setIsRawModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit Mentah
                </button>
              </div>
              <pre className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 overflow-x-auto select-all leading-relaxed">
                {generateRawText(data, docList)}
              </pre>
            </div>
          </div>
        </div>

        {/* Saved Records Table with Attendance Column and Direct Excel Download */}
        <SavedOrmawaList
          records={savedRecords}
          docList={docList}
          weights={weights}
          onSelect={(rec) => setData(rec)}
          onDelete={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
        />
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 pb-4 text-center text-xs text-slate-400">
        Kalkulator Administrasi Kominfo Ormawa • Presensi Lingkar Kominfo • Terintegrasi dengan Supabase
      </footer>

      {/* Import Kehadiran Modal (Excel .xlsx / .csv & Paste) */}
      <ImportKehadiranModal
        isOpen={isImportKehadiranOpen}
        onClose={() => setIsImportKehadiranOpen(false)}
        masterList={masterList}
        currentOrmawaName={data.namaOrmawa}
        onApplyToCurrent={handleKehadiranChange}
        onBatchApplyToSaved={handleBatchApplyAttendance}
      />

      {/* Raw Input Modal */}
      <RawInputModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        currentData={data}
        docList={docList}
        onApply={handleApplyRaw}
      />

      {/* Supabase Status Modal */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        status={supabaseStatus}
        onRefresh={checkStatusAndLoadRecords}
        isChecking={isCheckingSupabase}
      />

      {/* Master Ormawa CRUD Modal */}
      <MasterOrmawaModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterList={masterList}
        onAdd={handleAddMaster}
        onUpdate={handleUpdateMaster}
        onDelete={handleDeleteMaster}
        onSelect={(selectedName) => {
          setData((prev) => ({ ...prev, namaOrmawa: selectedName }));
        }}
        onOpenSqlModal={() => setIsSupabaseModalOpen(true)}
        masterTableReady={supabaseStatus?.masterTableReady}
      />

      {/* Kelola Dokumen Persyaratan CRUD Modal */}
      <ManageDocumentsModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={docList}
        onSaveDocuments={(newDocs) => setDocList(newDocs)}
      />

      {/* Kustomisasi Bobot Persentase Penilaian Modal */}
      <WeightSettingsModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        weights={weights}
        onSaveWeights={(newWeights) => setWeights(newWeights)}
      />
    </div>
  );
}
