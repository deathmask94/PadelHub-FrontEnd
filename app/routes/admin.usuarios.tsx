import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import AdminRoute from "~/components/ui/AdminRoute";
import { adminFetch } from "~/services/adminAuth";

interface AdminUser {
  id: string; rut: number; dv_rut: string; name: string; email: string | null;
  phone: string; level: string; zone: string; mmr: number;
  role: string; is_active: boolean; created_at: string; photo_url: string | null;
}
interface PagedResult {
  users: AdminUser[]; total: number; page: number; pageSize: number; totalPages: number;
}

const NIVELES: Record<string, string> = {
  primera: "1ra", segunda: "2da", tercera: "3ra",
  cuarta: "4ta", quinta: "5ta", sexta: "6ta", septima_mas: "7ma+",
};
const ZONAS = [
  "Valparaíso","Viña del Mar","Quilpué","Villa Alemana",
  "Concón","Santiago Centro","Providencia","Las Condes",
];

const sel: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text)", fontSize: 12, padding: "6px 10px", fontFamily: "var(--font-body)",
};
const inp: React.CSSProperties = {
  ...sel, width: "100%", outline: "none",
};

export default function AdminUsuariosPage() {
  const navigate = useNavigate();

  const [data,    setData]    = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [q,       setQ]       = useState("");
  const [zone,    setZone]    = useState("");
  const [level,   setLevel]   = useState("");
  const [status,  setStatus]  = useState("all");
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const qs = new URLSearchParams({
      page: String(page),
      ...(q.length >= 2 ? { q } : {}),
      ...(zone  ? { zone }  : {}),
      ...(level ? { level } : {}),
      ...(status !== "all" ? { status } : {}),
    });
    try {
      const res = await adminFetch<PagedResult>(`/api/admin/users?${qs}`);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [page, q, zone, level, status]);

  useEffect(() => { load(); }, [load]);

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(1); }, [q, zone, level, status]);

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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
            <span style={{ fontWeight: 700, fontSize: 16 }}>Gestión de usuarios</span>
          </div>
          {data && (
            <span style={{ fontSize: 12, color: "var(--text2)" }}>{data.total} usuarios</span>
          )}
        </header>

        <main style={{ padding: "20px 48px" }}>
          {/* Filtros */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, marginBottom: 20,
          }}>
            <input
              style={inp}
              placeholder="Buscar por nombre..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select style={sel} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Todas las zonas</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
            <select style={sel} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              {Object.entries(NIVELES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select style={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Suspendidos</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
              borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444", marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: 60, fontSize: 14 }}>
              Cargando...
            </div>
          ) : data?.users.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: 60, fontSize: 14 }}>
              No se encontraron usuarios con esos filtros.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data?.users.map((u) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "12px 16px",
                  opacity: u.is_active ? 1 : 0.6,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, overflow: "hidden",
                  }}>
                    {u.photo_url
                      ? <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials(u.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      {u.name}
                      {!u.is_active && (
                        <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 6, padding: "1px 6px" }}>
                          SUSPENDIDO
                        </span>
                      )}
                      {u.role === "admin" && (
                        <span style={{ fontSize: 10, background: "rgba(132,204,22,0.15)", color: "var(--accent)", borderRadius: 6, padding: "1px 6px" }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span>{u.rut}-{u.dv_rut}</span>
                      <span>{NIVELES[u.level] ?? u.level}</span>
                      <span>{u.zone}</span>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>{u.mmr} MMR</span>
                    </div>
                  </div>

                  {/* Acción */}
                  <button
                    onClick={() => navigate(`/admin/usuarios/${u.id}`)}
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
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 16, marginTop: 24,
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "6px 16px", fontSize: 12,
                  color: page === 1 ? "var(--text2)" : "var(--text)",
                  cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1,
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>
                Página {page} de {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "6px 16px", fontSize: 12,
                  color: page === data.totalPages ? "var(--text2)" : "var(--text)",
                  cursor: page === data.totalPages ? "not-allowed" : "pointer",
                  opacity: page === data.totalPages ? 0.4 : 1,
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </main>
      </div>
    </AdminRoute>
  );
}
