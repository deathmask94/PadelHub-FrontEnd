import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";
import Avatar from "~/components/ui/Avatar";

const NIVEL_LABEL: Record<string, string> = {
  primera: "1ra Categoría", segunda: "2da Categoría", tercera: "3ra Categoría",
  cuarta: "4ta Categoría", quinta: "5ta Categoría", sexta: "6ta Categoría",
  septima_mas: "7ma+ Categoría",
};

const CLUBS = [
  { nombre: "Pádel Club Viña del Mar",  zona: "Viña del Mar" },
  { nombre: "Pádel Club Valparaíso",    zona: "Valparaíso" },
  { nombre: "Pádel Club Quilpué",       zona: "Quilpué" },
  { nombre: "Pádel Club Villa Alemana", zona: "Villa Alemana" },
  { nombre: "Pádel Club Concón",        zona: "Concón" },
];

interface Suggestion {
  id: string; name: string; photo_url: string | null;
  level: string; mmr: number; zone: string; compatibility: number;
}
interface SuggestionsResponse {
  suggestions: Suggestion[]; range_used: number; user_mmr: number;
}

function RivalAvatar({ name, photo_url, size = 56 }: { name: string; photo_url: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontFamily: "var(--font-display)", fontWeight: 700,
      color: "#fff", overflow: "hidden", flexShrink: 0,
    }}>
      <Avatar photoUrl={photo_url} name={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

const todayISO = () => new Date().toISOString().split("T")[0];

type Phase = "idle" | "searching" | "found" | "empty";

export default function Matchmaking() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [phase,        setPhase]        = useState<Phase>("idle");
  const [suggestions,  setSuggestions]  = useState<Suggestion[]>([]);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [toast,        setToast]        = useState("");

  // Challenge form
  const [clubInput,   setClubInput]   = useState("");
  const [dateInput,   setDateInput]   = useState(todayISO());
  const [timeInput,   setTimeInput]   = useState("10:00");
  const [challenging, setChallenging] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const selectedRival = suggestions.find((s) => s.id === selectedId) ?? null;

  const handleSearch = async () => {
    setPhase("searching");
    setSelectedId(null);
    try {
      const data = await apiFetch<SuggestionsResponse>("/api/users/suggestions");
      setSuggestions(data.suggestions);
      setPhase(data.suggestions.length > 0 ? "found" : "empty");
    } catch {
      setSuggestions([]);
      setPhase("empty");
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setClubInput(""); setDateInput(todayISO()); setTimeInput("10:00");
  };

  const handleChallenge = async () => {
    if (!user?.id || !selectedRival || !clubInput.trim()) {
      showToast("Ingresa el club o cancha"); return;
    }
    setChallenging(true);
    try {
      const { match } = await apiFetch<{ match: { id: string } }>("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          organizer_id: user.id,
          club:         clubInput.trim(),
          format:       "singles",
          is_ranked:    true,
          match_date:   dateInput,
          match_time:   `${dateInput}T${timeInput}:00`,
        }),
      });
      await apiFetch(`/api/matches/${match.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedRival.id }),
      });
      showToast(`¡Desafío enviado a ${selectedRival.name}!`);
      setTimeout(() => navigate(`/matches/${match.id}`), 1200);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al crear el desafío");
    } finally {
      setChallenging(false);
    }
  };

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 24px" }}>

        {/* ── Header ── */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            Buscar rival
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            El sistema te empareja automáticamente según tu MMR
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* ── Tu perfil de búsqueda ── */}
          <div className="ph-card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
              Tu perfil de búsqueda
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 700,
                color: "#fff", overflow: "hidden", flexShrink: 0,
              }}>
                <Avatar photoUrl={user?.photo_url} name={user?.nombre ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, overflowWrap: "break-word" }}>
                  {user?.nombre ?? "—"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="ph-pill ph-pill-green" style={{ fontSize: 12, fontWeight: 700 }}>
                    MMR {user?.mmr ?? 1000}
                  </span>
                  {user?.nivel && (
                    <span className="ph-pill ph-pill-green" style={{ fontSize: 11 }}>
                      {NIVEL_LABEL[user.nivel] ?? user.nivel}
                    </span>
                  )}
                  {user?.zona && (
                    <span className="ph-pill" style={{ fontSize: 11, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                      {user.zona}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Estado: idle ── */}
          {phase === "idle" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 8, lineHeight: 1.5 }}>
                Enfréntate a otros jugadores y lucha por ser el mejor de tu zona
              </div>
              <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 24 }}>
                🏆 Modo competitivo — el resultado afecta tu MMR
              </div>

              <button className="ph-btn" onClick={handleSearch}>
                Buscar rival
              </button>
            </div>
          )}

          {/* ── Estado: searching ── */}
          {phase === "searching" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 42, marginBottom: 16, animation: "pulse 1.2s ease-in-out infinite" }}>🔍</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Buscando rival…
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
                Analizando jugadores con MMR similar en tu zona
              </div>
              <button
                onClick={() => setPhase("idle")}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 20px", color: "var(--text2)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* ── Estado: found — 3 rivales a elegir, sin "ver mas" ── */}
          {phase === "found" && suggestions.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {suggestions.length === 1 ? "Rival encontrado" : "Elige a tu rival"}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {suggestions.map((s) => {
                const isSelected = selectedId === s.id;
                return (
                  <div key={s.id}>
                    {/* Card del rival */}
                    <div
                      className="ph-card"
                      style={{ marginBottom: isSelected ? 0 : 12, cursor: "pointer", border: isSelected ? "1px solid var(--accent)" : undefined }}
                      onClick={() => handleSelect(s.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                        <RivalAvatar name={s.name} photo_url={s.photo_url} size={56} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, overflowWrap: "break-word" }}>
                            {s.name}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span className="ph-pill ph-pill-green" style={{ fontSize: 12, fontWeight: 700 }}>
                              MMR {s.mmr}
                            </span>
                            <span className="ph-pill ph-pill-green" style={{ fontSize: 11 }}>
                              {NIVEL_LABEL[s.level] ?? s.level}
                            </span>
                            <span className="ph-pill" style={{ fontSize: 11, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                              {s.zone}
                            </span>
                          </div>
                        </div>
                        {/* Compatibilidad */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>
                            {s.compatibility}%
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text2)" }}>compat.</div>
                        </div>
                      </div>

                      {/* Diferencia MMR */}
                      {user?.mmr != null && (
                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                          Diferencia MMR:{" "}
                          <span style={{ fontWeight: 700, color: Math.abs(s.mmr - user.mmr) <= 100 ? "var(--accent)" : "var(--text)" }}>
                            {s.mmr > user.mmr ? `+${s.mmr - user.mmr}` : s.mmr === user.mmr ? "igual" : `${s.mmr - user.mmr}`}
                          </span>
                        </div>
                      )}

                      <button
                        className="ph-btn"
                        onClick={(e) => { e.stopPropagation(); handleSelect(s.id); }}
                      >
                        {isSelected ? "Cancelar" : "Desafiar"}
                      </button>
                    </div>

                    {/* Formulario de desafío, justo bajo la tarjeta elegida */}
                    {isSelected && (
                      <div className="ph-card" style={{ marginBottom: 12, borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 12 }}>
                          Configurar partido vs {s.name}
                        </div>
                        <label className="ph-label">Ciudad</label>
                        <select
                          className="ph-select"
                          value={clubInput}
                          onChange={(e) => setClubInput(e.target.value)}
                          style={{ marginBottom: 10 }}
                        >
                          <option value="">Selecciona tu ciudad</option>
                          {CLUBS.map((c) => (
                            <option key={c.nombre} value={c.nombre}>{c.zona}</option>
                          ))}
                        </select>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
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
                        <button className="ph-btn" onClick={handleChallenge} disabled={challenging || !clubInput.trim()}>
                          {challenging ? "Enviando desafío…" : "Confirmar y enviar desafío"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => { setPhase("idle"); setSuggestions([]); setSelectedId(null); }}
                style={{ width: "100%", background: "none", border: "none", color: "var(--text2)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: "8px 0" }}
              >
                Nueva búsqueda
              </button>
            </div>
          )}

          {/* ── Estado: sin rivales ── */}
          {phase === "empty" && (
            <div className="ph-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sin rivales disponibles</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
                No encontramos rivales con MMR similar en tu zona ahora. ¡Vuelve más tarde!
              </div>
              <button className="ph-btn" onClick={() => { setPhase("idle"); setSuggestions([]); setSelectedId(null); }}>
                Intentar de nuevo
              </button>
            </div>
          )}

        </div>
      </div>

      <div className={`ph-toast${toast ? " show" : ""}`}>{toast}</div>
      <NavBar />
    </div>
  );
}
