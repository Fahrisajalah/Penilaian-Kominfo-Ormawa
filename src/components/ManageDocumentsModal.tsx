import React, { useState } from 'react';
import {
  X,
  FilePlus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { DEFAULT_DOKUMEN_LIST } from '../utils/calculator';

interface ManageDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onSaveDocuments: (newDocs: DocumentItem[]) => void;
}

export const ManageDocumentsModal: React.FC<ManageDocumentsModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSaveDocuments,
}) => {
  const [docList, setDocList] = useState<DocumentItem[]>(documents);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setDocList(documents);
      setEditingId(null);
      setConfirmDeleteId(null);
      setErrorMsg(null);
    }
  }, [isOpen, documents]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      setErrorMsg('Nama dokumen tidak boleh kosong.');
      return;
    }

    const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const updated = [
      ...docList,
      {
        id: newId,
        label: newLabel.trim(),
        description: newDesc.trim() || 'Dokumen persyaratan administrasi ormawa',
      },
    ];

    setDocList(updated);
    onSaveDocuments(updated);
    setNewLabel('');
    setNewDesc('');
    setErrorMsg(null);
  };

  const handleStartEdit = (doc: DocumentItem) => {
    setEditingId(doc.id);
    setEditLabel(doc.label);
    setEditDesc(doc.description);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editLabel.trim()) {
      setErrorMsg('Nama dokumen tidak boleh kosong.');
      return;
    }

    const updated = docList.map((doc) =>
      doc.id === id
        ? {
            ...doc,
            label: editLabel.trim(),
            description: editDesc.trim(),
          }
        : doc
    );

    setDocList(updated);
    onSaveDocuments(updated);
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleDelete = (id: string) => {
    if (docList.length <= 1) {
      setErrorMsg('Minimal harus ada 1 dokumen persyaratan.');
      setConfirmDeleteId(null);
      return;
    }

    const updated = docList.filter((doc) => doc.id !== id);
    setDocList(updated);
    onSaveDocuments(updated);
    setConfirmDeleteId(null);
    setErrorMsg(null);
  };

  const handleResetDefault = () => {
    setDocList(DEFAULT_DOKUMEN_LIST);
    onSaveDocuments(DEFAULT_DOKUMEN_LIST);
    setEditingId(null);
    setConfirmDeleteId(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Kelola Dokumen Persyaratan (CRUD)
              </h3>
              <p className="text-xs text-slate-500">
                Tambah, ubah nama, atau hapus dokumen yang dinilai
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Tambah Dokumen Baru */}
          <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FilePlus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Dokumen Persyaratan Baru</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nama Dokumen *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Contoh: Laporan Pertanggungjawaban (LPJ)"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Keterangan / Deskripsi
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Keterangan singkat fungsi dokumen"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Tambah ke Daftar
              </button>
            </div>
          </form>

          {/* List Existing Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span className="font-semibold text-slate-700">
                Daftar Dokumen Aktif ({docList.length} Dokumen):
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset 4 Dokumen Standar
              </button>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {docList.map((doc, index) => {
                const isEditing = editingId === doc.id;
                const isConfirmingDelete = confirmDeleteId === doc.id;

                if (isEditing) {
                  return (
                    <div
                      key={doc.id}
                      className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Nama Dokumen"
                          className="text-xs px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Deskripsi Dokumen"
                          className="text-xs px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-slate-700"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(doc.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs border border-slate-200"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={doc.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-slate-900 text-xs truncate">
                          {doc.label}
                        </h5>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-rose-700">Hapus?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1 py-0.5 bg-white text-slate-600 rounded border border-slate-200 text-[10px]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(doc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Dokumen"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Perubahan dokumen langsung tersinkron ke penilaian aktif
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
