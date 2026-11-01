# [Feature] Modelo Anatómico 3D con Selección Muscular y Mapa de Calor

> **Para desarrolladores / agentes:** SUB-HABILIDAD REQUERIDA: Usar superpowers:executing-plans o ejecución guiada paso a paso. Cada tarea concluye con un entregable verificable y comprobación de tests.

**Meta:** Implementar un visualizador anatómico humano interactivo con rotación 3D en perspectiva (Frontal y Dorso) en el módulo de ejercicios (`/exercises`), permitiendo filtrar ejercicios al tocar cualquier músculo y visualizar un mapa de calor biomecánico dinámico según la distribución del volumen y series de entrenamiento del usuario.

**Estrategia de Ramas:** Se trabajará en una rama aislada `feat/exercises-3d-heatmap` creada a partir de `dev`. Al completar y verificar la funcionalidad, el usuario podrá probarla de forma independiente y decidir si fusionarla a `dev` o a `main` (producción).

**Arquitectura:**
- **Backend (.NET 10 / EF Core):** Nuevo endpoint `GET /api/progress/muscle-distribution?days={7|30}` que agrega series completadas y tonelaje de `WorkoutSet` agrupados por `MuscleGroup`, calculando porcentaje de carga y niveles de intensidad (0 a 5).
- **Frontend (Next.js 14 / React 18 / Tailwind CSS):** Componente `MuscleBodyViewer` que integra `@mjcdev/react-body-highlighter` dentro de un contenedor CSS 3D (`perspective: 1000px`, `rotateY(180deg)`), con alternancia suave entre vistas frontal y dorsal, compatibilidad masculina/femenina, filtro interactivo bidireccional con el catálogo de ejercicios y leyenda cromática de sobrecarga progresiva.

**Tech Stack:** C# .NET 10, Entity Framework Core, PostgreSQL, Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, `@mjcdev/react-body-highlighter`, Lucide Icons.

---

## Restricciones Globales

- Preservar todas las normalizaciones tipográficas y de seguridad articular existentes en `lib/labels.ts` (tildes, 'ñ', contraindicaciones en español).
- Cero dependencias pesadas que comprometan el rendimiento móvil: mantener bundle ultra-liviano (<35 KB) compatible con PWA offline (`@ducanh2912/next-pwa`).
- Tipado estricto en TypeScript sin `any`.
- TDD en backend: agregar pruebas unitarias en `BleidAppTraining.Application.Tests` antes y junto a la implementación del servicio.

---

## Foco de Revisión

1. **Atletas sin entrenamientos previos (Cold Start):** Si un usuario nuevo ingresa al mapa de calor sin series completadas, el sistema debe mostrar un estado neutral elegante con nivel 0 y explicación motivacional en vez de romper la UI o mostrar NaN en porcentajes.
2. **Mapeo anatómico bidireccional completo:** Todo músculo presente en la base de datos de Bleid (Pecho, Espalda, Cuádriceps, Glúteos, Isquiotibiales, Pantorrillas, Hombros, Bíceps, Tríceps, Core) debe tener correspondencia exacta con los slugs anatómicos del modelo.
3. **Perspectiva y giro 3D en pantallas móviles:** La animación de rotación 3D frontal/dorso debe ejecutarse a 60-120 FPS sin desbordar el viewport horizontal ni bloquear el scroll vertical en pantallas estrechas (360px a 390px - iPhone 13 / SE).
4. **Reseteo y sincronización de filtros:** Si el usuario selecciona un músculo en el cuerpo y luego usa el buscador por texto libre o presiona "Ver todos", el estado debe sincronizarse limpiamente sin desalinear la vista.
5. **Precisión de toques táctiles:** Los elementos interactivos deben contar con área de toque adecuada y feedback visual inmediato (halo/acento de selección).

---

## Tareas de Implementación

### Tarea 1: Creación de Rama de Trabajo e Instalación de Dependencias

**Archivos:**
- Modificar: `bleid-web/package.json`

**Pasos:**
- [ ] 1.1 Crear y posicionarse en la rama `feat/exercises-3d-heatmap` a partir de `dev`:
  ```powershell
  git checkout -b feat/exercises-3d-heatmap
  ```
- [ ] 1.2 Instalar `@mjcdev/react-body-highlighter` en `bleid-web`:
  ```powershell
  cd bleid-web; npm install @mjcdev/react-body-highlighter
  ```
- [ ] 1.3 Verificar que no haya conflictos de dependencias con `npm run lint`.
- [ ] 1.4 Commit inicial de rama: `git commit -m "chore: setup feature branch and install body highlighter library"`.

---

### Tarea 2: Backend - Contrato DTO y Servicio de Distribución de Volumen (TDD)

**Archivos:**
- Modificar: `bleid-api/BleidAppTraining.Application/Contracts/ProgressContracts.cs`
- Modificar: `bleid-api/BleidAppTraining.Application/Interfaces/IProgressService.cs`
- Modificar: `bleid-api/BleidAppTraining.Application/Services/ProgressService.cs`
- Modificar: `bleid-api/BleidAppTraining.Application.Tests/ProgressServiceTests.cs`

**Pasos:**
- [ ] 2.1 Agregar el contrato `MuscleVolumeProgressResult` en `ProgressContracts.cs`:
  ```csharp
  public sealed record MuscleVolumeProgressResult(
      Guid MuscleGroupId,
      string MuscleGroupName,
      int TotalSets,
      decimal TotalVolumeKg,
      double Percentage,
      int IntensityLevel);
  ```
- [ ] 2.2 Declarar `GetMuscleVolumeDistributionAsync` en `IProgressService.cs`:
  ```csharp
  Task<IReadOnlyCollection<MuscleVolumeProgressResult>> GetMuscleVolumeDistributionAsync(
      Guid userId,
      int days = 7,
      int? timezoneOffsetMinutes = null,
      CancellationToken cancellationToken = default);
  ```
- [ ] 2.3 Escribir pruebas unitarias en `ProgressServiceTests.cs`:
  - `GetMuscleVolumeDistributionAsync_ReturnsCorrectAggregationAndIntensity`: Verifica que series completadas en los últimos N días se agrupen por grupo muscular, calcule porcentajes respecto al total y asigne niveles del 0 al 5 según el volumen relativo.
  - `GetMuscleVolumeDistributionAsync_WithNoWorkouts_ReturnsEmptyCollection`: Verifica que si el usuario no tiene sesiones en la ventana temporal, retorne colección vacía sin errores.
- [ ] 2.4 Ejecutar pruebas para verificar que fallen antes de implementar:
  ```powershell
  & "C:\Users\User\.dotnet\dotnet.exe" test bleid-api/BleidAppTraining.sln --filter FullyQualifiedName~GetMuscleVolumeDistribution
  ```
- [ ] 2.5 Implementar `GetMuscleVolumeDistributionAsync` en `ProgressService.cs`:
  - Filtrar `WorkoutSets` con `set.Completed && set.Session.UserId == userId && set.Session.StartedAt >= cutoff`.
  - Agrupar por `set.Exercise.MuscleGroupId` y `set.Exercise.MuscleGroup.Name`.
  - Calcular tonelaje total (`Sum(WeightKg * Reps)`) y series totales.
  - Asignar escala de intensidad de 1 a 5 basada en distribución percentil o rangos de series (ej. 1-3 series = nivel 1, 4-7 = nivel 2, 8-12 = nivel 3, 13-17 = nivel 4, >=18 = nivel 5).
- [ ] 2.6 Correr la suite de pruebas completa y verificar que pase al 100%:
  ```powershell
  & "C:\Users\User\.dotnet\dotnet.exe" test bleid-api/BleidAppTraining.sln
  ```
- [ ] 2.7 Commit: `git commit -m "feat(api): add muscle volume distribution progress service with unit tests"`.

---

### Tarea 3: Backend - Endpoint en ProgressController

**Archivos:**
- Modificar: `bleid-api/BleidAppTraining.API/Controllers/ProgressController.cs`

**Pasos:**
- [ ] 3.1 Agregar endpoint `GET /api/progress/muscle-distribution`:
  ```csharp
  [HttpGet("muscle-distribution")]
  public async Task<ActionResult<IReadOnlyCollection<MuscleVolumeProgressResult>>> MuscleDistribution(
      [FromQuery] int days = 7,
      CancellationToken cancellationToken = default)
  {
      return Ok(await progressService.GetMuscleVolumeDistributionAsync(
          CurrentUserId,
          days,
          ClientTimezoneOffset,
          cancellationToken));
  }
  ```
- [ ] 3.2 Verificar compilación general de la solución backend:
  ```powershell
  & "C:\Users\User\.dotnet\dotnet.exe" build bleid-api/BleidAppTraining.sln
  ```
- [ ] 3.3 Commit: `git commit -m "feat(api): expose GET /api/progress/muscle-distribution endpoint"`.

---

### Tarea 4: Frontend - Tipos, Cliente API y Mapeo Biomecánico

**Archivos:**
- Modificar: `bleid-web/types/index.ts`
- Modificar: `bleid-web/lib/api/index.ts`
- Modificar: `bleid-web/lib/labels.ts`

**Pasos:**
- [ ] 4.1 En `bleid-web/types/index.ts`, agregar los tipos para la distribución muscular:
  ```typescript
  export type MuscleVolumeDistribution = {
    muscleGroupId: string;
    muscleGroupName: string;
    totalSets: number;
    totalVolumeKg: number;
    percentage: number;
    intensityLevel: number; // 0 a 5
  };
  ```
- [ ] 4.2 En `bleid-web/lib/api/index.ts`, agregar función cliente:
  ```typescript
  export function getMuscleVolumeDistribution(days = 7) {
    return apiFetch<MuscleVolumeDistribution[]>(`/api/progress/muscle-distribution?days=${days}`);
  }
  ```
- [ ] 4.3 En `bleid-web/lib/labels.ts`, definir diccionario bidireccional entre slugs de anatomía y grupos musculares de Bleid:
  - `ANATOMICAL_TO_BLEID_MAP`: Mapea `chest -> Pecho`, `biceps -> Biceps`, `triceps -> Triceps`, `upper-back / lower-back / trapezius -> Espalda`, `front-deltoids / back-deltoids -> Hombros`, `quadriceps -> Cuadriceps`, `hamstring -> Isquiotibiales`, `calves -> Pantorrillas`, `gluteal -> Gluteos`, `abs / obliques -> Core`.
  - `BLEID_TO_ANATOMICAL_MAP`: Mapea cada grupo muscular a los slugs correspondientes en vista frontal y dorsal.
- [ ] 4.4 Verificar lint: `cd bleid-web; npm run lint`.
- [ ] 4.5 Commit: `git commit -m "feat(web): add muscle distribution types, api client and biomechanical mappings"`.

---

### Tarea 5: Frontend - Componente del Cuerpo Anatómico con Giro 3D y Mapa de Calor

**Archivos:**
- Crear: `bleid-web/components/features/muscle-body-viewer.tsx`

**Pasos:**
- [ ] 5.1 Crear `muscle-body-viewer.tsx` con arquitectura de doble cara y perspectiva 3D:
  - Estructura con contenedor CSS 3D (`perspective: 1000px`).
  - Tarjeta con `transform-style: preserve-3d` y transición de rotación `rotateY(0deg)` (frontal) a `rotateY(180deg)` (dorso).
  - Integrar `@mjcdev/react-body-highlighter` para silueta frontal y posterior.
- [ ] 5.2 Implementar controles de navegación visual:
  - Botón basculante con icono de giro 3D (`RotateCw` o `RefreshCw`) y toggle de píldoras: **Frontal** y **Dorso**.
  - Selector de género (`Masculino` / `Femenino`), preseleccionando el del perfil del usuario (`user.sex`).
  - Selector de modo: **Catálogo de Músculos** (selección interactiva) vs **Mapa de Calor** (intensidad de volumen).
  - Selector temporal de mapa de calor: **Últimos 7 días** (semana) / **Últimos 30 días** (mes).
- [ ] 5.3 Implementar lógica de interacción y colores:
  - En **Modo Catálogo**: Al hacer clic en un músculo, emite `onSelectMuscle(groupName)` y aplica halo de selección activo.
  - En **Modo Mapa de Calor**: Transforma los datos de `MuscleVolumeDistribution` en el formato requerido por la librería con paleta temática atlética:
    - Nivel 0 (Sin volumen): gris neutro `#27272a`.
    - Nivel 1 (Volumen bajo): cyan `#06b6d4`.
    - Nivel 2 (Volumen moderado): esmeralda `#10b981`.
    - Nivel 3 (Volumen óptimo): ámbar `#eab308`.
    - Nivel 4 (Volumen alto): naranja `#f97316`.
    - Nivel 5 (Volumen pico/énfasis): rojo carmesí `#ef4444`.
  - Leyenda inferior explicativa con escala cromática y resumen de series por zona.
- [ ] 5.4 Verificar tipos y lint: `cd bleid-web; npm run lint`.
- [ ] 5.5 Commit: `git commit -m "feat(web): implement MuscleBodyViewer component with 3D card flip and heatmap"`.

---

### Tarea 6: Frontend - Integración en la Página de Ejercicios (`/exercises`)

**Archivos:**
- Modificar: `bleid-web/app/(app)/exercises/page.tsx`

**Pasos:**
- [ ] 6.1 Integrar `MuscleBodyViewer` en la parte superior de la página de ejercicios:
  - Cargar los datos de distribución muscular en paralelo con la biblioteca de ejercicios.
  - Sincronizar el estado `selectedMuscleGroup` entre el cuerpo humano interactivo y la lista de ejercicios inferior.
- [ ] 6.2 Crear tarjeta de estado de filtro activo cuando hay un músculo seleccionado:
  - Muestra: Nombre del músculo resaltado (ej. *"Pecho"*), total de ejercicios disponibles, vista anatómica (Frontal o Dorso) y botón rápido *"Mostrar todos los ejercicios"*.
- [ ] 6.3 Crear panel de estadísticas del mapa de calor en la vista de volumen:
  - Gráfico resumen de series semanales por zona muscular y porcentaje de dedicación.
- [ ] 6.4 Conservar el buscador por texto libre con comportamiento unificado:
  - Al buscar texto libre, se muestran las coincidencias instantáneas sin interferir con el visualizador.
- [ ] 6.5 Comprobar responsividad en viewports móviles (390px iPhone 13, 768px tablet, 1200px desktop).
- [ ] 6.6 Commit: `git commit -m "feat(web): integrate 3D muscle body visualizer and heatmap into exercises page"`.

---

### Tarea 7: Verificación Integral, Pruebas y Walkthrough

**Archivos:**
- Crear: `C:\Users\User\.gemini\antigravity-cli\brain\74f348b1-e54d-4650-b071-7ae11fa98d88\walkthrough.md`

**Pasos:**
- [ ] 7.1 Ejecutar suite completa de backend:
  ```powershell
  & "C:\Users\User\.dotnet\dotnet.exe" test bleid-api/BleidAppTraining.sln
  ```
- [ ] 7.2 Ejecutar lint y build de frontend:
  ```powershell
  cd bleid-web; npm run lint; npm run build
  ```
- [ ] 7.3 Realizar pruebas de verificación manual en navegador:
  - Navegar a `/exercises`.
  - Probar rotación 3D frontal y dorsal.
  - Probar selección de músculos: Pecho, Espalda, Cuádriceps, Bíceps, Tríceps, etc.
  - Validar que el listado filtre con exactitud.
  - Alternar a modo Mapa de Calor y probar conmutación entre 7 y 30 días.
  - Probar en modo móvil (responsive) verificando que el giro 3D sea suave y sin desbordes.
- [ ] 7.4 Documentar el walkthrough con el estado de la rama `feat/exercises-3d-heatmap` para que el usuario pueda revisarla antes de pasarla a `dev` o producción.
