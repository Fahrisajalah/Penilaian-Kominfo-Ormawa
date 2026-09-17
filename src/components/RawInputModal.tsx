import React, { useState, useEffect } from 'react';
import { X, ClipboardPaste, Check, AlertCircle, Sparkles } from 'lucide-react';
import { OrmawaData, DocumentItem } from '../types';
import { generateRawText, parseRawText, DEFAULT_DOKUMEN_LIST } from '../utils/calculator';

interface RawInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: OrmawaData;
  docList?: DocumentItem[];
  onApply: (data: Partial<OrmawaData>) => void;
}

export const RawInputModal: React.FC<RawInputModalProps> = ({
  isOpen,
  onClose,
  currentData,
  docList = DEFAULT_DOKUMEN_LIST,
  onApply,
}) => {
  const [text, setText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<OrmawaData>>({});

  useEffect(() => {
    if (isOpen) {
      setText(generateRawText(currentData, docList));
    }
  }, [isOpen, currentData, docList]);

  useEffect(() => {
    if (text) {
      setParsedPreview(parseRawText(text, docList));
    }
  }, [text, docList]);

  if (!isOpen) return null;

  const handleApply = () => {
    const parsed = parseRawText(text, docList);
    onApply(parsed);
    onClose();
  };

  const handlePasteExample = (allAda: boolean = false) => {
    const sampleDocs = docList.map((d, i) => {
      if (allAda) return `- ${d.label}: Ada`;
      return `- ${d.label}: ${i === docList.length - 1 ? 'Tidak Ada' : 'Ada'}`;
    });

    setText(`Data Ormawa:
- Nama Ormawa: BEM FIK
${sampleDocs.join('\n')}
- Skor Kualitas File (1-10): ${allAda ? '9.0' : '8.0'}`);
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
            <span>Format: Nama, {docList.length} Dokumen (Ada/Tidak Ada), & Skor Kualitas (std: 8.0)</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePasteExample(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Contoh Parsial
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handlePasteExample(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                Semua Lengkap
              </button>
            </div>
          </div>

          <textarea
            id="raw-text-textarea"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Data Ormawa:\n- Nama Ormawa: BEM FIK\n- Skor Kualitas File (1-10): 8.0`}
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
                    : 8.0}
                </strong>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex flex-wrap gap-2">
                {docList.map((doc) => {
                  const isAvail = parsedPreview.docs && typeof parsedPreview.docs[doc.id] === 'boolean'
                    ? parsedPreview.docs[doc.id]
                    : Boolean(parsedPreview[doc.id]);
                  return (
                    <span
                      key={doc.id}
                      className={`px-2 py-0.5 rounded font-medium ${
                        isAvail
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {doc.label}: {isAvail ? 'Ada' : 'Tidak'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-apply-raw"
            onClick={handleApply}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            Terapkan ke Form Penilaian
          </button>
        </div>
      </div>
    </div>
  );
};
