# Plan de Despliegue a Producción de la Rama Main (Bleid App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar, consolidar y desplegar la versión de producción de Bleid App (Backend ASP.NET Core 10 en Docker, Base de Datos PostgreSQL gestionada y Frontend Next.js 14 PWA) a partir de la rama `main`, garantizando cero regresiones, persistencia segura y configuración óptima de hosting.

**Architecture:** 
- **Backend API:** ASP.NET Core 10 Web API empaquetada en contenedor Docker multi-stage, desplegada como Web Service en **Render** (o Railway), con health checks en `/health` y migraciones automáticas de EF Core al iniciar.
- **Base de Datos:** PostgreSQL 16 gestionado en **Supabase** / **Neon** (o Render PostgreSQL de pago), evitando la caducidad a 30 días de la DB gratuita de Render.
- **Frontend PWA:** Next.js 14 App Router desplegado en **Vercel** (ó Render Static/Node), conectado a la API de producción vía `NEXT_PUBLIC_API_URL`.

**Tech Stack:** ASP.NET Core 10, Entity Framework Core 10 (Npgsql), Next.js 14, Tailwind CSS, Docker, Render, PostgreSQL, Supabase/Neon, Vercel.

---

## 1. Análisis Estratégico: ¿Por qué Render y cuáles son sus consideraciones?

### ¿Por qué está configurado Render actualmente?
1. **Soporte Nativo de Docker para .NET 10:** .NET 10 es una versión muy moderna. La mayoría de los PaaS convencionales (Heroku, Vercel, Netlify) no tienen los runtimes de .NET 10 preinstalados. Render permite ejecutar cualquier `Dockerfile` multi-stage (`runtime: docker`), compilando y ejecutando la API sin preocuparse por dependencias del sistema operativo.
2. **Infraestructura como Código (Blueprint `render.yaml`):** Permite orquestar servicios, variables de entorno y health checks de forma declarativa y reproducible desde el repositorio Git.
3. **Despliegues Automáticos con Git:** Cada push a la rama configurada (`main`) activa automáticamente el pipeline de compilación de Docker y el despliegue con cero tiempo de inactividad (*zero-downtime deploys*).
4. **SSL / HTTPS y Dominios Automáticos:** Provee certificados SSL gratuitos de Let's Encrypt y subdominios `*.onrender.com` o vinculación de dominio propio (`api.bleid.app`).

### Advertencias Críticas de Render (Plan Gratuito vs. Producción)
> [!WARNING]
> **Base de Datos Gratuita de Render caduca a los 30 días:** Render elimina por completo las bases de datos PostgreSQL de su plan gratuito tras 30 días de creación. Para un entorno de producción real, **NUNCA** se debe usar la PostgreSQL Free de Render. Las dos alternativas sólidas son:
> 1. Pagar el plan Starter de Render PostgreSQL ($7 USD/mes).
> 2. **Recomendada ($0):** Utilizar una base de datos PostgreSQL gestionada en **Supabase** o **Neon** (plan gratuito permanente, sin borrado a los 30 días, con SSL y backups).

> [!NOTE]
> **Cold Starts en el Plan Gratuito de Render (Web Service):** El servicio web gratuito de Render entra en suspensión ("hiberna") si no recibe tráfico durante 15 minutos. La primera solicitud después de la hibernación puede tardar entre **30 y 60 segundos** mientras se levanta el contenedor y se inicializa la conexión con PostgreSQL. En planes de pago ($7 USD/mes) no hay suspensión.

### Matriz Comparativa de Arquitectura de Hosting

| Componente | Opción A: Render Todo-en-Uno (Free/Hobby) | Opción B: Híbrida Recomendada (Best-of-Breed) | Opción C: Render 100% Producción Paga |
| :--- | :--- | :--- | :--- |
| **Backend API (.NET 10)** | Render Web Service (Docker Free) | Render Web Service (Docker Free o Starter) | Render Web Service Starter ($7/mo) |
| **Base de Datos (Postgres)** | Supabase / Neon (Free permanente) | Supabase / Neon (Free permanente con SSL) | Render PostgreSQL Starter ($7/mo) |
| **Frontend (Next.js PWA)** | Render Web Service (Node) | **Vercel** (Free, Edge CDN global, 0 cold start) | Vercel o Render Web Service |
| **Costo Mensual** | **$0 USD/mes** | **$0 USD/mes** (o $7 si se escala API) | **$14 USD/mes** |
| **Riesgo Pérdida de Datos** | Nulo (DB externa permanente) | Nulo (Supabase/Neon permanente) | Nulo (Render persistente) |

---

## 2. Estado de Ramas en Git y Sincronización hacia `main`

> [!IMPORTANT]
> **Situación actual del repositorio:**
> - La rama `main` en Git está actualmente en el commit `9acef34` (hace 21 commits).
> - La rama `dev` contiene **11 commits de endurecimiento para producción** (health checks de DB, manejo de concurrencia en peso corporal, validaciones de comandos, corrección de timezones para rachas y volumen, guardas de navegación en entrenamientos activos, métricas vacías y SEO).
> - La rama `feat/mercado-pago-subscriptions` contiene **10 commits adicionales** con el sistema completo de suscripciones Mercado Pago (gating de 5to día de rutina, webhook/callbacks, modelo de suscripción).
> 
> **Decisión requerida:**
> Para desplegar a producción la versión de `main`, primero debemos decidir si en `main` queremos:
> 1. **Opción 1 (MVP Base Estable):** Fusionar `dev` -> `main`. (Incluye todas las correcciones y puesta a punto de producción, sin Mercado Pago aún).
> 2. **Opción 2 (MVP Completo con Monetización):** Fusionar `dev` + `feat/mercado-pago-subscriptions` -> `main`. (Incluye la app lista para producción + cobros con Mercado Pago).

---

## 3. Cambios Propuestos en el Código (Pre-Despliegue)

### Componente 1: Backend API (`bleid-api`)
#### [MODIFY] `bleid-api/BleidAppTraining.API/Program.cs`
- **Problema:** La configuración actual de CORS hace `policy.WithOrigins(frontendUrl)`. Si `Frontend:Url` es `*` (como está en `render.yaml`), ASP.NET Core falla porque espera nombres de dominio válidos o el método explícito `.AllowAnyOrigin()`. Además, si se definen múltiples dominios (ej. `https://bleid.app,https://bleid-web.vercel.app`), debe admitir separación por comas.
- **Solución:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        var frontendUrl = builder.Configuration["Frontend:Url"] ?? "http://localhost:3000";

        if (frontendUrl.Trim() == "*")
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            var origins = frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});
```

### Componente 2: Frontend Web (`bleid-web`)
#### [MODIFY] `bleid-web/lib/api/client.ts`
- **Problema:** Si `NEXT_PUBLIC_API_URL` se configura con una barra final accidental (`https://bleid-api.onrender.com/`), las llamadas generaban URLs con doble barra (`//api/auth/...`).
- **Solución:** Normalizar la URL base eliminando cualquier slash final:
```typescript
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
```

### Componente 3: Configuración de Despliegue (`render.yaml`)
#### [MODIFY] `render.yaml`
- Actualizar la configuración del blueprint para apuntar a la rama `main`, asegurar que el health check apunte a `/health` y documentar claramente las variables obligatorias.

---

## 4. Guía Paso a Paso de Ejecución para Continuar

### Paso 1: Endurecimiento de Código y Sincronización en Git
- [ ] Aplicar el fix de CORS en `bleid-api/BleidAppTraining.API/Program.cs`.
- [ ] Aplicar la sanitización de `API_URL` en `bleid-web/lib/api/client.ts`.
- [ ] Actualizar `render.yaml`.
- [ ] Ejecutar suite completa de tests de backend (`dotnet test bleid-api/BleidAppTraining.sln`).
- [ ] Ejecutar build de producción de Next.js (`npm run build` en `bleid-web`).
- [ ] Fusionar los cambios aprobados (`dev` o `feat/mercado-pago-subscriptions`) en `main`.
- [ ] Hacer `git push origin main`.

### Paso 2: Aprovisionamiento de la Base de Datos PostgreSQL
- [ ] Crear un proyecto PostgreSQL gratuito en **Supabase** (o **Neon**).
  - Anotar la cadena de conexión estándar en formato ADO.NET / Npgsql:
    `Host=db.xxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=TU_PASSWORD;SSL Mode=Require;Trust Server Certificate=true`
  - EF Core aplicará automáticamente las migraciones pendientes en el primer arranque de la API mediante `InitializeDatabaseAsync()`.

### Paso 3: Despliegue de la API en Render
- [ ] En [dashboard.render.com](https://dashboard.render.com), hacer clic en **New +** -> **Web Service** (o **Blueprint** usando `render.yaml`).
- [ ] Conectar el repositorio de GitHub y seleccionar la rama `main`.
- [ ] Configuración del servicio:
  - **Runtime:** `Docker`
  - **Dockerfile Path:** `bleid-api/Dockerfile`
  - **Docker Context:** `bleid-api`
  - **Health Check Path:** `/health`
- [ ] Variables de Entorno en Render:
  - `ASPNETCORE_ENVIRONMENT`: `Production`
  - `ConnectionStrings__Default`: *<Cadena de conexión de PostgreSQL de Supabase/Neon>*
  - `Jwt__Secret`: *<Clave secreta segura de al menos 32 caracteres>*
  - `Frontend__Url`: `*` (o la URL que asignará Vercel al frontend)
  - `MercadoPago__AccessToken`: *<Token de Mercado Pago>* (si se despliega con suscripciones)
  - `MercadoPago__WebhookSecret`: *<Secret del Webhook de Mercado Pago>*
- [ ] Iniciar el despliegue y verificar que en los logs aparezca:
  `>>> [BleidApp] Database migrations and seeds completed successfully.`
  `>>> [BleidApp] Web API is starting up and listening for incoming requests...`
- [ ] Comprobar en el navegador: `https://bleid-api.onrender.com/health` (debe responder `{"status":"healthy", "checks":[{"name":"database","status":"healthy"}]}`).

### Paso 4: Despliegue del Frontend en Vercel (Recomendado) o Render
- [ ] En [vercel.com](https://vercel.com), importar el repositorio de GitHub.
- [ ] En **Root Directory**, seleccionar `bleid-web`.
- [ ] En **Environment Variables**, configurar:
  - `NEXT_PUBLIC_API_URL`: `https://tu-api.onrender.com`
- [ ] Desplegar y verificar que cargue la PWA con la estética Warm Editorial y los logos de Bleid App.

### Paso 5: Prueba de Humo y Verificación Integral en Producción
- [ ] Registrar un usuario nuevo en la URL de producción.
- [ ] Completar el onboarding (objetivos, días de entrenamiento, nivel).
- [ ] Verificar generación automática de rutina en el Dashboard.
- [ ] Iniciar y finalizar un entrenamiento de prueba en `/workout`.
- [ ] Verificar que el progreso y racha se actualicen inmediatamente en `/dashboard` y `/progress`.
- [ ] Probar instalación de la PWA en dispositivo móvil o emulador.

---

## 5. Plan de Verificación

### Pruebas Automatizadas
```bash
# 1. Backend: 58 unit tests pasando
$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln

# 2. Frontend: 16 páginas compilando sin errores de TypeScript ni linter
cd bleid-web && npm run build
```

### Verificación Manual de Producción
1. Llamar a `GET /health` de la API desplegada y confirmar `status: "healthy"`.
2. Registrar una cuenta real, cerrar sesión y volver a iniciar sesión con JWT emitido en producción.
3. Crear un registro de peso y una rutina para confirmar persistencia real en PostgreSQL en la nube.
