# Plan de Despliegue a Producción: Opción 1 (MVP Base Endurecido)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar el MVP Base de Bleid App (sin suscripciones de pago aún), aplicando los ajustes finales de CORS y sanitización de URLs, fusionando `dev` en `main` mediante fast-forward, y desplegando el backend en Render conectado a PostgreSQL gestionado (Supabase/Neon) y el frontend en Vercel.

**Architecture:** 
- **Backend API:** ASP.NET Core 10 Web API empaquetada en Docker (`bleid-api/Dockerfile`), desplegada en Render Web Service con health check en `/health`.
- **Base de Datos:** PostgreSQL 16 gestionado en Supabase o Neon (permanente y gratuito, evitando la expiración a 30 días de la DB free de Render).
- **Frontend PWA:** Next.js 14 App Router desplegado en Vercel (o Render) con PWA y diseño Warm Editorial.
- **Git Strategy:** Aplicar correcciones en `dev`, validar 50 tests y 15 rutas, fusionar hacia `main`, y desplegar desde `main`.

**Tech Stack:** ASP.NET Core 10, Entity Framework Core 10, Npgsql, Next.js 14, Tailwind CSS, Docker, Render, Supabase / Neon, Vercel.

---

## 1. Alcance de la Opción 1

La Opción 1 despliega la versión de producción verificada que contiene:
1. ✅ Corrección de validación de perfil `SessionMin` sincronizada con la base de datos.
2. ✅ Índice único `(UserId, Date)` en `BodyWeightEntries` con manejo de concurrencia.
3. ✅ Validadores FluentValidation en comandos críticos y filtros de validación de peticiones.
4. ✅ Soporte de zona horaria dinámica del cliente (`X-Timezone-Offset`) para rachas, volumen y peso.
5. ✅ Health check completo `/health` con verificación activa de EF Core contra PostgreSQL.
6. ✅ Guarda de navegación y advertencia de descarga para entrenamientos activos en curso.
7. ✅ Estados vacíos elegantes y cálculos métricos robustos según Warm Editorial.
8. ✅ Metadatos SEO, OpenGraph y configuración para PWA móvil.
9. 🔒 *Nota:* La rama `feat/mercado-pago-subscriptions` queda preservada de forma aislada para el siguiente release de monetización.

---

## 2. Cambios de Código Pre-Despliegue

### Tarea 1: Endurecimiento de CORS en Backend
**Archivo:** `bleid-api/BleidAppTraining.API/Program.cs`
- Si la variable `Frontend:Url` es `*` (como en `render.yaml`), invocar `policy.AllowAnyOrigin()`.
- Si contiene múltiples URLs separadas por comas (ej. dominio de Vercel + dominio personalizado), procesarlas con `.Split(',')`.

### Tarea 2: Sanitización de URL de API en Frontend
**Archivo:** `bleid-web/lib/api/client.ts`
- Normalizar `NEXT_PUBLIC_API_URL` eliminando cualquier barra diagonal final accidental (`.replace(/\/$/, "")`).

---

## 3. Plan de Tareas de Ejecución

### Task 1: Aplicar fixes de configuración en rama `dev`
- [ ] **Step 1:** Modificar `bleid-api/BleidAppTraining.API/Program.cs` para manejar CORS con `*` y múltiples dominios.
- [ ] **Step 2:** Modificar `bleid-web/lib/api/client.ts` para sanitizar `NEXT_PUBLIC_API_URL`.
- [ ] **Step 3:** Ejecutar los 50 tests unitarios de .NET y verificar que pasen al 100%:
  ```powershell
  $env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln
  ```
- [ ] **Step 4:** Compilar el frontend en modo producción y verificar 15 rutas estáticas y dinámicas:
  ```powershell
  cd bleid-web; npm run build
  ```
- [ ] **Step 5:** Realizar commit en rama `dev`:
  ```bash
  git add bleid-api/BleidAppTraining.API/Program.cs bleid-web/lib/api/client.ts
  git commit -m "fix(deploy): harden CORS wildcard handling and sanitize API URL for production"
  ```

### Task 2: Fusionar rama `dev` en `main`
- [ ] **Step 1:** Hacer checkout a la rama `main`:
  ```bash
  git checkout main
  ```
- [ ] **Step 2:** Realizar merge fast-forward desde `dev`:
  ```bash
  git merge dev --ff-only
  ```
- [ ] **Step 3:** Re-verificar que los tests pasen en `main`:
  ```powershell
  $env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln
  ```
- [ ] **Step 4:** Publicar los cambios en el repositorio remoto:
  ```bash
  git push origin main
  git push origin dev
  ```

### Task 3: Aprovisionamiento de PostgreSQL en Supabase / Neon
- [ ] **Step 1:** Crear proyecto gratuito en [Supabase](https://supabase.com) o [Neon](https://neon.tech).
- [ ] **Step 2:** Obtener la Connection String en formato Npgsql / ADO.NET:
  ```
  Host=db.<ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<PASSWORD>;SSL Mode=Require;Trust Server Certificate=true
  ```

### Task 4: Despliegue del Backend en Render
- [ ] **Step 1:** En Render Dashboard, seleccionar **New Web Service** vinculado al repositorio.
- [ ] **Step 2:** Seleccionar rama `main`.
- [ ] **Step 3:** Runtime: **Docker** (detectará automáticamente `bleid-api/Dockerfile`).
- [ ] **Step 4:** Health Check Path: `/health`.
- [ ] **Step 5:** Configurar Variables de Entorno en Render:
  * `ASPNETCORE_ENVIRONMENT` = `Production`
  * `ConnectionStrings__Default` = *<Cadena de conexión de Supabase/Neon>*
  * `Jwt__Secret` = *<String seguro de 32+ caracteres>*
  * `Frontend__Url` = `*` (o la URL de Vercel)
- [ ] **Step 6:** Desplegar y confirmar logs de inicio y migraciones exitosas de EF Core.

### Task 5: Despliegue del Frontend en Vercel
- [ ] **Step 1:** Importar el repositorio en [Vercel](https://vercel.com).
- [ ] **Step 2:** Configurar Root Directory: `bleid-web`.
- [ ] **Step 3:** Environment Variables: `NEXT_PUBLIC_API_URL` = `https://<tu-api-en-render>.onrender.com`.
- [ ] **Step 4:** Desplegar y validar carga y funcionamiento de la PWA.

### Task 6: Smoke Test Final en Producción
- [ ] **Step 1:** Registrar un usuario nuevo en la URL de producción.
- [ ] **Step 2:** Completar onboarding y validar generación de rutina.
- [ ] **Step 3:** Iniciar y completar un entrenamiento.
- [ ] **Step 4:** Confirmar persistencia en PostgreSQL en la nube.

---

## 4. Plan de Verificación

### Automated Tests
```powershell
$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln
cd bleid-web; npm run build
```

### Manual Verification
1. `curl -i https://<tu-api>.onrender.com/health` responde HTTP 200 con `{ status: "healthy", checks: [{ name: "database", status: "healthy" }] }`.
2. El frontend desplegado en Vercel permite login, registro y navegación sin errores CORS ni desconexiones.
