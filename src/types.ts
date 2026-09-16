export interface DocumentItem {
  id: 'sopPressRelease' | 'contentPlanner' | 'insightSosmed' | 'sopMedpart';
  label: string;
  description: string;
}

export interface OrmawaData {
  id?: string;
  namaOrmawa: string;
  sopPressRelease: boolean;
  contentPlanner: boolean;
  insightSosmed: boolean;
  sopMedpart: boolean;
  skorKualitas: number;
  timestamp?: number;
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
  predikat: {
    label: string;
    badgeColor: string;
    textColor: string;
    description: string;
  };
}
