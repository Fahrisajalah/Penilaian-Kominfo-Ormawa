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
  RefreshCw,
} from 'lucide-react';
import { OrmawaData, MasterOrmawa } from './types';
import {
  DOKUMEN_LIST,
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
  skorKualitas: 8.5,
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
  const [data, setData] = useState<OrmawaData>(() => {
    const saved = localStorage.getItem('kominfo_current_ormawa');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

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

  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const checkStatusAndLoadRecords = useCallback(async () => {
    setIsCheckingSupabase(true);
    const status = await fetchSupabaseStatus();
    setSupabaseStatus(status);

    if (status.tableReady) {
      const { success, records } = await fetchOrmawaRecords();
      if (success && records.length > 0) {
        setSavedRecords(records);
      }
    }

    // Load master ormawa
    const masterRes = await fetchMasterOrmawa();
    if (masterRes.success && masterRes.records.length > 0) {
      setMasterList(masterRes.records);
    }

    setIsCheckingSupabase(false);
  }, []);

  useEffect(() => {
    checkStatusAndLoadRecords();
  }, [checkStatusAndLoadRecords]);

  // Sync to local storage as fallback
  useEffect(() => {
    localStorage.setItem('kominfo_current_ormawa', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('kominfo_saved_records', JSON.stringify(savedRecords));
  }, [savedRecords]);

  useEffect(() => {
    localStorage.setItem('kominfo_master_ormawa', JSON.stringify(masterList));
  }, [masterList]);

  // Master Ormawa CRUD actions
  const handleAddMaster = async (nama: string, kategori?: string) => {
    const res = await createMasterOrmawa(nama, kategori);
    if (res.success && res.record) {
      setMasterList((prev) => [
        res.record,
        ...prev.filter((m) => m.id !== res.record.id && m.nama.toLowerCase() !== nama.toLowerCase()),
      ]);
    } else {
      const newRecord: MasterOrmawa = {
        id: `ormawa_${Date.now()}`,
        nama,
        kategori: kategori || 'Ormawa',
        createdAt: Date.now(),
      };
      setMasterList((prev) => [newRecord, ...prev]);
    }
    setSyncToast(`Ormawa "${nama}" berhasil disimpan ke master!`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleUpdateMaster = async (id: string, nama: string, kategori?: string) => {
    await updateMasterOrmawa(id, nama, kategori);
    setMasterList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, nama, kategori: kategori || item.kategori } : item
      )
    );
    if (data.namaOrmawa) {
      setData((prev) => ({ ...prev, namaOrmawa: nama }));
    }
    setSyncToast(`Master ormawa berhasil diperbarui!`);
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

  const handleQuickAddMaster = async (nama: string) => {
    await handleAddMaster(nama, 'Ormawa');
  };

  const calculation = hitungNilaiAdministrasi(data);

  const handleDocToggle = (
    key: keyof Pick<
      OrmawaData,
      'sopPressRelease' | 'contentPlanner' | 'insightSosmed' | 'sopMedpart'
    >,
    val: boolean
  ) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSetAllDocs = (status: boolean) => {
    setData((prev) => ({
      ...prev,
      sopPressRelease: status,
      contentPlanner: status,
      insightSosmed: status,
      sopMedpart: status,
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

  const handleApplyRaw = (parsed: Partial<OrmawaData>) => {
    setData((prev) => ({
      ...prev,
      ...parsed,
    }));
  };

  const handleReset = () => {
    setData({
      namaOrmawa: '',
      sopPressRelease: false,
      contentPlanner: false,
      insightSosmed: false,
      sopMedpart: false,
      skorKualitas: 5.0,
    });
  };

  const handleSaveCurrent = async () => {
    const currentCalc = hitungNilaiAdministrasi(data);
    const newRecord: OrmawaData = {
      ...data,
      id: `ormawa_${Date.now()}`,
      namaOrmawa: data.namaOrmawa.trim() || 'Ormawa Tanpa Nama',
      timestamp: Date.now(),
    };

    // Update local state immediately
    setSavedRecords((prev) => [newRecord, ...prev]);

    // Save to Supabase
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
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
              <Calculator className="w-4 h-4" />
              <span>Standar Penilaian Kominfo Ormawa</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Kalkulator Nilai Administrasi Ormawa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Perhitungan nilai akhir berdasarkan kelengkapan 4 dokumen utama (60%) & kualitas file (40%)
            </p>
          </div>

          {/* Quick Actions & Supabase Connection Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Supabase Status Pill */}
            <button
              type="button"
              id="btn-supabase-status"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs ${
                supabaseStatus?.tableReady
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : supabaseStatus?.connected
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
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

            <button
              type="button"
              id="btn-open-raw-modal"
              onClick={() => setIsRawModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200 border border-indigo-200/80 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ClipboardPaste className="w-4 h-4" />
              Input Nilai Mentah
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
                . Buat tabel database agar tersimpan permanen di cloud.
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
            
            {/* 1. Nama Ormawa Card with Searchable Dropdown & CRUD */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
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
                <div className="hidden sm:flex gap-1.5">
                  {['BEM FIK', 'HIMA TI', 'HIMA SI', 'DPM FIK'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, namaOrmawa: sample }))}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <OrmawaSelect
                value={data.namaOrmawa}
                onChange={(val) => setData((prev) => ({ ...prev, namaOrmawa: val }))}
                masterList={masterList}
                onOpenManageModal={() => setIsMasterModalOpen(true)}
                onQuickAdd={handleQuickAddMaster}
              />
            </div>

            {/* 2. 4 Dokumen Utama Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Kelengkapan 4 Dokumen Utama
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Bobot 60%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan ketersediaan masing-masing dokumen wajib
                  </p>
                </div>

                {/* Quick select all buttons */}
                <div className="flex items-center gap-1.5">
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

              {/* Document toggles list */}
              <div className="space-y-2.5">
                {DOKUMEN_LIST.map((doc) => (
                  <DocumentToggle
                    key={doc.id}
                    id={doc.id}
                    label={doc.label}
                    description={doc.description}
                    isAvailable={Boolean(data[doc.id])}
                    onToggle={(val) => handleDocToggle(doc.id, val)}
                  />
                ))}
              </div>
            </div>

            {/* 3. Skor Kualitas File Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Skor Kualitas File
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      Bobot 40%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rentang penilaian kualitas: 1.0 s/d 10.0 (dapat desimal)
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
                  <span>1.0 (Minimal)</span>
                  <span>5.0</span>
                  <span>7.5</span>
                  <span>10.0 (Maksimal)</span>
                </div>
              </div>

              {/* Preset Chips */}
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
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {score.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scoring Rules Collapsible */}
            <ScoringRulesCard currentDocsCount={calculation.docCount} />
          </div>

          {/* Right Column: Output & Calculations (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
            <ResultCard
              data={data}
              result={calculation}
              onSave={handleSaveCurrent}
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
                {generateRawText(data)}
              </pre>
            </div>
          </div>
        </div>

        {/* Saved Records Table */}
        <SavedOrmawaList
          records={savedRecords}
          onSelect={(rec) => setData(rec)}
          onDelete={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
        />
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 pb-4 text-center text-xs text-slate-400">
        Kalkulator Administrasi Kominfo Ormawa • Terintegrasi dengan Supabase
      </footer>

      {/* Raw Input Modal */}
      <RawInputModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        currentData={data}
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
    </div>
  );
}
