import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "~/components/ui/AdminLayout";
import { getAdminToken } from "~/services/adminAuth";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface BackupInfo {
  backup_date: string;
  total_records_exported: number;
  exported_entities_count: number;
  environment: string;
}
interface BackupFile {
  backup_info: BackupInfo;
  database: Record<string, { record_count: number; records: unknown[] }>;
}
interface RestoreResult {
  message: string;
  totalInserted: number;
  results: Record<string, { inserted: number; error?: string }>;
  backup_date: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminBackupPage() {
  const navigate    = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup (descarga)
  const [downloading, setDownloading] = useState(false);
  const [dlError,     setDlError]     = useState("");
  const [dlSuccess,   setDlSuccess]   = useState("");

  // Import (restore)
  const [parsedBackup, setParsedBackup] = useState<BackupFile | null>(null);
  const [fileError,    setFileError]    = useState("");
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<RestoreResult | null>(null);
  const [importError,  setImportError]  = useState("");
  const [showConfirm,  setShowConfirm]  = useState(false);

  // --- Descarga ---
  const handleDownload = async () => {
    setDownloading(true); setDlError(""); setDlSuccess("");
    try {
      const token = getAdminToken();
      const res = await fetch(`${API}/api/admin/backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al generar el respaldo");
      }
      const blob = await res.blob();
      const today = new Date().toISOString().split("T")[0];
      const fileName = `padelhub-backup-${today}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDlSuccess(`Respaldo descargado: ${fileName}`);
    } catch (e: unknown) {
      setDlError(e instanceof Error ? e.message : "Error al descargar el respaldo");
    } finally {
      setDownloading(false);
    }
  };

  // --- Validar archivo seleccionado ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(""); setParsedBackup(null); setImportResult(null); setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setFileError("Solo se aceptan archivos .json"); return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;
      if (!parsed.backup_info || !parsed.database) {
        setFileError("Formato inválido: el archivo no tiene la estructura de un respaldo PadelHub.");
        return;
      }
      setParsedBackup(parsed);
    } catch {
      setFileError("No se pudo leer el archivo JSON.");
    }
  };

  // --- Importar ---
  const handleImport = async () => {
    if (!parsedBackup) return;
    setImporting(true); setImportError(""); setImportResult(null); setShowConfirm(false);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API}/api/admin/backup/restore`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(parsedBackup),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar");
      setImportResult(data as RestoreResult);
      setParsedBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Error al importar el respaldo");
    } finally {
      setImporting(false);
    }
  };

  const tableEntries = parsedBackup
    ? Object.entries(parsedBackup.database).filter(([, v]) => v.record_count > 0)
    : [];

  return (
    <AdminLayout>
      <div style={{ padding: "24px 48px", maxWidth: 1000 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 24px 0" }}>Respaldo de base de datos</h1>

          {/* ── SECCIÓN DESCARGA ── */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>⬇️</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Descargar respaldo</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 18, lineHeight: 1.6 }}>
              Genera y descarga un archivo JSON con todos los datos de la plataforma: usuarios, partidos, resultados, historial de MMR y más. La acción queda registrada en el log de auditoría.
            </p>

            {dlError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#ef4444", marginBottom: 12 }}>
                {dlError}
              </div>
            )}
            {dlSuccess && (
              <div style={{ background: "rgba(132,204,22,0.1)", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>
                ✓ {dlSuccess}
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: "var(--accent)", border: "none", borderRadius: 10,
                padding: "10px 24px", fontSize: 13, fontWeight: 700,
                color: "#000", cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.6 : 1,
              }}
            >
              {downloading ? "Generando respaldo..." : "Descargar respaldo completo"}
            </button>
          </div>

          {/* ── SECCIÓN IMPORTAR ── */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>⬆️</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Importar respaldo</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, lineHeight: 1.6 }}>
              Sube un archivo de respaldo previamente descargado. Los registros existentes <strong>no se eliminarán</strong> — se insertan solo los nuevos (upsert no destructivo).
            </p>
            <div style={{ fontSize: 12, color: "#facc15", background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 18 }}>
              ⚠️ Esta operación no puede deshacerse. Revisa el resumen antes de confirmar.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              style={{
                background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
                color: "var(--text)", cursor: importing ? "not-allowed" : "pointer",
              }}
            >
              Seleccionar archivo JSON
            </button>

            {fileError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#ef4444", marginTop: 12 }}>
                {fileError}
              </div>
            )}

            {/* Resumen del backup seleccionado */}
            {parsedBackup && !importResult && (
              <div style={{ marginTop: 16, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  RESUMEN DEL ARCHIVO
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 13, marginBottom: 14 }}>
                  <div><span style={{ color: "var(--text2)" }}>Fecha: </span>{fmtDate(parsedBackup.backup_info.backup_date)}</div>
                  <div><span style={{ color: "var(--text2)" }}>Entorno: </span>{parsedBackup.backup_info.environment}</div>
                  <div><span style={{ color: "var(--text2)" }}>Total registros: </span><strong>{parsedBackup.backup_info.total_records_exported.toLocaleString()}</strong></div>
                  <div><span style={{ color: "var(--text2)" }}>Tablas: </span>{parsedBackup.backup_info.exported_entities_count}</div>
                </div>

                {/* Tablas con datos */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {tableEntries.map(([name, val]) => (
                    <span key={name} style={{
                      fontSize: 11, background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
                      borderRadius: 6, padding: "2px 8px", color: "var(--text2)",
                    }}>
                      {name}: {val.record_count}
                    </span>
                  ))}
                </div>

                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    style={{
                      background: "rgba(132,204,22,0.1)", border: "1px solid var(--accent)",
                      borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                      color: "var(--accent)", cursor: "pointer",
                    }}
                  >
                    Continuar con la importación →
                  </button>
                ) : (
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid #ef444455", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>¿Confirmar importación?</div>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                      Se insertarán los registros nuevos de este backup. Los registros ya existentes (mismo ID) serán omitidos.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={handleImport}
                        disabled={importing}
                        style={{
                          background: "var(--accent)", border: "none", borderRadius: 8,
                          padding: "8px 20px", fontSize: 13, fontWeight: 700,
                          color: "#000", cursor: importing ? "not-allowed" : "pointer",
                          opacity: importing ? 0.6 : 1,
                        }}
                      >
                        {importing ? "Importando..." : "Sí, importar"}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        style={{
                          background: "none", border: "1px solid var(--border)", borderRadius: 8,
                          padding: "8px 16px", fontSize: 13, color: "var(--text2)", cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginTop: 14 }}>
                {importError}
              </div>
            )}

            {/* Resultado de la importación */}
            {importResult && (
              <div style={{ marginTop: 16, background: "rgba(132,204,22,0.06)", border: "1px solid var(--accent)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)", marginBottom: 8 }}>
                  ✓ {importResult.message}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                  Backup del {fmtDate(importResult.backup_date)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(importResult.results)
                    .filter(([, v]) => v.inserted > 0 || v.error)
                    .map(([name, v]) => (
                      <span key={name} style={{
                        fontSize: 11, borderRadius: 6, padding: "2px 8px",
                        background: v.error ? "rgba(239,68,68,0.1)" : "rgba(132,204,22,0.08)",
                        border: `1px solid ${v.error ? "#ef444455" : "var(--border2)"}`,
                        color: v.error ? "#ef4444" : "var(--text2)",
                      }}>
                        {name}: {v.error ? `error` : `+${v.inserted}`}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
      </div>
    </AdminLayout>
  );
}
