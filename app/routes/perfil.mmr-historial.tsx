import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

interface ChartPoint { label: string; mmr: number; }
interface MatchEntry {
  match_id:   string | null;
  club:       string | null;
  date:       string | null;
  mmr_before: number;
  mmr_after:  number;
  delta:      number;
  win:        boolean;
}
interface Pagination { page: number; page_size: number; total: number; total_pages: number; }
interface Summary { played: number; wins: number; losses: number; total_delta: number; }
interface HistoryData { chart: ChartPoint[]; matches: MatchEntry[]; pagination: Pagination; summary: Summary; }

export default function MmrHistorial() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data,    setData]    = useState<HistoryData | null>(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user?.rut) return;
    setLoading(true);
    apiFetch<HistoryData>(`/api/users/${user.rut}/mmr-history?page=${page}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.rut, page]);

  const chart   = data?.chart   ?? [];
  const matches = data?.matches ?? [];
  const summary = data?.summary ?? { played: 0, wins: 0, losses: 0, total_delta: 0 };
  const pagination = data?.pagination ?? { page: 1, page_size: 10, total: 0, total_pages: 1 };
  const maxMMR  = chart.length > 0 ? Math.max(...chart.map((w) => w.mmr)) : 1;
  const minMMR  = chart.length > 0 ? Math.min(...chart.map((w) => w.mmr)) : 0;
  const range   = maxMMR - minMMR || 1;

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 16px" }}>
          <button className="ph-back-btn" onClick={() => navigate("/perfil")}>←</button>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
              Historial MMR
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Todo tu historial</div>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {loading && matches.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text2)", fontSize: 14 }}>
              Cargando historial…
            </div>
          )}

          {error && <div className="ph-error">{error}</div>}

          {!error && data && (
            <>
              {/* Resumen */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { val: String(summary.played),  label: "Partidos",  color: undefined },
                  { val: String(summary.wins),    label: "Victorias", color: undefined },
                  { val: String(summary.losses),  label: "Derrotas",  color: undefined },
                  { val: summary.total_delta >= 0 ? `+${summary.total_delta}` : String(summary.total_delta), label: "MMR total", color: summary.total_delta >= 0 ? "#4ade80" : "#fca5a5" },
                ].map((s) => (
                  <div key={s.label} className="ph-card" style={{ textAlign: "center", padding: "14px 8px" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 4, color: s.color ?? "var(--text)" }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grafico de evolucion */}
              <div className="ph-card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 }}>
                  Evolución de MMR
                </div>

                {chart.length === 0 ? (
                  <div style={{ height: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ fontSize: 28 }}>📈</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>Sin actividad todavía</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text2)", marginBottom: 4 }}>
                      <span>{minMMR}</span><span>{maxMMR}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90, marginBottom: 6 }}>
                      {chart.map((w, i) => {
                        const heightPct = ((w.mmr - minMMR) / range) * 85 + 15;
                        const isLast    = i === chart.length - 1;
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                              <div style={{ width: "100%", height: `${heightPct}%`, background: isLast ? "var(--accent)" : "rgba(132,204,22,0.35)", borderRadius: "3px 3px 0 0" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text2)" }}>
                      <span>{chart[0]?.label}</span>
                      <span>{chart[Math.floor((chart.length - 1) / 2)]?.label}</span>
                      <span>{chart[chart.length - 1]?.label}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Lista de partidos */}
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Detalle por partido ({pagination.total})
              </div>

              {matches.length === 0 ? (
                <div className="ph-card" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Sin partidos todavía</div>
                </div>
              ) : (
                <div className="ph-card" style={{ opacity: loading ? 0.5 : 1 }}>
                  {matches.map((m, i) => (
                    <div key={m.match_id ?? i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < matches.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: m.win ? "var(--green)" : "var(--red)", display: "inline-block" }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{m.club}</div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>
                            {m.date ? formatDate(m.date) : "—"} · {m.mmr_before} → {m.mmr_after} MMR
                          </div>
                        </div>
                      </div>
                      <span className={`ph-pill ${m.win ? "ph-pill-green" : "ph-pill-red"}`} style={{ fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginación */}
              {pagination.total_pages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    style={{
                      padding: "8px 14px", borderRadius: 8,
                      border: "1px solid var(--border)", background: "var(--bg3)",
                      color: page <= 1 ? "var(--text2)" : "var(--text)",
                      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                      cursor: page <= 1 || loading ? "not-allowed" : "pointer",
                      opacity: page <= 1 ? 0.5 : 1,
                    }}
                  >
                    ← Anterior
                  </button>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>
                    Página {pagination.page} de {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                    disabled={page >= pagination.total_pages || loading}
                    style={{
                      padding: "8px 14px", borderRadius: 8,
                      border: "1px solid var(--border)", background: "var(--bg3)",
                      color: page >= pagination.total_pages ? "var(--text2)" : "var(--text)",
                      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                      cursor: page >= pagination.total_pages || loading ? "not-allowed" : "pointer",
                      opacity: page >= pagination.total_pages ? 0.5 : 1,
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
