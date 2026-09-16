import { OrmawaData, CalculationResult } from '../types';

export const DOKUMEN_LIST: {
  id: 'sopPressRelease' | 'contentPlanner' | 'insightSosmed' | 'sopMedpart';
  label: string;
  description: string;
}[] = [
  {
    id: 'sopPressRelease',
    label: 'SOP Press Release',
    description: 'Standar Operasional Prosedur rilis berita & publikasi media',
  },
  {
    id: 'contentPlanner',
    label: 'Content Planner',
    description: 'Kalender & rencana perencanaan konten media sosial',
  },
  {
    id: 'insightSosmed',
    label: 'Insight Bulanan Sosmed',
    description: 'Laporan analisis performa jangkauan & interaksi akun',
  },
  {
    id: 'sopMedpart',
    label: 'SOP Medpart',
    description: 'Panduan kemitraan media partner & kerja sama eksternal',
  },
];

export function hitungSkorKelengkapan(docCount: number): number {
  switch (docCount) {
    case 4:
      return 10.0;
    case 3:
      return 8.0;
    case 2:
      return 5.5;
    case 1:
      return 3.0;
    case 0:
    default:
      return 1.0;
  }
}

export function tentukanPredikat(nilaiAkhir: number): {
  label: string;
  badgeColor: string;
  textColor: string;
  description: string;
} {
  if (nilaiAkhir >= 8.5) {
    return {
      label: 'Sangat Baik (A)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      textColor: 'text-emerald-700',
      description: 'Administrasi lengkap dan kualitas file sangat memuaskan.',
    };
  } else if (nilaiAkhir >= 7.0) {
    return {
      label: 'Baik (B)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      textColor: 'text-blue-700',
      description: 'Memenuhi standar kelengkapan dan kualitas file memadai.',
    };
  } else if (nilaiAkhir >= 5.5) {
    return {
      label: 'Cukup (C)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      textColor: 'text-amber-700',
      description: 'Masih ada dokumen yang belum lengkap atau perlu ditingkatkan.',
    };
  } else {
    return {
      label: 'Kurang (D)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      textColor: 'text-rose-700',
      description: 'Perlu evaluasi segera dan melengkapi dokumen utama.',
    };
  }
}

export function hitungNilaiAdministrasi(data: OrmawaData): CalculationResult {
  const docs = [
    data.sopPressRelease,
    data.contentPlanner,
    data.insightSosmed,
    data.sopMedpart,
  ];

  const docCount = docs.filter(Boolean).length;
  const totalDocs = 4;
  const skorKelengkapan = hitungSkorKelengkapan(docCount);
  const bobotKelengkapan = 0.6;
  const kontribusiKelengkapan = skorKelengkapan * bobotKelengkapan;

  // Pastikan skor kualitas dalam rentang 1 - 10
  const skorKualitas = Math.min(10, Math.max(0, Number(data.skorKualitas) || 0));
  const bobotKualitas = 0.4;
  const kontribusiKualitas = skorKualitas * bobotKualitas;

  const nilaiAkhir = Number((kontribusiKelengkapan + kontribusiKualitas).toFixed(2));
  const predikat = tentukanPredikat(nilaiAkhir);

  return {
    docCount,
    totalDocs,
    skorKelengkapan,
    bobotKelengkapan,
    kontribusiKelengkapan: Number(kontribusiKelengkapan.toFixed(2)),
    skorKualitas,
    bobotKualitas,
    kontribusiKualitas: Number(kontribusiKualitas.toFixed(2)),
    nilaiAkhir,
    predikat,
  };
}

/**
 * Format raw template text from current data
 */
export function generateRawText(data: OrmawaData): string {
  return `Data Ormawa:
- Nama Ormawa: ${data.namaOrmawa || 'BEM FIK'}
- SOP Press Release: ${data.sopPressRelease ? 'Ada' : 'Tidak Ada'}
- Content Planner: ${data.contentPlanner ? 'Ada' : 'Tidak Ada'}
- Insight Bulanan Sosmed: ${data.insightSosmed ? 'Ada' : 'Tidak Ada'}
- SOP Medpart: ${data.sopMedpart ? 'Ada' : 'Tidak Ada'}
- Skor Kualitas File (1-10): ${data.skorKualitas}`;
}

/**
 * Parse raw template text into OrmawaData
 */
export function parseRawText(rawText: string): Partial<OrmawaData> {
  const result: Partial<OrmawaData> = {};

  const lines = rawText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Nama Ormawa
    const nameMatch = trimmed.match(/(?:Nama\s+Ormawa|Ormawa)\s*[:=]\s*(.+)/i);
    if (nameMatch && nameMatch[1]) {
      result.namaOrmawa = nameMatch[1].replace(/^[\[\(\{"']|[\]\)\}"']$/g, '').trim();
    }

    // SOP Press Release
    if (/press\s*release/i.test(trimmed)) {
      result.sopPressRelease = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
    }

    // Content Planner
    if (/content\s*planner/i.test(trimmed)) {
      result.contentPlanner = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
    }

    // Insight Bulanan Sosmed
    if (/insight/i.test(trimmed) || /sosmed/i.test(trimmed)) {
      result.insightSosmed = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
    }

    // SOP Medpart
    if (/medpart/i.test(trimmed)) {
      result.sopMedpart = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
    }

    // Skor Kualitas File
    const scoreMatch = trimmed.match(/(?:skor\s*kualitas|kualitas\s*file|skor)\s*(?:\([^)]*\))?\s*[:=]\s*([0-9]+(?:[.,][0-9]+)?)/i);
    if (scoreMatch && scoreMatch[1]) {
      const parsedNum = parseFloat(scoreMatch[1].replace(',', '.'));
      if (!isNaN(parsedNum)) {
        result.skorKualitas = Math.min(10, Math.max(0, parsedNum));
      }
    }
  }

  return result;
}

/**
 * Format export summary text for report/chat/WhatsApp
 */
export function generateSummaryReport(data: OrmawaData, result: CalculationResult): string {
  return `📊 *REKAPITULASI PENILAIAN ADMINISTRASI KOMINFO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *Nama Ormawa:* ${data.namaOrmawa || '-'}
📅 *Tanggal Penilaian:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}

📋 *Status 4 Dokumen Utama:*
1. SOP Press Release: ${data.sopPressRelease ? '✅ Ada' : '❌ Tidak Ada'}
2. Content Planner: ${data.contentPlanner ? '✅ Ada' : '❌ Tidak Ada'}
3. Insight Bulanan Sosmed: ${data.insightSosmed ? '✅ Ada' : '❌ Tidak Ada'}
4. SOP Medpart: ${data.sopMedpart ? '✅ Ada' : '❌ Tidak Ada'}

🔢 *Rincian Perhitungan:*
• Kelengkapan Dokumen: ${result.docCount}/${result.totalDocs} Dokumen
• Skor Kelengkapan (60%): ${result.skorKelengkapan.toFixed(1)} ➔ Kontribusi: ${result.kontribusiKelengkapan.toFixed(2)}
• Skor Kualitas File (40%): ${result.skorKualitas.toFixed(1)} ➔ Kontribusi: ${result.kontribusiKualitas.toFixed(2)}

🎯 *NILAI AKHIR:* *${result.nilaiAkhir.toFixed(2)}*
🎖️ *Predikat:* ${result.predikat.label}
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Rumus Terupdate:*
(Skor Kelengkapan × 0.6) + (Skor Kualitas × 0.4)`;
}
