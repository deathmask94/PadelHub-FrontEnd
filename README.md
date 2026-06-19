# PadelHub — Frontend

Interfaz web de la plataforma PadelHub para la gestión de partidos de pádel. Permite a los jugadores buscar rivales, organizar y unirse a partidos, revisar su historial de MMR, valorar compañeros y recibir notificaciones. Incluye panel de administración.

## Tecnologías

- **React Router v7** + **Vite** — SPA con enrutamiento del lado del cliente
- **TypeScript** — tipado estático
- **CSS Modules** — estilos por componente sin dependencias externas

## Requisitos previos

- Node.js 18 o superior
- Backend PadelHub corriendo (por defecto en `http://localhost:3000`)

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`

## Build de producción

```bash
npm run build
```

## Estructura del proyecto

```
app/
  routes/
    index.tsx               → Landing / página de inicio
    login.tsx               → Inicio de sesión
    register.tsx            → Registro de jugador
    forgot-password.tsx     → Recuperación de contraseña
    reset-password.tsx      → Restablecer contraseña
    home.tsx                → Listado de partidos disponibles
    crear.tsx               → Crear nuevo partido
    match.$id.tsx           → Detalle de partido
    matchmaking.tsx         → Búsqueda de rivales
    ranking.tsx             → Ranking regional
    notificaciones.tsx      → Centro de notificaciones
    perfil.tsx              → Perfil del jugador
    perfil.editar.tsx       → Editar datos de perfil
    perfil.mmr-historial.tsx → Historial de variaciones MMR

    admin.tsx               → Panel de administración (menú)
    admin.login.tsx         → Acceso al panel admin
    admin.usuarios.tsx      → Gestión de jugadores
    admin.usuario.$id.tsx   → Detalle y ajuste MMR de jugador
    admin.partidos.tsx      → Gestión de partidos
    admin.partido.$id.tsx   → Detalle y anulación de resultado
    admin.metricas.tsx      → KPIs y métricas de la plataforma
    admin.auditoria.tsx     → Log de auditoría con exportación CSV
    admin.backup.tsx        → Backup y restauración de BD

  components/
    ui/
      NavBar.tsx            → Barra de navegación con badge de notificaciones

  services/
    api.ts                  → Helper de fetch con token JWT automático

  context/
    AuthContext.tsx         → Contexto global de autenticación

  routes.ts                 → Definición de rutas de la aplicación
```

## Páginas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing page |
| `/login` | Inicio de sesión |
| `/register` | Registro de jugador |
| `/home` | Partidos disponibles |
| `/crear` | Crear partido |
| `/matchmaking` | Buscar rivales por compatibilidad MMR |
| `/ranking` | Leaderboard regional |
| `/notificaciones` | Centro de notificaciones in-app |
| `/perfil` | Perfil y estadísticas del jugador |
| `/admin` | Panel de administración |

## Conexión con el backend

Todas las llamadas a la API se realizan a través del helper `apiFetch` en `app/services/api.ts`, que adjunta automáticamente el token JWT almacenado en `sessionStorage`.

La URL base del backend se configura como variable de entorno:

```env
VITE_API_URL=http://localhost:3000
```
