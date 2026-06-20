import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";

const ZONAS = [
  "Valparaíso","Viña del Mar","Quilpué","Villa Alemana",
  "Concón","Santiago Centro","Providencia","Las Condes",
];

const NIVEL_LABEL: Record<string, string> = {
  primera: "1ra", segunda: "2da", tercera: "3ra",
  cuarta: "4ta", quinta: "5ta", sexta: "6ta", septima_mas: "7ma+",
};

const MMR_RANGES = [
  { label: "Nivel similar",   delta: 150  },
  { label: "Nivel cercano",   delta: 300  },
  { label: "Cualquier nivel", delta: null },
];

const FORMATS = [
  { val: "doubles", label: "Dobles (2v2)" },
  { val: "singles", label: "Individual (1v1)" },
];

interface Rival {
  id: string; name: string; photo_url: string | null;
  level: string; mmr: number; zone: string;
}
interface Suggestion extends Rival {
  compatibility: number;
}
interface SuggestionsResponse {
  suggestions: Suggestion[];
  range_used:  number;
  user_mmr:    number;
}

function compatColor(pct: number): string {
  if (pct >= 80) return "var(--accent)";
  if (pct >= 50) return "#facc15";
  return "#f97316";
}

function Avatar({ name, photo_url, size = 42 }: { name: string; photo_url: string | null; size?: number }) {
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: "var(--bg3)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontFamily: "var(--font-display)", fontWeight: 700,
      color: "var(--text)", overflow: "hidden", flexShrink: 0,
    }}>
      {photo_url
        ? <img src={photo_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

const todayISO = () => new Date().toISOString().split("T")[0];

export default function Matchmaking() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Sugerencias ──
  const [suggestions,    setSuggestions]    = useState<Suggestion[]>([]);
  const [rangeUsed,      setRangeUsed]      = useState<number>(150);
  const [sugLoading,     setSugLoading]     = useState(true);
  const [showAllSug,     setShowAllSug]     = useState(false);

  // ── Búsqueda manual ──
  const [zone,       setZone]       = useState(user?.zona ?? "");
  const [mmrRange,   setMmrRange]   = useState(0);
  const [searchQ,    setSearchQ]    = useState("");
  const [rivals,     setRivals]     = useState<Rival[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Desafío ──
  const [challengeId,  setChallengeId]  = useState<string | null>(null);
  const [clubInput,    setClubInput]    = useState("");
  const [dateInput,    setDateInput]    = useState(todayISO());
  const [timeInput,    setTimeInput]    = useState("10:00");
  const [formatInput,  setFormatInput]  = useState("doubles");
  const [challenging,  setChallenging]  = useState(false);
  const [toast,        setToast]        = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openChallenge = (rivalId: string) => {
    setChallengeId(prev => prev === rivalId ? null : rivalId);
    setClubInput(""); setDateInput(todayISO()); setTimeInput("10:00"); setFormatInput("doubles");
  };

  // ── Cargar sugerencias al montar ──
  useEffect(() => {
    setSugLoading(true);
    apiFetch<SuggestionsResponse>("/api/users/suggestions")
      .then(({ suggestions: s, range_used }) => {
        setSuggestions(s);
        setRangeUsed(range_used);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSugLoading(false));
  }, []);

  // ── Búsqueda manual ──
  const fetchRivals = useCallback(async () => {
    setLoading(true); setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (zone) params.set("zone", zone);
      if (searchQ.length >= 2) params.set("q", searchQ);
      const range = MMR_RANGES[mmrRange];
      if (range.delta !== null && user?.mmr) {
        params.set("mmr_min", String(Math.max(0, user.mmr - range.delta)));
        params.set("mmr_max", String(user.mmr + range.delta));
      }
      const data = await apiFetch<Rival[]>(`/api/users/search?${params.toString()}`);
      setRivals(data);
    } catch {
      setRivals([]);
    } finally {
      setLoading(false);
    }
  }, [zone, mmrRange, searchQ, user?.mmr]);

  useEffect(() => {
    if (!hasSearched) return;
    if (searchQ.length > 0 && searchQ.length < 2) return;
    const t = setTimeout(fetchRivals, searchQ.length >= 2 ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchRivals, searchQ, hasSearched]);

  const handleChallenge = async (rival: Rival | Suggestion) => {
    if (!user?.id || !clubInput.trim()) { showToast("Completa todos los campos"); return; }
    setChallenging(true);
    try {
      const { match } = await apiFetch<{ match: { id: string } }>("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          organizer_id: user.id,
          club:         clubInput.trim(),
          format:       formatInput,
          match_date:   dateInput,
          match_time:   `${dateInput}T${timeInput}:00`,
        }),
      });
      await apiFetch(`/api/matches/${match.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ userId: rival.id }),
      });
      showToast(`¡Desafío enviado a ${rival.name}!`);
      setChallengeId(null);
      setTimeout(() => navigate(`/matches/${match.id}`), 1200);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al crear el desafío");
    } finally {
      setChallenging(false);
    }
  };

  const ChallengeForm = ({ rival }: { rival: Rival | Suggestion }) => (
    <div style={{
      background: "rgba(132,204,22,0.06)", border: "1px solid var(--border2)",
      borderRadius: 10, padding: "14px", marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--accent)" }}>
        Desafiar a {rival.name}
      </div>
      <label className="ph-label">Club / Cancha</label>
      <input className="ph-input" placeholder="Ej: Club Pádel Viña" value={clubInput}
        onChange={(e) => setClubInput(e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label className="ph-label">Fecha</label>
          <input className="ph-input" type="date" value={dateInput} min={todayISO()}
            onChange={(e) => setDateInput(e.target.value)} />
        </div>
        <div>
          <label className="ph-label">Hora</label>
          <input className="ph-input" type="time" value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)} />
        </div>
      </div>
      <label className="ph-label" style={{ marginBottom: 6, display: "block" }}>Formato</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {FORMATS.map((f) => (
          <button key={f.val} onClick={() => setFormatInput(f.val)} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${formatInput === f.val ? "var(--accent)" : "var(--border)"}`,
            background: formatInput === f.val ? "rgba(132,204,22,0.12)" : "var(--bg3)",
            color: formatInput === f.val ? "var(--accent)" : "var(--text2)",
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: formatInput === f.val ? 700 : 400,
          }}>{f.label}</button>
        ))}
      </div>
      <button className="ph-btn" onClick={() => handleChallenge(rival)} disabled={challenging || !clubInput.trim()}>
        {challenging ? "Creando desafío…" : "Enviar desafío"}
      </button>
    </div>
  );

  const RivalRow = ({ r, isLast, showCompat }: { r: Rival | Suggestion; isLast: boolean; showCompat?: boolean }) => {
    const diff   = user?.mmr != null ? r.mmr - user.mmr : null;
    const isOpen = challengeId === r.id;
    const pct    = "compatibility" in r ? (r as Suggestion).compatibility : null;
    return (
      <div key={r.id}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
          borderBottom: (!isOpen && !isLast) ? "1px solid var(--border)" : "none",
        }}>
          <Avatar name={r.name} photo_url={r.photo_url} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>
              {NIVEL_LABEL[r.level] ?? r.level} · {r.zone}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {showCompat && pct !== null && (
              <div style={{
                minWidth: 42, textAlign: "center", padding: "3px 7px", borderRadius: 8,
                background: `${compatColor(pct)}22`, border: `1px solid ${compatColor(pct)}55`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: compatColor(pct), lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 1 }}>comp.</div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>{r.mmr}</div>
              {diff !== null && (
                <div style={{ fontSize: 10, color: diff > 0 ? "#fca5a5" : diff < 0 ? "#4ade80" : "var(--text2)" }}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? "igual" : diff}
                </div>
              )}
            </div>
            <button onClick={() => openChallenge(r.id)} style={{
              padding: "6px 10px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${isOpen ? "var(--border)" : "var(--accent)"}`,
              background: isOpen ? "var(--bg3)" : "rgba(132,204,22,0.12)",
              color: isOpen ? "var(--text2)" : "var(--accent)",
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
            }}>
              {isOpen ? "Cancelar" : "Desafiar"}
            </button>
          </div>
        </div>
        {isOpen && <ChallengeForm rival={r} />}
      </div>
    );
  };

  const visibleSug = showAllSug ? suggestions : suggestions.slice(0, 5);

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 24px" }}>

        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            Matchmaking
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>Encuentra y desafía rivales</div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* ══ SECCIÓN SUGERENCIAS ══ */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Sugeridos para ti</div>
                {!sugLoading && suggestions.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
                    Rango ±{rangeUsed} MMR · ordenados por compatibilidad
                  </div>
                )}
              </div>
              {suggestions.length > 5 && (
                <button onClick={() => setShowAllSug(v => !v)} style={{
                  background: "none", border: "none", fontSize: 12,
                  color: "var(--accent)", cursor: "pointer", fontFamily: "var(--font-body)",
                }}>
                  {showAllSug ? "Ver menos" : `Ver todos (${suggestions.length})`}
                </button>
              )}
            </div>

            {sugLoading ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text2)", fontSize: 13 }}>
                Buscando sugerencias…
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12,
                padding: "20px 16px", textAlign: "center", fontSize: 13, color: "var(--text2)",
              }}>
                No hay rivales disponibles por ahora. ¡Vuelve más tarde!
              </div>
            ) : (
              <div className="ph-card">
                {visibleSug.map((s, i) => (
                  <RivalRow key={s.id} r={s} isLast={i === visibleSug.length - 1} showCompat />
                ))}
              </div>
            )}
          </div>

          {/* ══ DIVIDER ══ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Búsqueda manual
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* ══ FILTRO ZONA ══ */}
          <select className="ph-select" value={zone} onChange={(e) => setZone(e.target.value)} style={{ marginBottom: 10 }}>
            <option value="">Todas las zonas</option>
            {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>

          {/* ══ FILTRO MMR ══ */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
              Rango MMR {user?.mmr ? `(tu MMR: ${user.mmr})` : ""}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {MMR_RANGES.map((r, i) => (
                <button key={r.label} onClick={() => setMmrRange(i)} style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${mmrRange === i ? "var(--accent)" : "var(--border)"}`,
                  background: mmrRange === i ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                  color: mmrRange === i ? "var(--accent)" : "var(--text2)",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: mmrRange === i ? 700 : 400,
                }}>
                  {r.label}
                  {r.delta !== null && <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>±{r.delta}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* ══ BÚSQUEDA POR NOMBRE ══ */}
          <input className="ph-input" type="text" placeholder="Buscar por nombre (opcional)…"
            value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={{ marginBottom: 10 }} />

          <button className="ph-btn" onClick={fetchRivals} style={{ marginBottom: 16 }}>
            Buscar jugadores
          </button>

          {/* ══ RESULTADOS BÚSQUEDA MANUAL ══ */}
          {!hasSearched ? (
            <div className="ph-card" style={{ textAlign: "center", padding: "28px 16px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Ajusta los filtros y presiona "Buscar jugadores"</div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text2)", fontSize: 14 }}>
              Buscando rivales…
            </div>
          ) : rivals.length === 0 ? (
            <div className="ph-card" style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>😕</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin resultados</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Prueba cambiando la zona o el rango de MMR</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                {rivals.length} jugadores encontrados
              </div>
              <div className="ph-card">
                {rivals.map((r, i) => (
                  <RivalRow key={r.id} r={r} isLast={i === rivals.length - 1} />
                ))}
              </div>
            </>
          )}

        </div>
      </div>
      <div className={`ph-toast${toast ? " show" : ""}`}>{toast}</div>
      <NavBar />
    </div>
  );
}
