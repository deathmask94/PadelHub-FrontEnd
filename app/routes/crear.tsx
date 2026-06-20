import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";
import { createMatch } from "~/services/matches";

const CLUBS = [
  { nombre: "Viña Pádel Club",         abre: "09:00", cierra: "22:30" },
  { nombre: "Campo Deportivo La Liga",  abre: "07:00", cierra: "23:00" },
  { nombre: "BluePadel",               abre: "08:00", cierra: "23:00" },
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

function getNextDays(n = 60): Date[] {
  const days: Date[] = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const DIAS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_ES  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL= ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatDateStr(d: Date) {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} ${MESES_ES[d.getMonth()]}`;
}

const JUGADORES_MOCK = [
  { id: 2, ini: "MR", nombre: "Miguel R.",  color: "#059669" },
  { id: 3, ini: "AP", nombre: "Ana P.",     color: "#d97706" },
  { id: 4, ini: "JV", nombre: "Javier V.",  color: "#7c3aed" },
  { id: 5, ini: "RP", nombre: "Roberto P.", color: "#db2777" },
];

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
  const [selectedTime,   setSelectedTime]   = useState("");
  const [showTime,       setShowTime]       = useState(false);

  const [formato,        setFormato]        = useState<"dobles"|"individual">("dobles");
  const [jugadores,      setJugadores]      = useState<(typeof JUGADORES_MOCK[0]|null)[]>([null,null,null]);
  const [showPickerIdx,  setShowPickerIdx]  = useState<number|null>(null);

  const [toast,          setToast]          = useState("");
  const [saving,         setSaving]         = useState(false);

  const initiales = user?.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase()
    : "?";

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
    setSelectedTime(filtered[0] ?? "");
  }, [selectedClub, selectedDate]);

  const numSlots = formato === "dobles" ? 3 : 1;
  const slots    = jugadores.slice(0, numSlots);

  const toggleJugador = (idx: number, j: typeof JUGADORES_MOCK[0]|null) => {
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
    if (!selectedClub) { showToastMsg("Selecciona un club"); return; }
    if (!selectedTime) { showToastMsg("Selecciona una hora"); return; }
    if (!user)         { showToastMsg("Debes iniciar sesión"); return; }

    setSaving(true);
    try {
      const y  = selectedDate.getFullYear();
      const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d  = String(selectedDate.getDate()).padStart(2, "0");
      const matchDate = `${y}-${mo}-${d}`;
      const matchTime = `${matchDate}T${selectedTime}:00`;

      await createMatch({
        organizer_id: user.id,
        club:         selectedClub.nombre,
        format:       formato === "dobles" ? "doubles" : "singles",
        match_date:   matchDate,
        match_time:   matchTime,
      });

      showToastMsg("¡Partido creado! Ya aparece en Disponibles para todos los jugadores.");
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

          {/* Fecha + Hora */}
          <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Detalles</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div>
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
            <div>
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
                {selectedClub ? (selectedTime || "Seleccionar") : "Elige club primero"}
              </button>
            </div>
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

          {/* Selector hora */}
          {showTime && timeSlots.length>0 && (
            <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:16, marginBottom:14, overflow:"hidden" }}>
              <div style={{ maxHeight:180, overflowY:"auto", padding:"8px 0" }}>
                {timeSlots.map(t=>(
                  <button key={t} onClick={()=>{setSelectedTime(t);setShowTime(false);}}
                    style={{
                      width:"100%", padding:"10px 16px", background:"transparent",
                      border:"none", borderBottom:"1px solid var(--border)",
                      textAlign:"left", cursor:"pointer",
                      color: selectedTime===t?"var(--accent)":"var(--text)",
                      fontFamily:"var(--font-body)", fontSize:14,
                      fontWeight: selectedTime===t?700:400,
                    }}>
                    {t} {selectedTime===t&&"✓"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Club */}
          <div style={{ marginBottom:14 }}>
            <label className="ph-label">Club / Cancha</label>
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
              {selectedClub?selectedClub.nombre:"Selecciona un club"}
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
                    <div style={{ fontWeight:600 }}>{c.nombre}</div>
                    <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>Lun–Dom · {c.abre} – {c.cierra}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formato */}
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

          {/* Jugadores */}
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
                        <div className="ph-avatar" style={{ width:36, height:36, fontSize:13, background:j.color }}>{j.ini}</div>
                        <span style={{ fontSize:11, color:"var(--text2)" }}>{j.nombre.split(" ")[0]}</span>
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
                      borderRadius:12, minWidth:160, overflow:"hidden",
                      boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                    }}>
                      {JUGADORES_MOCK.filter(jm=>!slots.some((s,si)=>si!==idx&&s?.id===jm.id)).map(jm=>(
                        <button key={jm.id} onClick={()=>toggleJugador(idx,jm)}
                          style={{
                            width:"100%", padding:"10px 14px",
                            background: slots[idx]?.id===jm.id?"rgba(79,70,229,0.1)":"transparent",
                            border:"none", borderBottom:"1px solid var(--border)",
                            display:"flex", alignItems:"center", gap:8,
                            cursor:"pointer", color:"var(--text)", fontFamily:"var(--font-body)", fontSize:13,
                          }}>
                          <div className="ph-avatar" style={{ width:28, height:28, fontSize:11, background:jm.color }}>{jm.ini}</div>
                          {jm.nombre}
                        </button>
                      ))}
                      {j && (
                        <button onClick={()=>toggleJugador(idx,null)}
                          style={{ width:"100%", padding:"10px 14px", background:"transparent", border:"none", cursor:"pointer", color:"var(--red)", fontFamily:"var(--font-body)", fontSize:13, textAlign:"left" }}>
                          ✕ Quitar
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
            🔔 El partido quedará visible en <strong>Disponibles</strong> para todos los jugadores de la app. Quien lo acepte quedará inscrito automáticamente.
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
