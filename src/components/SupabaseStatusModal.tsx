import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  X,
  RefreshCw,
  Table,
} from 'lucide-react';
import { SupabaseStatus } from '../services/api';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SupabaseStatus | null;
  onRefresh: () => void;
  isChecking: boolean;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
  isChecking,
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'penilaian' | 'all'>('master');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const penilaianSql = status?.penilaianSqlSchema || `CREATE TABLE IF NOT EXISTS penilaian_ormawa (
  id TEXT PRIMARY KEY,
  nama_ormawa TEXT NOT NULL,
  sop_press_release BOOLEAN DEFAULT false,
  content_planner BOOLEAN DEFAULT false,
  insight_sosmed BOOLEAN DEFAULT false,
  sop_medpart BOOLEAN DEFAULT false,
  skor_kualitas NUMERIC DEFAULT 0,
  skor_kelengkapan NUMERIC DEFAULT 0,
  nilai_akhir NUMERIC DEFAULT 0,
  predikat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE penilaian_ormawa DISABLE ROW LEVEL SECURITY;`;

  const masterSql = status?.masterSqlSchema || `-- TABEL TERPISAH: Master Daftar Nama Ormawa
CREATE TABLE IF NOT EXISTS master_ormawa (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  kategori TEXT DEFAULT 'Ormawa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE master_ormawa DISABLE ROW LEVEL SECURITY;

-- Data Awal Ormawa (Opsional):
INSERT INTO master_ormawa (id, nama, kategori)
VALUES
  ('ormawa_bem_fik', 'BEM FIK', 'BEM'),
  ('ormawa_dpm_fik', 'DPM FIK', 'DPM'),
  ('ormawa_hima_ti', 'HIMA TI', 'Himpunan'),
  ('ormawa_hima_si', 'HIMA SI', 'Himpunan'),
  ('ormawa_ukm_robotika', 'UKM Robotika', 'UKM'),
  ('ormawa_ukm_seni', 'UKM Seni & Budaya', 'UKM'),
  ('ormawa_ukm_olahraga', 'UKM Olahraga', 'UKM'),
  ('ormawa_gdsc', 'GDSC', 'Komunitas')
ON CONFLICT (nama) DO NOTHING;`;

  const allSql = `${penilaianSql}\n\n${masterSql}`;

  const currentSql =
    activeTab === 'master' ? masterSql : activeTab === 'penilaian' ? penilaianSql : allSql;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const projectUrl = 'https://supabase.com/dashboard/project/qzuybnjrgsbwfajsrmgk/sql/new';

  const isPenilaianReady = status?.penilaianTableReady ?? status?.tableReady ?? false;
  const isMasterReady = status?.masterTableReady ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="supabase-status-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Status Integrasi Database Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Pemisahan tabel <code className="font-mono text-indigo-600 font-bold">master_ormawa</code> &amp; <code className="font-mono text-slate-600 font-bold">penilaian_ormawa</code>
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
        <div className="p-6 space-y-4 overflow-y-auto text-sm">
          
          {/* Status of Both Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tabel Master Ormawa */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                isMasterReady
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span>Tabel 1: master_ormawa</span>
                </div>
                {isMasterReady ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Belum Ada
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-85 leading-relaxed">
                Menyimpan daftar nama ormawa &amp; kategori secara terpisah untuk opsi dropdown &amp; CRUD.
              </p>
            </div>

            {/* Tabel Penilaian Ormawa */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                isPenilaianReady
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span>Tabel 2: penilaian_ormawa</span>
                </div>
                {isPenilaianReady ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Belum Ada
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-85 leading-relaxed">
                Menyimpan seluruh catatan riwayat penilaian administrasi, kelengkapan berkas, dan nilai akhir.
              </p>
            </div>
          </div>

          {/* SQL Tabs Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('master')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'master'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SQL master_ormawa {!isMasterReady && '⚠️'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('penilaian')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'penilaian'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SQL penilaian_ormawa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua SQL
                </button>
              </div>

              {/* Copy SQL Button */}
              <button
                type="button"
                onClick={() => handleCopy(activeTab, currentSql)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL {activeTab === 'master' ? 'master_ormawa' : activeTab === 'penilaian' ? 'penilaian' : 'Semua'}</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL Code Box */}
            <div className="relative">
              <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed max-h-52 border border-slate-800 selection:bg-indigo-500 selection:text-white">
                {currentSql}
              </pre>
            </div>

            {/* Quick Step Helper */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Cara Pasang Tabel Terpisah di Supabase:
                </span>
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Buka Supabase SQL Editor
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-500">
                1. Klik tombol <strong>&quot;Salin SQL&quot;</strong> di atas.<br />
                2. Tempelkan di SQL Editor Supabase dashboard project Anda, lalu klik <strong>Run</strong>.<br />
                3. Klik tombol <strong>&quot;Cek Ulang Status&quot;</strong> di bawah untuk memverifikasi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isChecking}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-600' : ''}`} />
            Cek Ulang Status
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
