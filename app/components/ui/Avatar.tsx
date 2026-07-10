import { useState, useEffect } from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  photoUrl?: string | null;
  name: string;
  style?: React.CSSProperties;
  // Se dispara cuando la imagen no carga, para que el padre pueda ajustar
  // estilos que dependan de si hay foto (p. ej. el color de fondo del circulo).
  onError?: () => void;
}

// Muestra la foto de perfil si existe y carga bien; si la URL falla (por
// ejemplo, el asset fue borrado directamente en Cloudinary sin pasar por la
// app), cae a las iniciales en vez de mostrar el icono de imagen rota.
export default function Avatar({ photoUrl, name, style, onError }: AvatarProps) {
  const [error, setError] = useState(false);

  useEffect(() => { setError(false); }, [photoUrl]);

  if (photoUrl && !error) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={style}
        onError={() => { setError(true); onError?.(); }}
      />
    );
  }
  return <>{getInitials(name)}</>;
}
