# Plan de Optimización, Seguridad y Sesión Persistente (Bleid App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la experiencia de Bleid App en una aplicación ultrarrápida, fluida y con sensación 100% nativa en smartphones, blindar la seguridad en frontend y backend, y resolver definitivamente la persistencia de sesión para que el usuario nunca sufra cierres de sesión involuntarios.

---

## 1. Diagnóstico de Problemas Actuales

1. **Cierre Involuntario de Sesión:**
   * La expiración de JWT está seteada a 7 días en `appsettings.json`, obligando al usuario a volver a loguearse periódicamente.
   * En `render.yaml`, `Jwt__Secret` tiene `generateValue: true` en deploys nuevos, lo que invalida todos los tokens previos si se regenera.
   * No existe mecanismo de renovación silenciosa de token (`/api/auth/refresh`), por lo que al vencer el token la app redirige de golpe a `/login`.
2. **Falta de Fluidez y Bloqueos de Carga en Móvil:**
   * Todas las consultas API en Next.js se ejecutan con `cache: "no-store"`. Al navegar entre pestañas (*Dashboard*, *Ejercicios*, *Historial*, *Perfil*), la pantalla se borra y muestra `<LoadingScreen />` o spinners vacíos.
   * Peticiones duplicadas: `AppShell` consulta `getActiveSession()` en cada cambio de ruta, y `DashboardPage` la vuelve a pedir en paralelo junto a otras 6 peticiones.
3. **Cuellos de Botella en Backend y Base de Datos:**
   * El catálogo de ~112 ejercicios se consulta una y otra vez contra PostgreSQL sin compresión ni caché en memoria.
   * Faltan índices compuestos en PostgreSQL para la búsqueda de sesión activa (`workout_sessions(user_id, finished_at)`) y progreso por ejercicio (`workout_sets(exercise_id, completed)`).
   * En `GetHistoryAsync`, las consultas con colecciones anidadas generan consultas cartesianas pesadas sin `.AsSplitQuery()`.
4. **Brechas de Seguridad HTTP:**
   * `next.config.mjs` carece de headers de seguridad modernos (`Content-Security-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`).
   * La API solo tiene Rate Limiting en el login/registro, dejando los demás endpoints abiertos a saturación o scraping.

---

## 2. Decisiones de Arquitectura

```mermaid
flowchart TD
    subgraph Client["📱 Frontend Next.js 14 PWA"]
        UI["Componentes UI (Instant Render)"]
        Cache["⚡ SWR In-Memory Cache & Request Deduplicator"]
        AuthClient["🔐 Auth Client (Sliding Refresh & 90-day JWT)"]
        UI -->|1. Render instantáneo (0ms)| Cache
        Cache -->|2. Background revalidate| AuthClient
    end

    subgraph API["⚙️ ASP.NET Core 10 Web API"]
        RateLimit["🛡️ Global Rate Limiter & Security Headers"]
        Compression["📦 Response Compression (Brotli/Gzip)"]
        MemCache["💾 In-Memory Catalog Cache (Exercises & MuscleGroups)"]
        AuthService["🔑 Sliding Token Refresh Endpoint (/api/auth/refresh)"]
        RateLimit --> Compression --> MemCache --> AuthService
    end

    subgraph DB["🐘 PostgreSQL 16"]
        Idx1["⚡ Índice: workout_sessions(user_id, finished_at)"]
        Idx2["⚡ Índice: workout_sets(exercise_id, completed)"]
    end

    AuthClient --> RateLimit
    AuthService --> DB
```

---

## User Review Required

> [!IMPORTANT]
> **Duración de la sesión:** Se establecerá una validez del JWT de **90 días** con renovación automática y silenciosa mientras el usuario use la app. De este modo, la sesión nunca se cerrará a menos que el usuario toque explícitamente "Cerrar sesión" en su perfil.

> [!WARNING]
> **Clave JWT en Render (`render.yaml`):** Se ajusta `Jwt__Secret` para usar un valor estático por entorno (`sync: false`) en lugar de `generateValue: true`, evitando que un redeploy en Render desloguee a los usuarios existentes.

---

## Proposed Changes

### Componente 1: Autenticación y Persistencia de Sesión

#### [MODIFY] `bleid-api/BleidAppTraining.API/appsettings.json`
* Extender `Jwt:ExpirationDays` de 7 a 90 días.

#### [MODIFY] `bleid-api/BleidAppTraining.Application/Interfaces/IAuthService.cs`
* Agregar método `Task<AuthResult> RefreshTokenAsync(Guid userId, CancellationToken cancellationToken);`.

#### [MODIFY] `bleid-api/BleidAppTraining.Infrastructure/Identity/AuthService.cs`
* Implementar `RefreshTokenAsync`: valida que el usuario siga activo y emite un nuevo token con fecha extendida.

#### [MODIFY] `bleid-api/BleidAppTraining.API/Controllers/AuthController.cs`
* Agregar endpoint autenticado `POST /api/auth/refresh` con Rate Limiting.

#### [MODIFY] `bleid-web/lib/api/client.ts`
* Agregar renovación silenciosa de token: si el token tiene menos de 7 días para expirar o si una solicitud recibe 401, intenta refrescar antes de desloguear.

#### [MODIFY] `render.yaml`
* Cambiar `Jwt__Secret` a `sync: false` para evitar reseteos de secreto en deploys automáticos.

---

### Componente 2: Fluidez y Caché Optimista (Frontend)

#### [NEW] `bleid-web/lib/api/cache.ts`
* Implementar un gestor de caché en memoria ultra-liviano (Stale-While-Revalidate) y deduplicador de llamadas concurrentes (*in-flight promise sharing*).
* Si una clave ya está en caché, la retorna en 0ms y dispara la revalidación en segundo plano.

#### [MODIFY] `bleid-web/lib/api/index.ts`
* Integrar `cachedFetch` en consultas de catálogo (`getExercises`, `getMuscleGroups`), perfil (`getMe`), rutinas activas (`getActiveRoutine`) y sesión activa (`getActiveSession`).

#### [MODIFY] `bleid-web/components/layout/app-shell.tsx`
* Utilizar la versión deduplicada de `getActiveSession()`, evitando dobles llamadas simultáneas con el Dashboard.

#### [MODIFY] `bleid-web/app/(app)/dashboard/page.tsx`
* Eliminar el estado de pantalla completa `<LoadingScreen />` en navegaciones subsecuentes: renderizar datos desde caché instantáneamente con actualización silenciosa.

---

### Componente 3: Optimización de Base de Datos y Backend

#### [MODIFY] `bleid-api/BleidAppTraining.Infrastructure/Persistence/Configurations/WorkoutConfiguration.cs`
* Agregar índices optimizados:
  * `builder.HasIndex(s => new { s.UserId, s.FinishedAt });`
  * `builder.HasIndex(s => new { s.ExerciseId, s.Completed });`

#### [NEW] Migración EF Core `AddPerformanceIndexes`
* Generar y aplicar la migración para crear los nuevos índices en PostgreSQL.

#### [MODIFY] `bleid-api/BleidAppTraining.Application/Services/ExerciseService.cs`
* Inyectar `IMemoryCache` para almacenar en RAM el catálogo de ejercicios y grupos musculares (invalida solo tras reinicio o actualización).

#### [MODIFY] `bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs`
* Agregar `.AsSplitQuery()` en `GetHistoryAsync` para optimizar consultas con colecciones anidadas (`Sets` y `Exercise`).

#### [MODIFY] `bleid-api/BleidAppTraining.API/Program.cs`
* Agregar `AddResponseCompression` (Brotli y Gzip para HTTPS).
* Agregar `AddMemoryCache`.
* Agregar `UseResponseCompression()`.

---

### Componente 4: Blindaje de Seguridad

#### [MODIFY] `bleid-web/next.config.mjs`
* Configurar headers de seguridad HTTP en Next.js:
  * `Content-Security-Policy`
  * `X-Frame-Options: DENY`
  * `X-Content-Type-Options: nosniff`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### [MODIFY] `bleid-api/BleidAppTraining.API/Program.cs`
* Registrar política global de Rate Limiting (`GlobalLimiter`: 120 peticiones/minuto por IP para endpoints autenticados/generales) además de la `AuthPolicy` estricta (5/minuto para login/register).

---

## Verification Plan

### Automated Tests
1. **Backend Tests:**
   * Ejecutar la suite completa de xUnit:
     ```powershell
     & "$env:LOCALAPPDATA\Microsoft\dotnet\dotnet.exe" test bleid-api\BleidAppTraining.sln
     ```
   * Agregar tests unitarios para `RefreshTokenAsync` en `AuthServiceTests.cs`.
2. **Frontend Scripts:**
   * Validar que los scripts de búsqueda y localización sigan pasando:
     ```powershell
     node bleid-web/scripts/test-exercise-search.mjs
     node bleid-web/scripts/test-localization.mjs
     ```
3. **Build Frontend:**
   * Compilar el proyecto Next.js en producción para verificar tipos y ausencia de errores de empaquetado:
     ```powershell
     cd bleid-web; npm run build
     ```

### Manual Verification
1. **Persistencia de Sesión:**
   * Iniciar sesión en la app, cerrar la pestaña o recargar el navegador; la sesión debe mantenerse activa sin redirigir al login.
   * Probar el endpoint `/api/auth/refresh` con un token válido y comprobar que devuelve un token nuevo con fecha extendida.
2. **Fluidez UI:**
   * Navegar entre *Inicio*, *Ejercicios*, *Progreso* e *Historial*: el cambio de pantalla debe ser instantáneo (sin pantalla negra ni spinner de pantalla completa).
3. **Compresión e Índices:**
   * Verificar en DevTools / Red que las respuestas de `/api/exercises` y `/api/workouts/history` incluyan encabezado `Content-Encoding: br` o `gzip` y tengan tiempos de respuesta inferiores a 50ms.
