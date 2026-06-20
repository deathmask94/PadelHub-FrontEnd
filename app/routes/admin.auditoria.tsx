import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "~/components/ui/AdminLayout";
import { adminFetch, getAdminToken } from "~/services/adminAuth";

interface LogEntry {
  id:           string;
  action:       string;
  action_label: string;
  details:      string | null;
  ip:           string | null;
  created_at:   string;
  admin:        { id: string; name: string };
}

interface AuditResponse {
  logs:    LogEntry[];
  total:   number;
  page:    number;
  pages:   number;
  admins:  { id: string; name: string }[];
  actions: { key: string; label: string }[];
}

const ACTION_COLOR: Record<string, string> = {
  ADMIN_LOGIN:           "rgba(132,204,22,0.15)",
  USER_UPDATE:           "rgba(96,165,250,0.15)",
  MATCH_RESULT_ANNULLED: "rgba(251,191,36,0.15)",
  BACKUP_DOWNLOADED:     "rgba(167,139,250,0.15)",
  BACKUP_RESTORED:       "rgba(167,139,250,0.15)",
  MMR_ADJUST:            "rgba(251,146,60,0.15)",
};
const ACTION_TEXT: Record<string, string> = {
  ADMIN_LOGIN:           "#86efac",
  USER_UPDATE:           "#93c5fd",
  MATCH_RESULT_ANNULLED: "#fde68a",
  BACKUP_DOWNLOADED:     "#c4b5fd",
  BACKUP_RESTORED:       "#c4b5fd",
  MMR_ADJUST:            "#fdba74",
};

const inp: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text)", fontSize: 13, padding: "8px 12px",
  fontFamily: "var(--font-body)", width: "100%",
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminAuditoriaPage() {
  const navigate = useNavigate();

  const [data,      setData]      = useState<AuditResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [action,   setAction]   = useState("");
  const [adminId,  setAdminId]  = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);

  const buildQS = useCallback((p = page) => {
    const q = new URLSearchParams();
    q.set("page", String(p));
    if (action)   q.set("action",    action);
    if (adminId)  q.set("admin_id",  adminId);
    if (dateFrom) q.set("date_from", dateFrom);
    if (dateTo)   q.set("date_to",   dateTo);
    return q.toString();
  }, [page, action, adminId, dateFrom, dateTo]);

  const load = useCallback((p = 1) => {
    setLoading(true); setError("");
    adminFetch<AuditResponse>(`/api/admin/audit-logs?${buildQS(p)}`)
      .then((d) => { setData(d); setPage(p); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [buildQS]);

  useEffect(() => { load(1); }, []);

  const handleFilter = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams();
      if (action)   q.set("action",    action);
      if (adminId)  q.set("admin_id",  adminId);
      if (dateFrom) q.set("date_from", dateFrom);
      if (dateTo)   q.set("date_to",   dateTo);

      const token = getAdminToken();
      const base  = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const res   = await fetch(`${base}/api/admin/audit-logs/export?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al exportar");
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      const today    = new Date().toISOString().slice(0, 10);
      a.href         = url;
      a.download     = `auditoria_padelhub_${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al exportar CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Log de auditoría</h1>
          <button onClick={handleExport} disabled={exporting} style={{ background: "rgba(132,204,22,0.1)", border: "1px solid var(--accent)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "var(--accent)", cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "Exportando…" : "⬇ Exportar CSV"}
          </button>
        </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Filtros */}
          <form
            onSubmit={handleFilter}
            style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "16px 20px", marginBottom: 20,
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase" }}>
                Acción
              </div>
              <select style={inp} value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="">Todas</option>
                {data?.actions.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase" }}>
                Administrador
              </div>
              <select style={inp} value={adminId} onChange={(e) => setAdminId(e.target.value)}>
                <option value="">Todos</option>
                {data?.admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase" }}>
                Desde
              </div>
              <input type="date" style={inp} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase" }}>
                Hasta
              </div>
              <input type="date" style={inp} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button
              type="submit"
              style={{
                background: "var(--accent)", border: "none", borderRadius: 8,
                padding: "9px 20px", fontSize: 13, fontWeight: 600,
                color: "#000", cursor: "pointer",
              }}
            >
              Filtrar
            </button>
          </form>

          {/* Contador */}
          {data && (
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
              {data.total} {data.total === 1 ? "registro" : "registros"} encontrados
              {data.pages > 1 && ` · Página ${data.page} de ${data.pages}`}
            </div>
          )}

          {/* Tabla */}
          <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
          {data && data.logs.length === 0 ? (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "40px", textAlign: "center", color: "var(--text2)", fontSize: 14,
            }}>
              Sin registros para los filtros seleccionados
            </div>
          ) : (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
            }}>
              {/* Cabecera tabla */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "160px 140px 1fr 100px",
                padding: "10px 16px",
                background: "var(--bg3)",
                borderBottom: "1px solid var(--border)",
                fontSize: 11, fontWeight: 600, color: "var(--text2)",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                <span>Fecha y hora</span>
                <span>Administrador</span>
                <span>Acción / Detalle</span>
                <span>IP</span>
              </div>

              {data?.logs.map((log, i) => (
                <div
                  key={log.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 140px 1fr 100px",
                    padding: "12px 16px",
                    borderBottom: i < (data.logs.length - 1) ? "1px solid var(--border)" : "none",
                    alignItems: "start",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    {fmtDateTime(log.created_at)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {log.admin.name}
                  </div>
                  <div>
                    <span style={{
                      display: "inline-block",
                      background: ACTION_COLOR[log.action] ?? "rgba(255,255,255,0.05)",
                      color:      ACTION_TEXT[log.action]  ?? "var(--text2)",
                      borderRadius: 6, padding: "2px 8px",
                      fontSize: 11, fontWeight: 600,
                      marginBottom: log.details ? 4 : 0,
                    }}>
                      {log.action_label}
                    </span>
                    {log.details && (
                      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>
                        {log.details}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", wordBreak: "break-all" }}>
                    {log.ip ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>{/* /opacity wrapper */}

          {/* Paginación */}
          {data && data.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1 || loading}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px 16px", fontSize: 13,
                  color: page <= 1 ? "var(--text2)" : "var(--text)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                ← Anterior
              </button>
              <span style={{
                padding: "7px 16px", fontSize: 13, color: "var(--text2)",
                display: "flex", alignItems: "center",
              }}>
                {page} / {data.pages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= data.pages || loading}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px 16px", fontSize: 13,
                  color: page >= data.pages ? "var(--text2)" : "var(--text)",
                  cursor: page >= data.pages ? "not-allowed" : "pointer",
                  opacity: page >= data.pages ? 0.5 : 1,
                }}
              >
                Siguiente →
              </button>
            </div>
          )}

      </div>
    </AdminLayout>
  );
}
