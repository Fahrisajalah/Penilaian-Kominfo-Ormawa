import React, { useState, useEffect } from 'react';
import { X, ClipboardPaste, Check, AlertCircle, Sparkles } from 'lucide-react';
import { OrmawaData } from '../types';
import { generateRawText, parseRawText } from '../utils/calculator';

interface RawInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: OrmawaData;
  onApply: (data: Partial<OrmawaData>) => void;
}

export const RawInputModal: React.FC<RawInputModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onApply,
}) => {
  const [text, setText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<OrmawaData>>({});

  useEffect(() => {
    if (isOpen) {
      setText(generateRawText(currentData));
    }
  }, [isOpen, currentData]);

  useEffect(() => {
    if (text) {
      setParsedPreview(parseRawText(text));
    }
  }, [text]);

  if (!isOpen) return null;

  const handleApply = () => {
    const parsed = parseRawText(text);
    onApply(parsed);
    onClose();
  };

  const handlePasteExample = (allAda: boolean = false) => {
    if (allAda) {
      setText(`Data Ormawa:
- Nama Ormawa: BEM FIK
- SOP Press Release: Ada
- Content Planner: Ada
- Insight Bulanan Sosmed: Ada
- SOP Medpart: Ada
- Skor Kualitas File (1-10): 9.2`);
    } else {
      setText(`Data Ormawa:
- Nama Ormawa: BEM FIK
- SOP Press Release: Ada
- Content Planner: Ada
- Insight Bulanan Sosmed: Ada
- SOP Medpart: Tidak Ada
- Skor Kualitas File (1-10): 8.5`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="raw-input-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Input Data Mentah (Teks)
              </h3>
              <p className="text-xs text-slate-500">
                Tempel atau edit format teks mentah penilaian
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
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Format yang didukung: Nama, 4 Dokumen (Ada/Tidak Ada), & Skor Kualitas</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePasteExample(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Contoh 3 Dokumen
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handlePasteExample(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                Contoh 4 Dokumen
              </button>
            </div>
          </div>

          <textarea
            id="raw-text-textarea"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Data Ormawa:\n- Nama Ormawa: BEM FIK\n- SOP Press Release: Ada\n- Content Planner: Ada\n- Insight Bulanan Sosmed: Ada\n- SOP Medpart: Tidak Ada\n- Skor Kualitas File (1-10): 8.5`}
            className="w-full font-mono text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 leading-relaxed"
          />

          {/* Real-time Parsed Preview */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 block mb-2">
              Hasil Deteksi Otomatis:
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400">Ormawa:</span>{' '}
                <strong className="text-slate-800">
                  {parsedPreview.namaOrmawa || '(Belum terdeteksi)'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Skor Kualitas:</span>{' '}
                <strong className="text-slate-800">
                  {parsedPreview.skorKualitas !== undefined
                    ? parsedPreview.skorKualitas
                    : '-'}
                </strong>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex flex-wrap gap-2">
                <span
                  className={`px-2 py-0.5 rounded font-medium ${
                    parsedPreview.sopPressRelease
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Press Release: {parsedPreview.sopPressRelease ? 'Ada' : 'Tidak'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-medium ${
                    parsedPreview.contentPlanner
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Planner: {parsedPreview.contentPlanner ? 'Ada' : 'Tidak'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-medium ${
                    parsedPreview.insightSosmed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Insight: {parsedPreview.insightSosmed ? 'Ada' : 'Tidak'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-medium ${
                    parsedPreview.sopMedpart
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Medpart: {parsedPreview.sopMedpart ? 'Ada' : 'Tidak'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-apply-raw"
            onClick={handleApply}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Terapkan & Hitung
          </button>
        </div>
      </div>
    </div>
  );
};
