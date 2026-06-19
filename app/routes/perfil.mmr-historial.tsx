import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

interface WeekPoint { label: string; mmr: number; }
interface MatchEntry {
  match_id:   string;
  club:       string;
  date:       string;
  mmr_before: number;
  mmr_after:  number;
  delta:      number;
  win:        boolean;
}
interface HistoryData { weekly_chart: WeekPoint[]; matches: MatchEntry[]; }

export default function MmrHistorial() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data,    setData]    = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user?.rut) return;
    apiFetch<HistoryData>(`/api/users/${user.rut}/mmr-history`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.rut]);

  const chart   = data?.weekly_chart ?? [];
  const matches = data?.matches      ?? [];
  const maxMMR  = chart.length > 0 ? Math.max(...chart.map((w) => w.mmr)) : 1;
  const minMMR  = chart.length > 0 ? Math.min(...chart.map((w) => w.mmr)) : 0;
  const range   = maxMMR - minMMR || 1;

  const totalDelta = matches.reduce((s, m) => s + m.delta, 0);
  const wins       = matches.filter((m) => m.win).length;

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
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Últimos 3 meses</div>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text2)", fontSize: 14 }}>
              Cargando historial…
            </div>
          )}

          {error && <div className="ph-error">{error}</div>}

          {!loading && !error && (
            <>
              {/* Resumen */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { val: String(matches.length), label: "Partidos",  color: undefined },
                  { val: String(wins),            label: "Victorias", color: undefined },
                  { val: totalDelta >= 0 ? `+${totalDelta}` : String(totalDelta), label: "MMR total", color: totalDelta >= 0 ? "#4ade80" : "#fca5a5" },
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

              {/* Grafico de evolucion semanal */}
              <div className="ph-card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 }}>
                  Evolución semanal — 13 semanas
                </div>

                {matches.length === 0 ? (
                  <div style={{ height: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ fontSize: 28 }}>📈</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>Sin actividad en los últimos 3 meses</div>
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
                      <span>{chart[6]?.label}</span>
                      <span>{chart[12]?.label}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Lista de partidos */}
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Detalle por partido ({matches.length})
              </div>

              {matches.length === 0 ? (
                <div className="ph-card" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Sin partidos en los últimos 3 meses</div>
                </div>
              ) : (
                <div className="ph-card">
                  {matches.map((m, i) => (
                    <div key={m.match_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < matches.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: m.win ? "var(--green)" : "var(--red)", display: "inline-block" }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{m.club}</div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>
                            {formatDate(m.date)} · {m.mmr_before} → {m.mmr_after} MMR
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
