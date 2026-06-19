import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import AdminRoute from "~/components/ui/AdminRoute";
import { adminFetch } from "~/services/adminAuth";

interface AdminMatch {
  id: string;
  club: string;
  format: string;
  status: string;
  match_date: string;
  match_time: string;
  created_at: string;
  users: { id: string; name: string; zone: string };
  _count: { match_players: number };
  match_results: { winner: string; score_team_a: string; score_team_b: string } | null;
}
interface PagedResult {
  matches: AdminMatch[]; total: number; page: number; pageSize: number; totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  open:        "Abierto",
  confirmed:   "Confirmado",
  in_progress: "En juego",
  finished:    "Finalizado",
  cancelled:   "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  open:        "#60a5fa",
  confirmed:   "var(--accent)",
  in_progress: "#facc15",
  finished:    "var(--text2)",
  cancelled:   "#ef4444",
};
const ZONAS = [
  "Valparaíso","Viña del Mar","Quilpué","Villa Alemana",
  "Concón","Santiago Centro","Providencia","Las Condes",
];
const sel: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text)", fontSize: 12, padding: "6px 10px", fontFamily: "var(--font-body)",
};
const inp: React.CSSProperties = { ...sel, outline: "none" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminPartidosPage() {
  const navigate = useNavigate();

  const [data,     setData]     = useState<PagedResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [q,        setQ]        = useState("");
  const [zone,     setZone]     = useState("");
  const [status,   setStatus]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const qs = new URLSearchParams({
      page: String(page),
      ...(q.length >= 2 ? { q }        : {}),
      ...(zone           ? { zone }     : {}),
      ...(status         ? { status }   : {}),
      ...(dateFrom       ? { date_from: dateFrom } : {}),
      ...(dateTo         ? { date_to:   dateTo   } : {}),
    });
    try {
      setData(await adminFetch<PagedResult>(`/api/admin/matches?${qs}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  }, [page, q, zone, status, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, zone, status, dateFrom, dateTo]);

  return (
    <AdminRoute>
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
        {/* Navbar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px", background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => navigate("/admin")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text2)", padding: 0 }}>
              ←
            </button>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Gestión de partidos</span>
          </div>
          {data && <span style={{ fontSize: 12, color: "var(--text2)" }}>{data.total} partidos</span>}
        </header>

        <main style={{ padding: "20px 24px", maxWidth: 960, margin: "0 auto" }}>
          {/* Filtros */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 10, marginBottom: 20 }}>
            <input style={inp} placeholder="Buscar por club..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select style={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select style={sel} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Todas las zonas</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
            <input type="date" style={sel} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Desde" />
            <input type="date" style={sel} value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   title="Hasta" />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: 60, fontSize: 14 }}>Cargando...</div>
          ) : data?.matches.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: 60, fontSize: 14 }}>No se encontraron partidos con esos filtros.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data?.matches.map((m) => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "12px 16px",
                }}>
                  {/* Fecha */}
                  <div style={{
                    flexShrink: 0, textAlign: "center", minWidth: 50,
                    background: "var(--bg3)", borderRadius: 8, padding: "6px 8px",
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {new Date(m.match_date).getUTCDate().toString().padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase" }}>
                      {new Date(m.match_date).toLocaleDateString("es-CL", { month: "short", timeZone: "UTC" })}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {m.club}
                      <span style={{
                        fontSize: 10, borderRadius: 6, padding: "1px 7px",
                        background: `${STATUS_COLORS[m.status]}22`,
                        color: STATUS_COLORS[m.status], border: `1px solid ${STATUS_COLORS[m.status]}44`,
                      }}>
                        {STATUS_LABELS[m.status] ?? m.status}
                      </span>
                      {m.match_results && (
                        <span style={{ fontSize: 10, color: "var(--text2)" }}>
                          {m.match_results.score_team_a} – {m.match_results.score_team_b}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span>Org: {m.users.name}</span>
                      <span>{m.users.zone}</span>
                      <span>{m.format === "doubles" ? "Dobles" : "Singles"}</span>
                      <span>{m._count.match_players} jugadores</span>
                      <span>Creado {fmtDate(m.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/partidos/${m.id}`)}
                    style={{
                      background: "none", border: "1px solid var(--border)", borderRadius: 8,
                      padding: "6px 14px", fontSize: 12, color: "var(--text2)",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Ver →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 16px", fontSize: 12, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, color: "var(--text)" }}>
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>Página {page} de {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 16px", fontSize: 12, cursor: page === data.totalPages ? "not-allowed" : "pointer", opacity: page === data.totalPages ? 0.4 : 1, color: "var(--text)" }}>
                Siguiente →
              </button>
            </div>
          )}
        </main>
      </div>
    </AdminRoute>
  );
}
