import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  Plus,
  Settings2,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { MasterOrmawa } from '../types';

interface OrmawaSelectProps {
  value: string;
  onChange: (val: string) => void;
  masterList: MasterOrmawa[];
  onOpenManageModal: () => void;
  onQuickAdd: (nama: string) => Promise<void>;
}

export const OrmawaSelect: React.FC<OrmawaSelectProps> = ({
  value,
  onChange,
  masterList,
  onOpenManageModal,
  onQuickAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = masterList.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      (item.kategori && item.kategori.toLowerCase().includes(search.toLowerCase()))
  );

  const exactMatch = masterList.some(
    (item) => item.nama.toLowerCase() === (search.trim() || value.trim()).toLowerCase()
  );

  const handleSelect = (nama: string) => {
    onChange(nama);
    setIsOpen(false);
    setSearch('');
  };

  const handleQuickAdd = async () => {
    const nameToAdd = search.trim() || value.trim();
    if (!nameToAdd) return;
    setIsAdding(true);
    await onQuickAdd(nameToAdd);
    onChange(nameToAdd);
    setIsAdding(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center gap-2">
        {/* Main Input with Dropdown trigger */}
        <div className="relative flex-1">
          <input
            id="nama-ormawa-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Pilih atau ketik nama Ormawa..."
            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900 transition-all"
          />

          {/* Toggle dropdown button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            title="Buka daftar ormawa"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Manage Master Button (CRUD) */}
        <button
          type="button"
          id="btn-manage-master-ormawa"
          onClick={onOpenManageModal}
          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
          title="Kelola Master Nama Ormawa (Tambah, Ubah, Hapus)"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Kelola Ormawa</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="ormawa-dropdown-menu"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search box inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Telusuri ormawa..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 text-xs">
            {filtered.length === 0 ? (
              <div className="py-4 px-3 text-center text-slate-400">
                <p>Tidak menemukan &quot;{search}&quot;</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Simpan &quot;{search.trim()}&quot; ke Master
                  </button>
                )}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = value.toLowerCase() === item.nama.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.nama)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.nama}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.kategori && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                          {item.kategori}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Add row if user searched something not yet in master */}
          {!exactMatch && (search.trim() || (value.trim() && !masterList.some(m => m.nama.toLowerCase() === value.trim().toLowerCase()))) && (
            <div className="p-2 border-t border-slate-100 bg-indigo-50/50 flex items-center justify-between">
              <span className="text-[11px] text-indigo-900 font-medium truncate max-w-[200px]">
                &quot;{search.trim() || value.trim()}&quot; belum di master
              </span>
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah ke Master
              </button>
            </div>
          )}

          {/* Bottom Bar: Link to open full CRUD modal */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span>{masterList.length} Ormawa terdaftar</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenManageModal();
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" />
              Kelola Semua
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
