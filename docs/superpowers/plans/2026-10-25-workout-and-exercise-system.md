# Workout Intelligence & Exercise Catalog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar el catálogo de ejercicios utilizando datasets abiertos (free-exercise-db), crear el explorador de ejercicios (`/exercises`), incorporar guía de sobrecarga progresiva en vivo (series fantasma con la carga de la última sesión) y la calculadora de discos para barra olímpica.

**Architecture:** Backend ASP.NET Core 8/10 con EF Core para consultas de historial de series anteriores y filtrado por grupos musculares; Frontend Next.js 14 (App Router) con componentes modulares y reactivos para el explorador de ejercicios, cálculo de discos y comparativa en tiempo real durante el entrenamiento.

**Tech Stack:** ASP.NET Core, EF Core, xUnit, Next.js 14, Tailwind CSS, TypeScript, Lucide Icons.

---

## Global Constraints

- Seguir Clean Architecture: Domain (entidades/enums), Application (interfaces/contratos/servicios), Infrastructure (persistencia/identidad), API (controllers).
- No romper la suite de pruebas existente (19 tests xUnit deben permanecer en verde).
- Mantener la estética visual oscura "BleidApp" (tonos oscuros, acento lima `#c8ff32`, bordes sutiles, micro-interacciones ágiles).
- Cumplir reglas de accesibilidad y soporte responsive móvil / desktop.

---

## Review Focus

1. **Rendimiento al consultar la última serie de un ejercicio:** La consulta de historial no debe escanear toda la tabla de sets, sino utilizar índices por `UserId`, `ExerciseId` y `Session.StartedAt`.
2. **Cálculo de discos con pesos imposibles:** La calculadora de discos debe manejar pesos inferiores al peso de la barra (ej. < 20 kg) o pesos no múltiplos de 1.25 kg sin bloquearse.
3. **Paginación o filtrado eficiente en el explorador:** El listado de ejercicios no debe colgar el navegador al renderizar cientos de elementos.
4. **Resiliencia ante ejercicios nuevos:** Si el usuario nunca ha realizado un ejercicio previamente, la guía de sobrecarga en vivo debe mostrar un indicador claro ("Primera vez") en vez de valores nulos o vacíos.

---

### Task 1: Endpoint y Consulta de Última Serie Realizada (Ghost Sets / Sobrecarga en Vivo)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Interfaces/IProgressService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/ProgressService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Contracts/ProgressContracts.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/ProgressController.cs`
- Test: `bleid-api/BleidAppTraining.Application.Tests/ProgressServiceTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext.WorkoutSets`, `UserId`, `ExerciseId`
- Produces: `Task<ExerciseLatestPerformanceResult?> GetLatestPerformanceAsync(Guid userId, Guid exerciseId, CancellationToken cancellationToken = default);`

- [x] **Step 1: Escribir la prueba fallida en `ProgressServiceTests.cs`**
  Probar que si un usuario tiene sesiones previas con ese ejercicio, devuelve las series completadas de la última sesión con su peso y repeticiones.
- [x] **Step 2: Ejecutar `dotnet test` y verificar que falle**
- [x] **Step 3: Implementar contrato y método en `ProgressService.cs` y endpoint en `ProgressController.cs`**
- [x] **Step 4: Ejecutar `dotnet test` y verificar que pase**
- [x] **Step 5: Conectar cliente frontend en `bleid-web/lib/api/index.ts`**

---

### Task 2: Componente Calculadora de Discos de Barra Olímpica (`PlateCalculator`)

**Files:**
- Create: `bleid-web/components/features/plate-calculator.tsx`
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`

**Interfaces:**
- Props: `targetWeightKg: number; barWeightKg?: number; onClose: () => void; onApplyWeight?: (weight: number) => void;`
- Produces: Visualizador interactivo de discos por lado (20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg) con selector de barra (20kg estándar / 15kg barra técnica).

- [x] **Step 1: Crear `components/features/plate-calculator.tsx` con algoritmo de desglose voraz (greedy algorithm) de discos estándar**
- [x] **Step 2: Agregar representación visual de la barra con los discos en colores oficiales / Bleid**
- [x] **Step 3: Integrar botón de calculadora junto al input de Kg en `/workout/[sessionId]`**
- [x] **Step 4: Verificar funcionamiento interactivo en mobile y desktop**

---

### Task 3: Integración de Sobrecarga Progresiva en Vivo en `/workout/[sessionId]`

**Files:**
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`
- Modify: `bleid-web/lib/api/index.ts`

**Interfaces:**
- Consumes: `getLatestExercisePerformance(exerciseId)`
- Produces: Etiqueta de referencia en cada ejercicio: *"Anterior: 3 series (máx. 75 kg × 10 r)"* y prellenado inteligente de peso/reps sugeridos.

- [x] **Step 1: Cargar en paralelo el rendimiento anterior de cada ejercicio de la sesión activa**
- [x] **Step 2: Renderizar pill de guía bajo el objetivo de cada ejercicio con la última marca conseguida**
- [x] **Step 3: Inicializar los campos de entrada de peso con el último valor utilizado para facilitar la sobrecarga progresiva**

---

### Task 4: Explorador y Biblioteca de Ejercicios (`/exercises`)

**Files:**
- Create: `bleid-web/app/(app)/exercises/page.tsx`
- Modify: `bleid-web/components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: `getExercises(muscleGroupId)`, `getExerciseById(id)`, `ExerciseModal`
- Produces: Página completa de exploración y búsqueda con:
  - Selector de grupo muscular (Pecho, Espalda, Cuádriceps, Glúteos, Hombros, etc.).
  - Filtro por equipamiento (Barra, Mancuernas, Máquinas, Poleas, Peso corporal).
  - Búsqueda en tiempo real.
  - Indicador de seguridad articular para cada ejercicio.
  - Acceso directo a la ficha técnica con técnica y tips de modificación.

- [x] **Step 1: Añadir enlace "Ejercicios" en la navegación principal de `AppShell`**
- [x] **Step 2: Implementar la vista `app/(app)/exercises/page.tsx` con filtros por grupo muscular, buscador y tarjetas interactivas**
- [x] **Step 3: Vincular las tarjetas al `ExerciseModal` existente**
- [x] **Step 4: Verificar que el build de Next.js (`npm run build`) compile sin errores**

---

### Task 5: Extensión del Catálogo con Dataset Abierto (Seeder & Librerías de Ejercicios)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs`
- Test: `bleid-api/BleidAppTraining.Application.Tests/ExerciseServiceTests.cs`

**Interfaces:**
- Expandir el catálogo actual a más de 60 ejercicios fundamentales basados en la taxonomía de **free-exercise-db** (categorizados por grupo muscular, equipamiento, contraindicaciones y tips de adaptación articular).

- [x] **Step 1: Agregar definiciones de ejercicios clave (Fondos en paralelas, Hiperextensiones, Elevaciones en banco inclinado, Face pulls, Elevación de talones sóleo, Jalón tras nuca alternativo, etc.)**
- [x] **Step 2: Asignar contraindicaciones exactas y tips de modificación biomecánica**
- [x] **Step 3: Ejecutar `dotnet test` para verificar que el seeder y el filtrado mantengan la integridad referencial**
