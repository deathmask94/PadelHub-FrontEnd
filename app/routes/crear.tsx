// ============================================================
// app/routes/crear.tsx                          ← RUTA: /crear
// Sprint 2 — HU-006 Crear partido
// ============================================================

import { useState } from "react";
import { Link } from "react-router";
import NavBar from "~/components/ui/NavBar";

export default function CrearPage() {
  const [formato, setFormato] = useState<"dobles"|"individual">("dobles");
  const [notify, setNotify]   = useState<"whatsapp"|"push">("whatsapp");
  const [toast, setToast]     = useState("");
  const [form, setForm]       = useState({ fecha: "Sáb 29 Mar", hora: "10:00", cancha: "Club Pádel Viña del Mar" });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const slots = formato === "dobles" ? ["FM","MR","",""] : ["FM",""];

  return (
    <div className="ph-screen">
      <div className="ph-top-bar">
        <Link to="/home" className="ph-back-btn">←</Link>
        <span className="ph-title">Crear partido</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ph-scroll">
        {/* Detalles */}
        <div className="ph-section-label fade-up">Detalles</div>
        <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[{k:"fecha",label:"Fecha"},{k:"hora",label:"Hora"}].map(({k,label}) => (
            <div key={k} style={{ flex: 1 }}>
              <label className="ph-label">{label}</label>
              <input className="ph-input" type="text" value={form[k as keyof typeof form]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="ph-input-group fade-up">
          <label className="ph-label">Club / Cancha</label>
          <input className="ph-input" type="text" value={form.cancha} onChange={(e) => set("cancha", e.target.value)} />
        </div>

        {/* Formato */}
        <div className="ph-section-label fade-up-1" style={{ marginTop: 4 }}>Formato</div>
        <div className="fade-up-1" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {([["dobles","👥","2 vs 2"],["individual","🧍","1 vs 1"]] as const).map(([f,icon,sub]) => (
            <button
              key={f}
              onClick={() => setFormato(f)}
              style={{
                flex: 1, padding: 12, borderRadius: 12, cursor: "pointer",
                border: `1px solid ${formato === f ? "var(--accent)" : "var(--border)"}`,
                background: formato === f ? "rgba(79,70,229,0.1)" : "var(--bg3)",
                textAlign: "center", fontFamily: "var(--font-body)", transition: "all .2s",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Jugadores / slots */}
        <div className="ph-section-label fade-up-2">Jugadores</div>
        <div className="fade-up-2" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {slots.map((s, i) => (
            <div
              key={i}
              onClick={() => !s && showToast("Invitación enviada por WhatsApp")}
              style={{
                flex: 1, borderRadius: 12, padding: 10, textAlign: "center", cursor: "pointer",
                border: `1px ${s ? "solid" : "dashed"} ${s ? "var(--accent)" : "var(--border)"}`,
                background: s ? "rgba(79,70,229,0.08)" : "var(--bg3)",
                transition: "all .2s",
              }}
            >
              {s ? (
                <>
                  <div className="ph-avatar" style={{ width: 32, height: 32, fontSize: 10, borderRadius: 8, margin: "0 auto 4px", background: i === 0 ? "var(--accent)" : "#059669" }}>{s}</div>
                  <div style={{ fontSize: 10, color: "var(--text2)" }}>{i === 0 ? "Tú" : "Invitado"}</div>
                </>
              ) : (
                <>
                  <div style={{ width: 32, height: 32, background: "var(--bg4)", borderRadius: 8, margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--text2)" }}>+</div>
                  <div style={{ fontSize: 10, color: "var(--text2)" }}>Invitar</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Notificaciones */}
        <div className="ph-section-label fade-up-3">Notificar por</div>
        <div className="fade-up-3" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {([["whatsapp","📲","WhatsApp","#25d366"],["push","🔔","Push","var(--accent)"]] as const).map(([n,icon,label,c]) => (
            <button
              key={n}
              onClick={() => setNotify(n)}
              style={{
                flex: 1, padding: 10, borderRadius: 10, cursor: "pointer",
                border: `1px solid ${notify === n ? (n === "whatsapp" ? "rgba(37,211,102,0.4)" : "var(--border2)") : "var(--border)"}`,
                background: notify === n ? (n === "whatsapp" ? "rgba(37,211,102,0.1)" : "rgba(79,70,229,0.1)") : "var(--bg3)",
                textAlign: "center", fontFamily: "var(--font-body)",
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: notify === n ? c : "var(--text2)" }}>{label}</div>
            </button>
          ))}
        </div>

        <button
          className="ph-btn fade-up-4"
          onClick={() => showToast("¡Partido creado! Notificación enviada 🎉")}
        >
          Crear y notificar
        </button>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--green)", color: "#fff", padding: "12px 20px",
          borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 1000,
          whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {toast}
        </div>
      )}

      <NavBar />
    </div>
  );
}
