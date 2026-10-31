# Plan de Ejecución: Despliegue en Vivo y Siguientes Pasos (Bleid App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ejecutar la publicación a GitHub de las ramas `main` y `dev`, coordinar el aprovisionamiento de PostgreSQL persistente y servicios en Render y Vercel, validar la operatividad en vivo mediante smoke testing, y dejar preparada la integración del sistema de suscripciones Mercado Pago para la versión v1.1.

**Architecture:**
- **Repositorio Remoto:** GitHub (`origin/main` y `origin/dev`) sincronizados en el commit `0a8a611`.
- **Backend:** Render Web Service compilando `bleid-api/Dockerfile` desde `main`.
- **Base de Datos:** PostgreSQL en Supabase o Neon con SSL activado.
- **Frontend:** Vercel sirviendo la PWA de `bleid-web` conectada a Render.

---

## 1. Tareas de Ejecución Inmediata

### Task 1: Publicación remota en GitHub
- [ ] **Step 1: Realizar push de la rama `dev`:**
  ```bash
  git push origin dev
  ```
- [ ] **Step 2: Realizar push de la rama `main`:**
  ```bash
  git push origin main
  ```
- [ ] **Step 3: Confirmar estado de sincronización:**
  ```bash
  git status
  ```

---

## 2. Aprovisionamiento y Configuración de Infraestructura en Producción

### Task 2: Configuración de PostgreSQL Persistente (Supabase / Neon)
- [ ] **Step 1:** Crear proyecto nuevo en [Supabase](https://supabase.com) (o [Neon](https://neon.tech)).
- [ ] **Step 2:** Copiar la cadena de conexión Npgsql/ADO.NET con SSL obligatorio:
  ```
  Host=db.<ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<PASSWORD>;SSL Mode=Require;Trust Server Certificate=true
  ```
- [ ] *Nota Técnica:* No es necesario correr migraciones manualmente por consola; `Program.cs` ejecuta `app.InitializeDatabaseAsync()` en el arranque del contenedor de la API, creando tablas e insertando los ejercicios semilla.

---

### Task 3: Puesta en marcha de la API en Render
- [ ] **Step 1:** Ir a [Render Dashboard](https://dashboard.render.com) -> **New +** -> **Web Service**.
- [ ] **Step 2:** Conectar el repositorio `BleidAppTrainning` y seleccionar la rama **`main`**.
- [ ] **Step 3:** Definir:
  - **Runtime:** `Docker`
  - **Dockerfile Path:** `bleid-api/Dockerfile`
  - **Docker Context:** `bleid-api`
  - **Health Check Path:** `/health`
- [ ] **Step 4:** Configurar Variables de Entorno:
  - `ASPNETCORE_ENVIRONMENT`: `Production`
  - `ConnectionStrings__Default`: `<Cadena de Supabase/Neon>`
  - `Jwt__Secret`: `<String seguro de 32+ caracteres>`
  - `Frontend__Url`: `*` (o dominio de Vercel)
- [ ] **Step 5:** Desplegar y esperar el log `Database migrations and seeds completed successfully`.
- [ ] **Step 6:** Verificar en el navegador `https://<tu-api>.onrender.com/health` (debe responder `healthy`).

---

### Task 4: Despliegue de la PWA en Vercel
- [ ] **Step 1:** Ir a [Vercel](https://vercel.com) e importar el repositorio.
- [ ] **Step 2:** Definir **Root Directory** como `bleid-web`.
- [ ] **Step 3:** Configurar Variable de Entorno:
  - `NEXT_PUBLIC_API_URL`: `https://<tu-api>.onrender.com`
- [ ] **Step 4:** Desplegar y confirmar que la aplicación cargue en el dominio asignado.

---

## 3. Pruebas de Humo en Producción (Smoke Testing)

### Task 5: Validación Funcional de Usuario
- [ ] **Registro e Inicio de Sesión:** Crear cuenta en `/register`, verificar generación y almacenamiento de JWT en localStorage.
- [ ] **Onboarding:** Completar objetivos y días de entrenamiento en `/onboarding`.
- [ ] **Rutina:** Verificar que el Dashboard muestre los días de rutina generados automáticamente.
- [ ] **Entrenamiento:** Iniciar sesión en `/workout`, registrar series de un ejercicio y presionar "Finalizar entrenamiento".
- [ ] **Persistencia:** Recargar la página y verificar que el historial (`/history`) y las métricas (`/progress`) reflejen el volumen y la racha.
- [ ] **PWA:** Probar instalación del acceso directo en móvil.

---

## 4. Próxima Iteración: Integración de Suscripciones Mercado Pago (v1.1)

Una vez confirmado el MVP Base en producción:
- [ ] Fusionar `feat/mercado-pago-subscriptions` en `dev`.
- [ ] Configurar credenciales de producción de Mercado Pago (`AccessToken`, `WebhookSecret`).
- [ ] Desplegar la versión v1.1 con monetización activa.
