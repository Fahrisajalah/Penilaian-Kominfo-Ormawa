import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || "https://qzuybnjrgsbwfajsrmgk.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.error("Error initializing Supabase client:", err);
  }
}

// SQL Schema definitions separated for clarity
const PENILAIAN_SQL_SCHEMA = `CREATE TABLE IF NOT EXISTS penilaian_ormawa (
  id TEXT PRIMARY KEY,
  nama_ormawa TEXT NOT NULL,
  sop_press_release BOOLEAN DEFAULT false,
  content_planner BOOLEAN DEFAULT false,
  insight_sosmed BOOLEAN DEFAULT false,
  sop_medpart BOOLEAN DEFAULT false,
  skor_kualitas NUMERIC DEFAULT 0,
  skor_kelengkapan NUMERIC DEFAULT 0,
  nilai_akhir NUMERIC DEFAULT 0,
  predikat TEXT,
  kehadiran_lingkar JSONB DEFAULT '{}'::jsonb,
  jumlah_medpart INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE penilaian_ormawa ADD COLUMN IF NOT EXISTS kehadiran_lingkar JSONB DEFAULT '{}'::jsonb;
ALTER TABLE penilaian_ormawa ADD COLUMN IF NOT EXISTS jumlah_medpart INTEGER DEFAULT 0;
ALTER TABLE penilaian_ormawa DISABLE ROW LEVEL SECURITY;`;

const MASTER_SQL_SCHEMA = `-- TABEL TERPISAH: Master Daftar Nama Ormawa
CREATE TABLE IF NOT EXISTS master_ormawa (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  kategori TEXT DEFAULT 'Ormawa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE master_ormawa DISABLE ROW LEVEL SECURITY;

-- Data Awal Ormawa (Opsional):
INSERT INTO master_ormawa (id, nama, kategori)
VALUES
  ('ormawa_bem_fik', 'BEM FIK', 'BEM'),
  ('ormawa_dpm_fik', 'DPM FIK', 'DPM'),
  ('ormawa_hima_ti', 'HIMA TI', 'Himpunan'),
  ('ormawa_hima_si', 'HIMA SI', 'Himpunan'),
  ('ormawa_ukm_robotika', 'UKM Robotika', 'UKM'),
  ('ormawa_ukm_seni', 'UKM Seni & Budaya', 'UKM'),
  ('ormawa_ukm_olahraga', 'UKM Olahraga', 'UKM'),
  ('ormawa_gdsc', 'GDSC', 'Komunitas')
ON CONFLICT (nama) DO NOTHING;`;

const SQL_SCHEMA = `${PENILAIAN_SQL_SCHEMA}\n\n${MASTER_SQL_SCHEMA}`;

// In-memory fallback for master ormawa
let localMasterOrmawa = [
  { id: "ormawa_bem_fik", nama: "BEM FIK", kategori: "BEM", createdAt: Date.now() - 700000 },
  { id: "ormawa_dpm_fik", nama: "DPM FIK", kategori: "DPM", createdAt: Date.now() - 600000 },
  { id: "ormawa_hima_ti", nama: "HIMA TI", kategori: "Himpunan", createdAt: Date.now() - 500000 },
  { id: "ormawa_hima_si", nama: "HIMA SI", kategori: "Himpunan", createdAt: Date.now() - 400000 },
  { id: "ormawa_ukm_robotika", nama: "UKM Robotika", kategori: "UKM", createdAt: Date.now() - 300000 },
  { id: "ormawa_ukm_seni", nama: "UKM Seni & Budaya", kategori: "UKM", createdAt: Date.now() - 200000 },
  { id: "ormawa_ukm_olahraga", nama: "UKM Olahraga", kategori: "UKM", createdAt: Date.now() - 100000 },
  { id: "ormawa_gdsc", nama: "GDSC", kategori: "Komunitas", createdAt: Date.now() },
];

// API: Health & Supabase status check
app.get("/api/supabase/status", async (_req, res) => {
  if (!supabase) {
    return res.json({
      connected: false,
      message: "Supabase client tidak terkonfigurasi. Periksa kredensial di .env",
      tableReady: false,
      penilaianTableReady: false,
      masterTableReady: false,
      sqlSchema: SQL_SCHEMA,
      penilaianSqlSchema: PENILAIAN_SQL_SCHEMA,
      masterSqlSchema: MASTER_SQL_SCHEMA,
    });
  }

  try {
    const isMissing = (err: any) =>
      Boolean(
        err &&
          (err.code === "42P01" ||
            err.code === "PGRST204" ||
            err.code === "PGRST205" ||
            err.message?.toLowerCase().includes("does not exist") ||
            err.message?.toLowerCase().includes("not found") ||
            err.message?.toLowerCase().includes("schema cache"))
      );

    const { error: errPenilaian } = await supabase.from("penilaian_ormawa").select("id").limit(1);
    const { error: errMaster } = await supabase.from("master_ormawa").select("id").limit(1);

    const penilaianTableReady = !isMissing(errPenilaian);
    const masterTableReady = !isMissing(errMaster);

    return res.json({
      connected: true,
      tableReady: penilaianTableReady,
      penilaianTableReady,
      masterTableReady,
      sqlSchema: SQL_SCHEMA,
      penilaianSqlSchema: PENILAIAN_SQL_SCHEMA,
      masterSqlSchema: MASTER_SQL_SCHEMA,
      url: supabaseUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      error: err?.message || "Unknown error",
      sqlSchema: SQL_SCHEMA,
      penilaianSqlSchema: PENILAIAN_SQL_SCHEMA,
      masterSqlSchema: MASTER_SQL_SCHEMA,
    });
  }
});

// API: Get all Ormawa records from Supabase
app.get("/api/ormawa", async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase belum diinisialisasi" });
  }

  try {
    const { data, error } = await supabase
      .from("penilaian_ormawa")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message, code: error.code });
    }

    // Map snake_case to frontend camelCase
    const records = (data || []).map((row) => ({
      id: row.id,
      namaOrmawa: row.nama_ormawa,
      sopPressRelease: Boolean(row.sop_press_release),
      contentPlanner: Boolean(row.content_planner),
      insightSosmed: Boolean(row.insight_sosmed),
      sopMedpart: Boolean(row.sop_medpart),
      skorKualitas: Number(row.skor_kualitas),
      skorKelengkapan: Number(row.skor_kelengkapan),
      nilaiAkhir: Number(row.nilai_akhir),
      predikat: row.predikat,
      kehadiranLingkar: row.kehadiran_lingkar || undefined,
      jumlahMedpart: typeof row.jumlah_medpart === 'number' ? row.jumlah_medpart : 0,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));

    return res.json({ success: true, records });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// API: Insert or update Ormawa record
app.post("/api/ormawa", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase belum diinisialisasi" });
  }

  try {
    const body = req.body;
    const recordId = body.id || `ormawa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payload: any = {
      id: recordId,
      nama_ormawa: body.namaOrmawa || "Ormawa Tanpa Nama",
      sop_press_release: Boolean(body.sopPressRelease),
      content_planner: Boolean(body.contentPlanner),
      insight_sosmed: Boolean(body.insightSosmed),
      sop_medpart: Boolean(body.sopMedpart),
      skor_kualitas: Number(body.skorKualitas) || 0,
      skor_kelengkapan: Number(body.skorKelengkapan) || 0,
      nilai_akhir: Number(body.nilaiAkhir) || 0,
      predikat: body.predikat || "",
      jumlah_medpart: Math.max(0, Math.floor(Number(body.jumlahMedpart) || 0)),
      created_at: new Date().toISOString(),
    };

    if (body.kehadiranLingkar) {
      payload.kehadiran_lingkar = body.kehadiranLingkar;
    }

    let { data, error } = await supabase
      .from("penilaian_ormawa")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    // Fallback if column not yet added to remote table
    if (error && (error.code === '42703' || error.message?.includes('kehadiran_lingkar') || error.message?.includes('jumlah_medpart'))) {
      delete payload.kehadiran_lingkar;
      delete payload.jumlah_medpart;
      const retry = await supabase
        .from("penilaian_ormawa")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return res.status(400).json({ error: error.message, code: error.code });
    }

    return res.json({
      success: true,
      record: {
        id: data.id,
        namaOrmawa: data.nama_ormawa,
        sopPressRelease: Boolean(data.sop_press_release),
        contentPlanner: Boolean(data.content_planner),
        insightSosmed: Boolean(data.insight_sosmed),
        sopMedpart: Boolean(data.sop_medpart),
        skorKualitas: Number(data.skor_kualitas),
        skorKelengkapan: Number(data.skor_kelengkapan),
        nilaiAkhir: Number(data.nilai_akhir),
        predikat: data.predikat,
        kehadiranLingkar: data.kehadiran_lingkar || body.kehadiranLingkar,
        jumlahMedpart: Number(data.jumlah_medpart ?? body.jumlahMedpart ?? 0),
        timestamp: new Date(data.created_at).getTime(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// API: Delete Ormawa record by id
app.delete("/api/ormawa/:id", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase belum diinisialisasi" });
  }

  try {
    const { id } = req.params;
    const { error } = await supabase.from("penilaian_ormawa").delete().eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// API: Clear all records
app.delete("/api/ormawa", async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase belum diinisialisasi" });
  }

  try {
    // Delete all records where id is not empty
    const { error } = await supabase.from("penilaian_ormawa").delete().neq("id", "");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// ========================
// MASTER ORMAWA CRUD API
// ========================

// GET /api/master-ormawa
app.get("/api/master-ormawa", async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("master_ormawa")
        .select("*")
        .order("nama", { ascending: true });

      if (!error && data && data.length > 0) {
        const records = data.map((d: any) => ({
          id: d.id,
          nama: d.nama,
          kategori: d.kategori || "Ormawa",
          createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
        }));
        return res.json({ success: true, records });
      }
    } catch (e) {
      console.warn("Supabase master_ormawa query fallback:", e);
    }
  }

  // Fallback to local memory list
  return res.json({ success: true, records: localMasterOrmawa });
});

// POST /api/master-ormawa (Create)
app.post("/api/master-ormawa", async (req, res) => {
  const { nama, kategori } = req.body;
  if (!nama || !nama.trim()) {
    return res.status(400).json({ error: "Nama Ormawa tidak boleh kosong" });
  }

  const cleanNama = nama.trim();
  const id = `ormawa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanKategori = (kategori && kategori.trim()) || "Ormawa";
  const newOrmawa = {
    id,
    nama: cleanNama,
    kategori: cleanKategori,
    createdAt: Date.now(),
  };

  // Add to local memory
  const existingIdx = localMasterOrmawa.findIndex(
    (o) => o.nama.toLowerCase() === cleanNama.toLowerCase()
  );
  if (existingIdx === -1) {
    localMasterOrmawa.unshift(newOrmawa);
  }

  if (supabase) {
    try {
      await supabase.from("master_ormawa").upsert(
        {
          id,
          nama: cleanNama,
          kategori: cleanKategori,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (e) {
      console.warn("Supabase insert master_ormawa skipped/error:", e);
    }
  }

  return res.json({ success: true, record: newOrmawa });
});

// PUT /api/master-ormawa/:id (Update)
app.put("/api/master-ormawa/:id", async (req, res) => {
  const { id } = req.params;
  const { nama, kategori } = req.body;

  if (!nama || !nama.trim()) {
    return res.status(400).json({ error: "Nama Ormawa tidak boleh kosong" });
  }

  const cleanNama = nama.trim();
  const cleanKategori = kategori?.trim() || "Ormawa";

  // Update local memory
  const idx = localMasterOrmawa.findIndex((o) => o.id === id);
  if (idx !== -1) {
    localMasterOrmawa[idx] = {
      ...localMasterOrmawa[idx],
      nama: cleanNama,
      kategori: cleanKategori,
    };
  }

  if (supabase) {
    try {
      await supabase
        .from("master_ormawa")
        .update({ nama: cleanNama, kategori: cleanKategori })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase update master_ormawa error:", e);
    }
  }

  return res.json({
    success: true,
    record: { id, nama: cleanNama, kategori: cleanKategori },
  });
});

// DELETE /api/master-ormawa/:id (Delete)
app.delete("/api/master-ormawa/:id", async (req, res) => {
  const { id } = req.params;
  const namaQuery = req.query.nama as string | undefined;

  const targetItem = localMasterOrmawa.find(
    (o) => o.id === id || (namaQuery && o.nama.toLowerCase() === namaQuery.toLowerCase())
  );
  const targetNama = targetItem?.nama || namaQuery;

  localMasterOrmawa = localMasterOrmawa.filter(
    (o) => o.id !== id && (!targetNama || o.nama.toLowerCase() !== targetNama.toLowerCase())
  );

  if (supabase) {
    try {
      await supabase.from("master_ormawa").delete().eq("id", id);
      if (targetNama) {
        await supabase.from("master_ormawa").delete().eq("nama", targetNama);
      }
    } catch (e) {
      console.warn("Supabase delete master_ormawa error:", e);
    }
  }

  return res.json({ success: true });
});

// Vite middleware for frontend serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
