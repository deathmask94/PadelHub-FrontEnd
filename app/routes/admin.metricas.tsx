import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "~/components/ui/AdminLayout";
import { adminFetch } from "~/services/adminAuth";

interface Metrics {
  users: {
    active:     number;
    total:      number;
    pct_active: number;
    pct_played: number;
  };
  matches: {
    this_week: number;
    live:      number;
  };
  avg_mmr: number;
  zones:  { zone: string;  count: number }[];
  levels: { level: string; label: string; count: number }[];
}

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "18px 20px",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
        color: "var(--accent)", lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function BarChart({
  title,
  rows,
  total,
  color = "var(--accent)",
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
  color?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "20px",
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--text2)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 18,
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(({ label, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barW = Math.round((count / max) * 100);
          return (
            <div key={label}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 13, marginBottom: 5,
              }}>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>{label}</span>
                <span style={{ color: "var(--text2)", fontSize: 12 }}>
                  {count} · {pct}%
                </span>
              </div>
              <div style={{
                height: 8, borderRadius: 4,
                background: "var(--bg3)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${barW}%`,
                  background: color, borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminMetricasPage() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [lastUpd, setLastUpd] = useState<Date | null>(null);

  const load = () => {
    setLoading(true); setError("");
    adminFetch<Metrics>("/api/admin/metrics")
      .then((d) => { setData(d); setLastUpd(new Date()); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar métricas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <AdminLayout>
      <div style={{ padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Métricas de plataforma</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {lastUpd && <span style={{ fontSize: 11, color: "var(--text2)" }}>Actualizado: {fmtTime(lastUpd)}</span>}
            <button onClick={load} disabled={loading} style={{ background: "rgba(132,204,22,0.1)", border: "1px solid var(--accent)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--accent)", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>
        </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {data && (
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
              {/* Fila 1: stats rápidas */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard
                  value={data.users.active}
                  label="Usuarios activos"
                  sub={`${data.users.pct_active}% del total (${data.users.total})`}
                />
                <StatCard
                  value={data.matches.this_week}
                  label="Partidos esta semana"
                  sub="Finalizados desde el lunes"
                />
                <StatCard
                  value={data.matches.live}
                  label="En curso ahora"
                  sub="Confirmados o en progreso"
                />
                <StatCard
                  value={data.avg_mmr}
                  label="MMR promedio"
                  sub="Entre usuarios activos"
                />
                <StatCard
                  value={`${data.users.pct_played}%`}
                  label="Han jugado al menos 1 partido"
                  sub="De los usuarios activos"
                />
              </div>

              {/* Fila 2: gráficos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <BarChart
                  title="Top 5 zonas por nº de jugadores"
                  rows={data.zones.map((z) => ({ label: z.zone, count: z.count }))}
                  total={data.users.active}
                  color="var(--accent)"
                />
                <BarChart
                  title="Distribución de niveles"
                  rows={data.levels.map((l) => ({ label: l.label, count: l.count }))}
                  total={data.users.active}
                  color="#60a5fa"
                />
              </div>
            </div>
          )}

      </div>
    </AdminLayout>
  );
}
