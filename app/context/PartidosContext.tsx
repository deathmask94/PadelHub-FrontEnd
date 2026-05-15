import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface Jugador {
  ini:    string;
  nombre: string;
  color:  string;
}

export interface Partido {
  id:        number;
  fecha:     Date;
  fechaStr:  string;   // "Sáb 29 Mar"
  hora:      string;   // "10:00"
  club:      string;
  cancha:    string;
  formato:   "dobles" | "individual";
  jugadores: Jugador[];
  notif:     "whatsapp" | "push";
  estado:    "Confirmado" | "Pendiente";
}

interface PartidosContextType {
  partidos:      Partido[];
  agregarPartido: (p: Omit<Partido, "id">) => void;
}

const PartidosContext = createContext<PartidosContextType | null>(null);

// Datos del usuario demo (Felipe, id=1)
// Un usuario nuevo empezará con array vacío
const PARTIDOS_DEMO: Partido[] = [
  {
    id:       1,
    fecha:    new Date(),
    fechaStr: "Sáb 29 Mar",
    hora:     "10:00",
    club:     "Club Pádel Viña del Mar",
    cancha:   "Cancha 3",
    formato:  "dobles",
    estado:   "Confirmado",
    notif:    "whatsapp",
    jugadores: [
      { ini: "FM", nombre: "Felipe M.", color: "#4f46e5" },
      { ini: "MR", nombre: "Miguel R.", color: "#059669" },
      { ini: "AP", nombre: "Ana P.",    color: "#d97706" },
      { ini: "JV", nombre: "Javier V.", color: "#7c3aed" },
    ],
  },
];

export function PartidosProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: number | undefined;
}) {
  // Solo el usuario demo (id=1) tiene partido previo
  const inicial = userId === 1 ? PARTIDOS_DEMO : [];
  const [partidos, setPartidos] = useState<Partido[]>(inicial);

  const agregarPartido = (p: Omit<Partido, "id">) => {
    setPartidos((prev) => [{ ...p, id: Date.now() }, ...prev]);
  };

  return (
    <PartidosContext.Provider value={{ partidos, agregarPartido }}>
      {children}
    </PartidosContext.Provider>
  );
}

export function usePartidos() {
  const ctx = useContext(PartidosContext);
  if (!ctx) throw new Error("usePartidos debe usarse dentro de PartidosProvider");
  return ctx;
}
