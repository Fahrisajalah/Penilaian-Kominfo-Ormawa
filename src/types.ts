export interface DocumentItem {
  id: string;
  label: string;
  description: string;
}

export interface WeightSettings {
  bobotKelengkapan: number; // e.g. 60
  bobotKualitas: number;    // e.g. 40
}

export interface KehadiranLingkar {
  totalPertemuan: number; // e.g. 3 atau 4 (bisa diatur)
  pertemuan: Record<number, boolean>; // e.g. { 1: true, 2: true, 3: false }
  keterangan?: string;
}

export interface OrmawaData {
  id?: string;
  namaOrmawa: string;
  sopPressRelease?: boolean;
  contentPlanner?: boolean;
  insightSosmed?: boolean;
  sopMedpart?: boolean;
  docs?: Record<string, boolean>;
  skorKualitas: number;
  timestamp?: number;
  kehadiranLingkar?: KehadiranLingkar; // Kehadiran forum Lingkar Kominfo (e.g. 2/3 Hadir)
  jumlahMedpart?: number; // Keaktifan bermedpart (0 s/d tak terhingga kali)
  [key: string]: any;
}

export interface MasterOrmawa {
  id: string;
  nama: string;
  kategori?: string;
  createdAt?: number;
}

export interface CalculationResult {
  docCount: number;
  totalDocs: number;
  skorKelengkapan: number;
  bobotKelengkapan: number;
  kontribusiKelengkapan: number;
  skorKualitas: number;
  bobotKualitas: number;
  kontribusiKualitas: number;
  nilaiAkhir: number;
  jumlahMedpart: number;
  kehadiran?: {
    hadirCount: number;
    totalPertemuan: number;
    ratio: string;
    persentase: number;
    shortSummary: string;
  };
  predikat: {
    label: string;
    badgeColor: string;
    textColor: string;
    description: string;
  };
}
