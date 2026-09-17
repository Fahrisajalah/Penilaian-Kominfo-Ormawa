import {
  OrmawaData,
  CalculationResult,
  DocumentItem,
  WeightSettings,
  KehadiranLingkar,
} from '../types';

export const DEFAULT_DOKUMEN_LIST: DocumentItem[] = [
  {
    id: 'sopPressRelease',
    label: 'SOP Press Release',
    description: 'Panduan dan alur rilis publikasi informasi ormawa',
  },
  {
    id: 'contentPlanner',
    label: 'Content Planner',
    description: 'Jadwal dan perencanaan feed/story media sosial bulanan',
  },
  {
    id: 'insightSosmed',
    label: 'Insight Bulanan Sosmed',
    description: 'Laporan metrik performa engagement, reach, dan statistik akun',
  },
  {
    id: 'sopMedpart',
    label: 'SOP Medpart',
    description: 'Standar operasional kemitraan media partner & sponsorship',
  },
];

export const DEFAULT_WEIGHTS: WeightSettings = {
  bobotKelengkapan: 60,
  bobotKualitas: 40,
};

export const DOKUMEN_LIST = DEFAULT_DOKUMEN_LIST;

export interface KehadiranSummary {
  hadirCount: number;
  totalPertemuan: number;
  ratio: string; // e.g. "2/3"
  persentase: number; // e.g. 66.7
  detailText: string; // e.g. "P1: Hadir, P2: Hadir, P3: Tidak Hadir"
  shortSummary: string; // e.g. "2/3 Hadir"
  pertemuanStatus: { pertemuanKe: number; hadir: boolean }[];
}

/**
 * Hitung ringkasan status keaktifan bermedpart (0 s/d tak terhingga kali)
 */
export function getMedpartLevel(count: number): {
  count: number;
  label: string;
  badgeClass: string;
  description: string;
} {
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (safeCount >= 6) {
    return {
      count: safeCount,
      label: 'Sangat Aktif',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Sangat sering berkolaborasi media partner bersama Kominfo.',
    };
  } else if (safeCount >= 3) {
    return {
      count: safeCount,
      label: 'Aktif',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Rutin berkolaborasi media partner (3-5 kali).',
    };
  } else if (safeCount >= 1) {
    return {
      count: safeCount,
      label: 'Cukup Aktif',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Pernah bermedpart 1-2 kali.',
    };
  } else {
    return {
      count: 0,
      label: 'Belum Pernah',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      description: 'Belum ada riwayat bermedpart di periode ini.',
    };
  }
}

/**
 * Hitung ringkasan rasio kehadiran Lingkar Kominfo (misal 2/3 Hadir)
 */
export function hitungKehadiran(
  kehadiran?: KehadiranLingkar,
  fallbackTotal: number = 3
): KehadiranSummary {
  const total = Math.max(1, Math.min(10, kehadiran?.totalPertemuan || fallbackTotal));
  const pertemuanMap = kehadiran?.pertemuan || {};

  const pertemuanStatus = Array.from({ length: total }, (_, i) => {
    const pertemuanKe = i + 1;
    return {
      pertemuanKe,
      hadir: Boolean(pertemuanMap[pertemuanKe]),
    };
  });

  const hadirCount = pertemuanStatus.filter((p) => p.hadir).length;
  const persentase = Number(((hadirCount / total) * 100).toFixed(1));
  const ratio = `${hadirCount}/${total}`;
  const detailText = pertemuanStatus
    .map((p) => `P${p.pertemuanKe}: ${p.hadir ? 'Hadir' : 'Tidak Hadir'}`)
    .join(', ');

  return {
    hadirCount,
    totalPertemuan: total,
    ratio,
    persentase,
    detailText,
    shortSummary: `${ratio} Hadir (${persentase}%)`,
    pertemuanStatus,
  };
}

/**
 * Hitung skor kelengkapan dokumen dinamis secara proporsional dari rentang 1.0 s/d 10.0
 */
export function hitungSkorKelengkapan(docCount: number, totalDocs: number): number {
  if (totalDocs <= 0) return 10.0;
  const clampedCount = Math.max(0, Math.min(docCount, totalDocs));

  // Pemetaan linier: 0 dokumen = 1.0, semua dokumen = 10.0
  const score = (clampedCount / totalDocs) * 9.0 + 1.0;
  return Number(score.toFixed(1));
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

export function hitungNilaiAdministrasi(
  data: OrmawaData,
  docList: DocumentItem[] = DEFAULT_DOKUMEN_LIST,
  weights: WeightSettings = DEFAULT_WEIGHTS
): CalculationResult {
  const totalDocs = docList.length;

  // Cek ketersediaan dokumen dari data.docs atau direct property
  const docCount = docList.filter((doc) => {
    if (data.docs && typeof data.docs[doc.id] === 'boolean') {
      return data.docs[doc.id];
    }
    return Boolean(data[doc.id]);
  }).length;

  const skorKelengkapan = hitungSkorKelengkapan(docCount, totalDocs);
  const bobotKelengkapanRatio = (Number(weights.bobotKelengkapan) || 60) / 100;
  const kontribusiKelengkapan = skorKelengkapan * bobotKelengkapanRatio;

  // Pastikan skor kualitas dalam rentang 1 - 10 (standar 8.0)
  const skorKualitas = Math.min(10, Math.max(0, Number(data.skorKualitas) || 0));
  const bobotKualitasRatio = (Number(weights.bobotKualitas) || 40) / 100;
  const kontribusiKualitas = skorKualitas * bobotKualitasRatio;

  const nilaiAkhir = Number((kontribusiKelengkapan + kontribusiKualitas).toFixed(2));
  const predikat = tentukanPredikat(nilaiAkhir);

  const kehadiranCalc = hitungKehadiran(data.kehadiranLingkar);
  const jumlahMedpart = Math.max(0, Math.floor(Number(data.jumlahMedpart) || 0));

  return {
    docCount,
    totalDocs,
    skorKelengkapan,
    bobotKelengkapan: weights.bobotKelengkapan,
    kontribusiKelengkapan: Number(kontribusiKelengkapan.toFixed(2)),
    skorKualitas,
    bobotKualitas: weights.bobotKualitas,
    kontribusiKualitas: Number(kontribusiKualitas.toFixed(2)),
    nilaiAkhir,
    jumlahMedpart,
    kehadiran: {
      hadirCount: kehadiranCalc.hadirCount,
      totalPertemuan: kehadiranCalc.totalPertemuan,
      ratio: kehadiranCalc.ratio,
      persentase: kehadiranCalc.persentase,
      shortSummary: kehadiranCalc.shortSummary,
    },
    predikat,
  };
}

/**
 * Format raw template text from current data
 */
export function generateRawText(
  data: OrmawaData,
  docList: DocumentItem[] = DEFAULT_DOKUMEN_LIST
): string {
  const docLines = docList.map((doc) => {
    const isAvailable =
      data.docs && typeof data.docs[doc.id] === 'boolean'
        ? data.docs[doc.id]
        : Boolean(data[doc.id]);
    return `- ${doc.label}: ${isAvailable ? 'Ada' : 'Tidak Ada'}`;
  });

  const kehadiran = hitungKehadiran(data.kehadiranLingkar);
  const medpart = Math.max(0, Math.floor(Number(data.jumlahMedpart) || 0));

  return `Data Ormawa:
- Nama Ormawa: ${data.namaOrmawa || 'BEM FIK'}
${docLines.join('\n')}
- Skor Kualitas File (1-10): ${data.skorKualitas ?? 8.0}
- Kehadiran Lingkar Kominfo: ${kehadiran.ratio} (${kehadiran.detailText})
- Keaktifan Medpart: ${medpart} Kali`;
}

/**
 * Parse raw template text into OrmawaData
 */
export function parseRawText(
  rawText: string,
  docList: DocumentItem[] = DEFAULT_DOKUMEN_LIST
): Partial<OrmawaData> {
  const result: Partial<OrmawaData> = {
    docs: {},
  };

  const lines = rawText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Nama Ormawa
    const nameMatch = trimmed.match(/(?:Nama\s+Ormawa|Ormawa)\s*[:=]\s*(.+)/i);
    if (nameMatch && nameMatch[1]) {
      result.namaOrmawa = nameMatch[1].replace(/^[\[\(\{"']|[\]\)\}"']$/g, '').trim();
    }

    // Keaktifan / Jumlah Medpart (e.g. "- Keaktifan Medpart: 3 Kali" or "Medpart: 4")
    if (
      /(?:keaktifan|jumlah|total|frekuensi)\s*medpart/i.test(trimmed) ||
      /(?:medpart|media\s*partner)\s*[:=]\s*(\d+)/i.test(trimmed)
    ) {
      const medMatch = trimmed.match(/(\d+)/);
      if (medMatch) {
        result.jumlahMedpart = Math.max(0, parseInt(medMatch[1], 10));
      }
    }

    // Cocokkan terhadap daftar dokumen dinamis
    for (const doc of docList) {
      const escapedLabel = doc.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const docRegex = new RegExp(escapedLabel, 'i');
      if (docRegex.test(trimmed)) {
        const isAda = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
        result[doc.id] = isAda;
        if (!result.docs) result.docs = {};
        result.docs[doc.id] = isAda;
      }
    }

    // Fallback nama dokumen standar
    if (/press\s*release/i.test(trimmed)) {
      const isAda = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
      result.sopPressRelease = isAda;
      if (result.docs) result.docs['sopPressRelease'] = isAda;
    }
    if (/content\s*planner/i.test(trimmed)) {
      const isAda = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
      result.contentPlanner = isAda;
      if (result.docs) result.docs['contentPlanner'] = isAda;
    }
    if (/insight/i.test(trimmed)) {
      const isAda = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
      result.insightSosmed = isAda;
      if (result.docs) result.docs['insightSosmed'] = isAda;
    }
    if (/sop\s*medpart/i.test(trimmed)) {
      const isAda = /ada/i.test(trimmed) && !/tidak\s*ada/i.test(trimmed);
      result.sopMedpart = isAda;
      if (result.docs) result.docs['sopMedpart'] = isAda;
    }

    // Skor Kualitas
    if (/skor|kualitas/i.test(trimmed)) {
      const numMatch = trimmed.match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        const parsedNum = parseFloat(numMatch[1].replace(',', '.'));
        if (!isNaN(parsedNum)) {
          result.skorKualitas = Math.min(10, Math.max(0, parsedNum));
        }
      }
    }

    // Kehadiran Lingkar Kominfo (contoh: 2/3 atau 3/4)
    if (/lingkar|kehadiran/i.test(trimmed)) {
      const ratioMatch = trimmed.match(/(\d+)\s*\/\s*(\d+)/);
      if (ratioMatch) {
        const hadir = parseInt(ratioMatch[1], 10);
        const total = parseInt(ratioMatch[2], 10);
        const pertemuan: Record<number, boolean> = {};
        for (let i = 1; i <= total; i++) {
          pertemuan[i] = i <= hadir;
        }
        result.kehadiranLingkar = {
          totalPertemuan: total,
          pertemuan,
        };
      }
    }
  }

  return result;
}

/**
 * Format export summary report text
 */
export function generateSummaryReport(
  data: OrmawaData,
  result: CalculationResult,
  docList: DocumentItem[] = DEFAULT_DOKUMEN_LIST
): string {
  const docLines = docList.map((doc, idx) => {
    const isAvailable =
      data.docs && typeof data.docs[doc.id] === 'boolean'
        ? data.docs[doc.id]
        : Boolean(data[doc.id]);
    return `${idx + 1}. ${doc.label}: ${isAvailable ? '✅ Ada' : '❌ Tidak Ada'}`;
  });

  const bKelengkapanRatio = (result.bobotKelengkapan / 100).toFixed(2);
  const bKualitasRatio = (result.bobotKualitas / 100).toFixed(2);
  const kehadiran = hitungKehadiran(data.kehadiranLingkar);
  const medpartInfo = getMedpartLevel(data.jumlahMedpart ?? 0);

  return `📊 *REKAPITULASI PENILAIAN ADMINISTRASI KOMINFO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *Nama Ormawa:* ${data.namaOrmawa || '-'}
📅 *Tanggal Penilaian:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}

📋 *Status ${result.totalDocs} Dokumen Persyaratan:*
${docLines.join('\n')}

👥 *Kehadiran Forum Lingkar Kominfo:*
• Status: *${kehadiran.ratio} Hadir* (${kehadiran.persentase}%)
• Rincian: ${kehadiran.detailText}

🤝 *Keaktifan Media Partner (Medpart):*
• Frekuensi: *${medpartInfo.count} Kali* (${medpartInfo.label})
• Keterangan: ${medpartInfo.description}

🔢 *Rincian Perhitungan Nilai Administrasi:*
• Kelengkapan Dokumen: ${result.docCount}/${result.totalDocs} Dokumen
• Skor Kelengkapan (${result.bobotKelengkapan}%): ${result.skorKelengkapan.toFixed(1)} ➔ Kontribusi: ${result.kontribusiKelengkapan.toFixed(2)}
• Skor Kualitas File (${result.bobotKualitas}%): ${result.skorKualitas.toFixed(1)} ➔ Kontribusi: ${result.kontribusiKualitas.toFixed(2)}

🎯 *NILAI AKHIR:* *${result.nilaiAkhir.toFixed(2)}*
🎖️ *Predikat:* ${result.predikat.label}
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Rumus Terupdate:*
(Skor Kelengkapan × ${bKelengkapanRatio}) + (Skor Kualitas × ${bKualitasRatio})`;
}
