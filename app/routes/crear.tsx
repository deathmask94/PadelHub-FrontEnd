import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";
import Avatar from "~/components/ui/Avatar";
import { createMatch, invitePlayer } from "~/services/matches";

interface PlayerOption {
  id: string;
  name: string;
  username: string | null;
  photo_url: string | null;
  level: string;
  mmr: number;
}

const AVATAR_COLORS = ["#059669","#d97706","#7c3aed","#db2777","#0284c7","#b45309","#16a34a","#dc2626"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
const CLUBS = [
  { nombre: "Pádel Club Viña del Mar",  zona: "Viña del Mar",   abre: "09:00", cierra: "22:30" },
  { nombre: "Pádel Club Valparaíso",    zona: "Valparaíso",     abre: "08:00", cierra: "22:00" },
  { nombre: "Pádel Club Quilpué",       zona: "Quilpué",        abre: "07:00", cierra: "23:00" },
  { nombre: "Pádel Club Villa Alemana", zona: "Villa Alemana",  abre: "08:00", cierra: "23:00" },
  { nombre: "Pádel Club Concón",        zona: "Concón",         abre: "09:00", cierra: "21:00" },
];

function getTimeSlots(abre: string, cierra: string): string[] {
  const slots: string[] = [];
  const [ah, am] = abre.split(":").map(Number);
  const [ch, cm] = cierra.split(":").map(Number);
  let h = ah, m = am;
  while (h < ch || (h === ch && m <= cm)) {
    slots.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    m += 30;
    if (m >= 60) { m -= 60; h++; }
  }
  return slots;
}

const DIAS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_ES  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL= ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatDateStr(d: Date) {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} ${MESES_ES[d.getMonth()]}`;
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function CrearPartido() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date(); today.setHours(0,0,0,0);

  const [selectedDate,   setSelectedDate]   = useState<Date>(today);
  const [showCalendar,   setShowCalendar]   = useState(false);
  const [calMonth,       setCalMonth]       = useState(today.getMonth());
  const [calYear,        setCalYear]        = useState(today.getFullYear());

  const [selectedClub,   setSelectedClub]   = useState<typeof CLUBS[0] | null>(null);
  const [showClubs,      setShowClubs]      = useState(false);

  const [timeSlots,      setTimeSlots]      = useState<string[]>([]);
  const [takenSlots,     setTakenSlots]     = useState<string[]>([]);
  const [selectedTime,   setSelectedTime]   = useState("");
  const [showTime,       setShowTime]       = useState(false);

  const [formato,        setFormato]        = useState<"dobles"|"individual">("dobles");
  const [generoRival,    setGeneroRival]    = useState<"" | "Masculino" | "Femenino">("");
  const [jugadores,      setJugadores]      = useState<(PlayerOption|null)[]>([null,null,null]);
  const [showPickerIdx,  setShowPickerIdx]  = useState<number|null>(null);
  // Ids cuya foto de perfil fallo al cargar (asset borrado en Cloudinary, etc.):
  // se usan para que el circulo vuelva al color solido en vez de fondo transparente.
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Set<string>>(new Set());
  const markPhotoBroken = (id: string) =>
    setBrokenPhotoIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const [pickerSearch,   setPickerSearch]   = useState("");
  const [pickerPlayers,  setPickerPlayers]  = useState<PlayerOption[]>([]);
  const [pickerLoading,  setPickerLoading]  = useState(false);

  const [toast,          setToast]          = useState("");
  const [saving,         setSaving]         = useState(false);

  const initiales = user?.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase()
    : "?";

  // Recalculate time slots when club or date changes
  useEffect(() => {
    if (!selectedClub) return;
    const slots = getTimeSlots(selectedClub.abre, selectedClub.cierra);
    const now   = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const filtered = isToday
      ? slots.filter((s) => {
          const [h,m] = s.split(":").map(Number);
          return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
        })
      : slots;
    setTimeSlots(filtered);
    setSelectedTime("");
  }, [selectedClub, selectedDate]);

  // Fetch taken slots when club + date are both set
  useEffect(() => {
    if (!selectedClub) { setTakenSlots([]); return; }
    const dateKey = toDateKey(selectedDate);
    apiFetch<{ takenSlots: string[] }>(
      `/api/matches/availability?club=${encodeURIComponent(selectedClub.nombre)}&date=${dateKey}`
    )
      .then((d) => setTakenSlots(d.takenSlots))
      .catch(() => setTakenSlots([]));
  }, [selectedClub, selectedDate]);

  const numSlots = formato === "dobles" ? 3 : 1;
  const slots    = jugadores.slice(0, numSlots);

  const fetchPickerPlayers = useCallback(async (q: string) => {
    setPickerLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.length >= 2) params.set("q", q);
      const data = await apiFetch<PlayerOption[]>(`/api/users/search?${params.toString()}`);
      setPickerPlayers(data);
    } catch {
      setPickerPlayers([]);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showPickerIdx === null) { setPickerSearch(""); return; }
    fetchPickerPlayers("");
  }, [showPickerIdx, fetchPickerPlayers]);

  useEffect(() => {
    if (showPickerIdx === null) return;
    if (pickerSearch.length > 0 && pickerSearch.length < 2) return;
    const t = setTimeout(() => fetchPickerPlayers(pickerSearch), 300);
    return () => clearTimeout(t);
  }, [pickerSearch, showPickerIdx, fetchPickerPlayers]);

  const toggleJugador = (idx: number, j: PlayerOption | null) => {
    const next = [...jugadores];
    next[idx] = next[idx]?.id === j?.id ? null : j;
    setJugadores(next);
    setShowPickerIdx(null);
  };

  function getDaysInMonth(year: number, month: number) {
    return {
      firstDay: new Date(year, month, 1).getDay(),
      daysInMonth: new Date(year, month+1, 0).getDate(),
    };
  }

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCrear = async () => {
    if (!selectedClub) { showToastMsg("Selecciona tu ciudad"); return; }
    if (!selectedTime) { showToastMsg("Selecciona una hora"); return; }
    if (!user)         { showToastMsg("Debes iniciar sesión"); return; }

    setSaving(true);
    try {
      const matchDate = toDateKey(selectedDate);
      const matchTime = `${matchDate}T${selectedTime}:00`;

      const match = await createMatch({
        organizer_id: user.id,
        club:         selectedClub.nombre,
        format:       formato === "dobles" ? "doubles" : "singles",
        match_date:   matchDate,
        match_time:   matchTime,
        ...(generoRival ? { gender_preference: generoRival } : {}),
      });

      const selectedPlayers = slots.filter((j): j is PlayerOption => j !== null);
      const inviteResults = await Promise.allSettled(
        selectedPlayers.map((j) => invitePlayer(match.id, j.id))
      );
      const failedInvites = inviteResults.filter((r) => r.status === "rejected").length;

      if (selectedPlayers.length === 0) {
        showToastMsg("¡Partido creado! Ya aparece en Disponibles para todos los jugadores.");
      } else if (failedInvites > 0) {
        showToastMsg(`Partido creado, pero no se pudo invitar a ${failedInvites} jugador(es).`);
      } else {
        showToastMsg("¡Partido creado! Invitaciones enviadas.");
      }
      setTimeout(() => navigate("/home"), 1500);
    } catch (err: unknown) {
      showToastMsg(err instanceof Error ? err.message : "Error al crear el partido");
    } finally {
      setSaving(false);
    }
  };

  const { firstDay, daysInMonth } = getDaysInMonth(calYear, calMonth);

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px" }}>
          <button className="ph-back-btn" onClick={() => navigate(-1)}>←</button>
          <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700 }}>Crear partido</div>
          <div style={{ width:36 }} />
        </div>

        <div style={{ padding:"0 20px" }}>

          {/* 1. Fecha */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Fecha</label>
            <button
              onClick={() => { setShowCalendar(!showCalendar); setShowTime(false); setShowClubs(false); }}
              style={{
                width:"100%", background:"var(--bg3)",
                border:`1px solid ${showCalendar?"var(--accent)":"var(--border)"}`,
                borderRadius:12, padding:"12px 14px", color:"var(--text)",
                fontSize:14, fontFamily:"var(--font-body)", cursor:"pointer", textAlign:"left",
              }}
            >
              {formatDateStr(selectedDate)}
            </button>
          </div>

          {/* Calendario */}
          {showCalendar && (
            <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:16, padding:16, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <button onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
                  style={{ background:"var(--bg4)", border:"1px solid var(--border)", borderRadius:8, padding:"4px 10px", color:"var(--text)", cursor:"pointer" }}>‹</button>
                <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700 }}>
                  {MESES_FULL[calMonth].charAt(0).toUpperCase()+MESES_FULL[calMonth].slice(1)} {calYear}
                </span>
                <button onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
                  style={{ background:"var(--bg4)", border:"1px solid var(--border)", borderRadius:8, padding:"4px 10px", color:"var(--text)", cursor:"pointer" }}>›</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
                {DIAS_ES.map(d=><div key={d} style={{ textAlign:"center", fontSize:11, color:"var(--text2)", padding:"2px 0" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const d = new Date(calYear,calMonth,i+1);
                  const isPast = d < today;
                  const isSelected = d.toDateString()===selectedDate.toDateString();
                  const isToday2   = d.toDateString()===today.toDateString();
                  return (
                    <button key={i} disabled={isPast}
                      onClick={()=>{setSelectedDate(d);setShowCalendar(false);}}
                      style={{
                        padding:"7px 0", borderRadius:8, border:"none",
                        background: isSelected?"var(--accent)":isToday2?"rgba(79,70,229,0.15)":"transparent",
                        color: isPast?"rgba(255,255,255,0.2)":isSelected?"#fff":"var(--text)",
                        fontSize:13, cursor:isPast?"not-allowed":"pointer",
                        fontFamily:"var(--font-body)", fontWeight:isSelected?700:400,
                      }}>{i+1}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Ciudad (la cancha se asigna automáticamente, 1 por ciudad) */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Ciudad</label>
            <button
              onClick={()=>{setShowClubs(!showClubs);setShowCalendar(false);setShowTime(false);}}
              style={{
                width:"100%", background:"var(--bg3)",
                border:`1px solid ${showClubs?"var(--accent)":"var(--border)"}`,
                borderRadius:12, padding:"12px 14px",
                color: selectedClub?"var(--text)":"var(--text2)",
                fontSize:14, fontFamily:"var(--font-body)", cursor:"pointer", textAlign:"left",
              }}
            >
              {selectedClub?`${selectedClub.zona} — ${selectedClub.nombre}`:"Selecciona tu ciudad"}
            </button>
            {showClubs && (
              <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, marginTop:6, overflow:"hidden" }}>
                {CLUBS.map(c=>(
                  <button key={c.nombre} onClick={()=>{setSelectedClub(c);setShowClubs(false);}}
                    style={{
                      width:"100%", padding:"12px 16px", background:"transparent",
                      border:"none", borderBottom:"1px solid var(--border)",
                      textAlign:"left", cursor:"pointer",
                      color: selectedClub?.nombre===c.nombre?"var(--accent)":"var(--text)",
                      fontFamily:"var(--font-body)", fontSize:14,
                    }}>
                    <div style={{ fontWeight:600 }}>{c.zona}</div>
                    <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{c.nombre} · Lun–Dom · {c.abre} – {c.cierra}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Hora */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Hora</label>
            <button
              onClick={() => { setShowTime(!showTime); setShowCalendar(false); setShowClubs(false); }}
              disabled={!selectedClub}
              style={{
                width:"100%", background:"var(--bg3)",
                border:`1px solid ${showTime?"var(--accent)":"var(--border)"}`,
                borderRadius:12, padding:"12px 14px",
                color: selectedClub ? "var(--text)" : "var(--text2)",
                fontSize:14, fontFamily:"var(--font-body)",
                cursor: selectedClub ? "pointer" : "not-allowed", textAlign:"left",
              }}
            >
              {selectedClub ? (selectedTime || "Selecciona una hora") : "Elige tu ciudad primero"}
            </button>

            {/* Selector hora */}
            {showTime && timeSlots.length>0 && (
              <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, marginTop:6, overflow:"hidden" }}>
                <div style={{ maxHeight:200, overflowY:"auto", padding:"4px 0" }}>
                  {timeSlots.map(t => {
                    const isTaken = takenSlots.includes(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={isTaken}
                        onClick={()=>{if(!isTaken){setSelectedTime(t);setShowTime(false);}}}
                        style={{
                          width:"100%", padding:"10px 16px", background:"transparent",
                          border:"none", borderBottom:"1px solid var(--border)",
                          textAlign:"left", cursor: isTaken ? "not-allowed" : "pointer",
                          color: isTaken ? "var(--text2)" : isSelected ? "var(--accent)" : "var(--text)",
                          opacity: isTaken ? 0.4 : 1,
                          fontFamily:"var(--font-body)", fontSize:14,
                          fontWeight: isSelected ? 700 : 400,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                      >
                        <span>{t}</span>
                        {isTaken && <span style={{ fontSize:11, color:"var(--text2)" }}>Ocupado</span>}
                        {isSelected && !isTaken && <span style={{ fontSize:12 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Formato */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Formato</label>
            <div style={{ display:"flex", gap:10 }}>
              {(["dobles","individual"] as const).map(f=>(
                <button key={f}
                  onClick={()=>{setFormato(f);setJugadores([null,null,null]);}}
                  className={`ph-format-opt${formato===f?" selected":""}`}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{f==="dobles"?"👥":"🧍"}</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"var(--text)" }}>
                    {f==="dobles"?"Dobles":"Individual"}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text2)" }}>{f==="dobles"?"2 vs 2":"1 vs 1"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4b. Género permitido para unirse (cupos abiertos) */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Género para unirse a los cupos abiertos</label>
            <div style={{ display:"flex", gap:8 }}>
              {([
                { value: "" as const,          label: "Todos" },
                { value: "Masculino" as const, label: "Hombres" },
                { value: "Femenino" as const,  label: "Mujeres" },
              ]).map((opt) => (
                <button key={opt.label} type="button"
                  onClick={() => setGeneroRival(opt.value)}
                  className={`ph-format-opt${generoRival === opt.value ? " selected" : ""}`}
                  style={{ flex: 1, padding: "10px 0" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Jugadores */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Jugadores</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {/* Tú */}
              <div style={{ textAlign:"center" }}>
                <div className="ph-slot filled" style={{ width:64, padding:"10px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div className="ph-avatar" style={{ width:36, height:36, fontSize:13, background:"var(--accent)" }}>{initiales}</div>
                  <span style={{ fontSize:11, color:"var(--text2)" }}>Tú</span>
                </div>
              </div>
              {/* Slots */}
              {slots.map((j,idx)=>(
                <div key={idx} style={{ position:"relative" }}>
                  <div
                    className={`ph-slot${j?" filled":""}`}
                    style={{ width:64, padding:"10px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}
                    onClick={()=>setShowPickerIdx(showPickerIdx===idx?null:idx)}
                  >
                    {j ? (
                      <>
                        <div className="ph-avatar" style={{ width:36, height:36, fontSize:13, background: (j.photo_url && !brokenPhotoIds.has(j.id)) ? "transparent" : avatarColor(j.id) }}>
                          <Avatar
                            photoUrl={j.photo_url}
                            name={j.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"inherit" }}
                            onError={() => markPhotoBroken(j.id)}
                          />
                        </div>
                        <span style={{ fontSize:11, color:"var(--text2)" }}>{j.name.split(" ")[0]}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize:22, color:"var(--text2)" }}>+</span>
                        <span style={{ fontSize:11, color:"var(--text2)" }}>Invitar</span>
                      </>
                    )}
                  </div>
                  {showPickerIdx===idx && (
                    <div style={{
                      position:"absolute", top:"110%", left:0, zIndex:10,
                      background:"var(--bg3)", border:"1px solid var(--border)",
                      borderRadius:12, minWidth:220, overflow:"hidden",
                      boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                    }}>
                      <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--border)" }}>
                        <input
                          autoFocus
                          className="ph-input"
                          placeholder="Buscar por @usuario…"
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize:13, padding:"6px 10px" }}
                        />
                      </div>
                      <div style={{ maxHeight:200, overflowY:"auto" }}>
                        {pickerLoading ? (
                          <div style={{ padding:"14px", textAlign:"center", fontSize:12, color:"var(--text2)" }}>Buscando…</div>
                        ) : pickerPlayers.filter(p => !slots.some((s,si) => si!==idx && s?.id===p.id)).length === 0 ? (
                          <div style={{ padding:"14px", textAlign:"center", fontSize:12, color:"var(--text2)" }}>Sin resultados</div>
                        ) : pickerPlayers
                            .filter(p => !slots.some((s,si) => si!==idx && s?.id===p.id))
                            .map(p => (
                          <button key={p.id} onClick={() => toggleJugador(idx, p)}
                            style={{
                              width:"100%", padding:"10px 14px",
                              background: slots[idx]?.id===p.id ? "rgba(132,204,22,0.1)" : "transparent",
                              border:"none", borderBottom:"1px solid var(--border)",
                              display:"flex", alignItems:"center", gap:8,
                              cursor:"pointer", color:"var(--text)", fontFamily:"var(--font-body)", fontSize:13, textAlign:"left",
                            }}>
                            <div className="ph-avatar" style={{ width:30, height:30, fontSize:11, flexShrink:0,
                              background: (p.photo_url && !brokenPhotoIds.has(p.id)) ? "transparent" : avatarColor(p.id) }}>
                              <Avatar
                                photoUrl={p.photo_url}
                                name={p.name}
                                style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"inherit" }}
                                onError={() => markPhotoBroken(p.id)}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight:600 }}>{p.name}</div>
                              <div style={{ fontSize:11, color:"var(--text2)" }}>
                                {p.username ? `${p.username} · ` : ""}{p.mmr} MMR
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {j && (
                        <button onClick={() => toggleJugador(idx, null)}
                          style={{ width:"100%", padding:"10px 14px", background:"transparent", border:"none", borderTop:"1px solid var(--border)", cursor:"pointer", color:"#ef4444", fontFamily:"var(--font-body)", fontSize:13, textAlign:"left" }}>
                          ✕ Quitar jugador
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info visibilidad */}
          <div style={{
            background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
            borderRadius: 10, padding: "10px 14px", fontSize: 12,
            color: "var(--accent)", marginBottom: 20,
          }}>
            🔔 El partido quedará visible en <strong>Disponibles</strong> para todos los jugadores de la app.
          </div>

          <button className="ph-btn" onClick={handleCrear} disabled={saving} style={{ marginBottom:8 }}>
            {saving ? "Creando..." : "Crear partido"}
          </button>

        </div>
      </div>

      <div className={`ph-toast${toast?" show":""}`}>{toast}</div>
      <NavBar />
    </div>
  );
}
