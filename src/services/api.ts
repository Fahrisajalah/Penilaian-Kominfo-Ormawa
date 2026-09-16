import { OrmawaData } from '../types';

export interface SupabaseStatus {
  connected: boolean;
  tableReady: boolean;
  penilaianTableReady?: boolean;
  masterTableReady?: boolean;
  error?: string;
  sqlSchema?: string;
  penilaianSqlSchema?: string;
  masterSqlSchema?: string;
  url?: string;
}

export async function fetchSupabaseStatus(): Promise<SupabaseStatus> {
  try {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) throw new Error('Gagal memuat status server');
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      tableReady: false,
      error: err?.message || 'Server offline',
    };
  }
}

export async function fetchOrmawaRecords(): Promise<{
  success: boolean;
  records: OrmawaData[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/ormawa');
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, records: [], error: data.error };
    }
    return { success: true, records: data.records };
  } catch (err: any) {
    return { success: false, records: [], error: err.message };
  }
}

export async function saveOrmawaRecord(record: OrmawaData): Promise<{
  success: boolean;
  record?: OrmawaData;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ormawa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error };
    }
    return { success: true, record: data.record };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteOrmawaRecord(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ormawa/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function clearAllOrmawaRecords(): Promise<boolean> {
  try {
    const res = await fetch('/api/ormawa', { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// Master Ormawa APIs
export async function fetchMasterOrmawa(): Promise<{
  success: boolean;
  records: Array<{ id: string; nama: string; kategori?: string; createdAt?: number }>;
}> {
  try {
    const res = await fetch('/api/master-ormawa');
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, records: [] };
    }
    return { success: true, records: data.records };
  } catch {
    return { success: false, records: [] };
  }
}

export async function createMasterOrmawa(
  nama: string,
  kategori?: string
): Promise<{ success: boolean; record?: any; error?: string }> {
  try {
    const res = await fetch('/api/master-ormawa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, kategori }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error };
    }
    return { success: true, record: data.record };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateMasterOrmawa(
  id: string,
  nama: string,
  kategori?: string
): Promise<{ success: boolean; record?: any; error?: string }> {
  try {
    const res = await fetch(`/api/master-ormawa/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, kategori }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error };
    }
    return { success: true, record: data.record };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMasterOrmawa(id: string, nama?: string): Promise<boolean> {
  try {
    const url = nama
      ? `/api/master-ormawa/${encodeURIComponent(id)}?nama=${encodeURIComponent(nama)}`
      : `/api/master-ormawa/${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

