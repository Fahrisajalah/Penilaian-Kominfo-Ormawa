import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Building2,
  Search,
  Database,
  AlertCircle,
} from 'lucide-react';
import { MasterOrmawa } from '../types';

interface MasterOrmawaModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterList: MasterOrmawa[];
  onAdd: (nama: string, kategori?: string) => Promise<void>;
  onUpdate: (id: string, nama: string, kategori?: string) => Promise<void>;
  onDelete: (id: string, nama?: string) => Promise<void>;
  onSelect: (nama: string) => void;
  onOpenSqlModal?: () => void;
  masterTableReady?: boolean;
}

export const MasterOrmawaModal: React.FC<MasterOrmawaModalProps> = ({
  isOpen,
  onClose,
  masterList,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
  onOpenSqlModal,
  masterTableReady = true,
}) => {
  const [search, setSearch] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKategori, setNewKategori] = useState('Himpunan');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const filtered = masterList.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      (item.kategori && item.kategori.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;
    setIsLoading(true);
    await onAdd(newNama.trim(), newKategori);
    setNewNama('');
    setIsLoading(false);
  };

  const startEdit = (item: MasterOrmawa) => {
    setConfirmDeleteId(null);
    setEditingId(item.id);
    setEditNama(item.nama);
    setEditKategori(item.kategori || 'Ormawa');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editNama.trim()) return;
    setIsLoading(true);
    await onUpdate(editingId, editNama.trim(), editKategori);
    setEditingId(null);
    setIsLoading(false);
  };

  const handleConfirmDelete = async (item: MasterOrmawa) => {
    setIsLoading(true);
    await onDelete(item.id, item.nama);
    setConfirmDeleteId(null);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="master-ormawa-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Kelola Master Daftar Ormawa (CRUD)
              </h3>
              <p className="text-xs text-slate-500">
                Data tersimpan ke database (tabel terpisah: <code className="font-mono text-indigo-600 font-bold">master_ormawa</code>)
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

        {/* Database Status Alert Banner if needed */}
        {!masterTableReady && onOpenSqlModal && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Tabel <code className="font-mono font-bold">master_ormawa</code> belum dibuat di Supabase.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSqlModal();
              }}
              className="text-indigo-700 hover:text-indigo-900 underline font-semibold flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              Lihat SQL Tabel
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Form Tambah Baru */}
          <form
            onSubmit={handleCreate}
            className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 block">
                + Tambah Ormawa Baru ke Database
              </span>
              <span className="text-[11px] text-slate-500">
                Tersimpan permanen di Supabase
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                placeholder="Nama Ormawa, misal: HIMA TI, BEM FIK"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <select
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="BEM">BEM</option>
                <option value="DPM">DPM</option>
                <option value="Himpunan">Himpunan</option>
                <option value="UKM">UKM</option>
                <option value="Komunitas">Komunitas</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <button
                type="submit"
                disabled={!newNama.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </form>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Telusuri nama ormawa atau kategori..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* List of master ormawa */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
              <span>Total: {masterList.length} Organisasi</span>
              <span>Klik nama untuk langsung memilih</span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada ormawa yang cocok dengan pencarian &quot;{search}&quot;.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  {/* Inline Delete Confirmation View */}
                  {confirmDeleteId === item.id ? (
                    <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-xs">
                        <span>Hapus permanen &quot;{item.nama}&quot;?</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(item)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-[11px] shadow-2xs transition-colors"
                        >
                          {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200 text-[11px] transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : editingId === item.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                      />
                      <select
                        value={editKategori}
                        onChange={(e) => setEditKategori(e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="BEM">BEM</option>
                        <option value="DPM">DPM</option>
                        <option value="Himpunan">Himpunan</option>
                        <option value="UKM">UKM</option>
                        <option value="Komunitas">Komunitas</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={isLoading}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Simpan Perubahan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                        title="Batal Edit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(item.nama);
                          onClose();
                        }}
                        className="flex-1 text-left flex items-center gap-2 hover:text-indigo-600 transition-colors"
                      >
                        <span className="font-semibold text-slate-800">
                          {item.nama}
                        </span>
                        {item.kategori && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {item.kategori}
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ubah nama ormawa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setConfirmDeleteId(item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus ormawa dari database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Tabel: <code className="text-indigo-600 font-mono font-semibold">master_ormawa</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-2xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
