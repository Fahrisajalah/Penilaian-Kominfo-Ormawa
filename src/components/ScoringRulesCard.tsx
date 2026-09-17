import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { hitungSkorKelengkapan } from '../utils/calculator';

interface ScoringRulesCardProps {
  currentDocsCount: number;
  totalDocs?: number;
  bobotKelengkapan?: number;
  bobotKualitas?: number;
}

export const ScoringRulesCard: React.FC<ScoringRulesCardProps> = ({
  currentDocsCount,
  totalDocs = 4,
  bobotKelengkapan = 60,
  bobotKualitas = 40,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const bKelengkapanRatio = bobotKelengkapan / 100;
  const bKualitasRatio = bobotKualitas / 100;

  // Bangun aturan dinamis berdasarkan totalDocs
  const rules = [];
  for (let c = totalDocs; c >= 0; c--) {
    const score = hitungSkorKelengkapan(c, totalDocs);
    const desc =
      c === totalDocs
        ? `Semua ${totalDocs} dokumen lengkap`
        : c === 0
        ? '0 dokumen (tidak ada sama sekali)'
        : `${c} dari ${totalDocs} dokumen lengkap`;

    rules.push({
      count: c,
      score: score.toFixed(1),
      desc,
    });
  }

  return (
    <div
      id="rules-card"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800 block">
              Pedoman Logika Penilaian Terupdate
            </span>
            <span className="text-xs text-slate-500">
              Aturan konversi {totalDocs} dokumen ({bobotKelengkapan}%) & kualitas file ({bobotKualitas}%)
            </span>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-4">
          <div>
            <h5 className="font-semibold text-slate-800 mb-2">
              1. Tabel Konversi Skor Kelengkapan Dokumen (Bobot {bobotKelengkapan}%):
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Dokumen Ada</th>
                    <th className="px-3 py-2">Skor Kelengkapan</th>
                    <th className="px-3 py-2">Kontribusi ke Nilai Akhir (× {bKelengkapanRatio.toFixed(2)})</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rules.map((rule) => {
                    const isSelected = currentDocsCount === rule.count;
                    const contrib = (parseFloat(rule.score) * bKelengkapanRatio).toFixed(2);
                    return (
                      <tr
                        key={rule.count}
                        className={
                          isSelected
                            ? 'bg-emerald-50/80 font-medium text-emerald-900'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1.5">
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            )}
                            {rule.count} / {totalDocs} Dokumen
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold">
                          {rule.score}
                        </td>
                        <td className="px-3 py-2 font-mono text-indigo-600">
                          {contrib}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{rule.desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <h5 className="font-semibold text-slate-800">
              2. Skor Kualitas File (Bobot {bobotKualitas}%):
            </h5>
            <p className="text-slate-600">
              Menggunakan nilai input langsung rentang <strong>1.0 s/d 10.0</strong> (standar <strong>8.0</strong>).
              Kontribusi nilai dihitung dengan mengalikan skor kualitas dengan <strong>{bKualitasRatio.toFixed(2)}</strong>.
            </p>
          </div>

          <div className="space-y-1 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
            <h5 className="font-semibold text-indigo-950">
              3. Rumus Nilai Akhir:
            </h5>
            <p className="font-mono text-indigo-900 font-medium">
              Nilai Akhir = (Skor Kelengkapan × {bKelengkapanRatio.toFixed(2)}) + (Skor Kualitas × {bKualitasRatio.toFixed(2)})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
