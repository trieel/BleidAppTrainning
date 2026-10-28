# Plan de Remediación de Auditoría del Backend (bleid-api)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver los hallazgos críticos y de arquitectura identificados en la auditoría del backend de BleidApp (`bleid-api`), incluyendo la resolución de vulnerabilidades NuGet, desajustes de constraints de PostgreSQL, validadores faltantes, excepciones HTTP 500 erróneas, robustez de claims JWT y configuración de Swagger.

**Architecture:** Aplicar Clean Architecture y prácticas oficiales de ASP.NET Core 10: centralizar validaciones de entrada en FluentValidation dentro de `Application`, corregir el manejo de excepciones en `API.Middleware`, desacoplar la inyección de dependencias de `Application` de `Infrastructure`, asegurar unicidad en persistencia EF Core y eliminar vulnerabilidades en paquetes NuGet.

**Tech Stack:** .NET 10 (C# 13), ASP.NET Core Web API, EF Core 10 (PostgreSQL / Npgsql), FluentValidation, xUnit, Swashbuckle/OpenAPI.

---

## Global Constraints
- Target Framework: `net10.0`
- Mantener compatibilidad estricta con los contratos de frontend (`bleid-web`).
- Todas las pruebas de `BleidAppTraining.Application.Tests` deben pasar (`dotnet test`).
- Respuestas de error deben seguir RFC 9457 (`application/problem+json`).

---

## Review Focus
1. `UpdateProfileCommand` con `SessionMin` distinto de (30, 45, 60) no debe provocar `DbUpdateException` (Postgres 500), sino HTTP 400 con ProblemDetails claro.
2. `BodyWeightService` con valores de peso inválidos o notas extensas no debe disparar HTTP 500, sino HTTP 400.
3. El paquete `System.Security.Cryptography.Pkcs` no debe tener vulnerabilidades reportadas en `dotnet restore / test`.
4. El claim `userId` en `AuthController` y `AuthenticatedControllerBase` debe retornar 401 si falta o no es un Guid válido, nunca 500.
5. Iniciar un nuevo workout con una sesión previa abierta debe cerrar la anterior de forma limpia en lugar de dejar sesiones huérfanas activas.

---

### Task 1: Resolver vulnerabilidad de dependencias NuGet (NU1903 / NU1902)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj`
- Modify: `bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj`

- [ ] **Step 1: Verificar el warning actual en el proyecto**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: Warning `NU1903` y `NU1902` sobre `System.Security.Cryptography.Pkcs 9.0.0`.

- [ ] **Step 2: Actualizar dependencias en Infrastructure y API**
Agregar la referencia directa a `System.Security.Cryptography.Pkcs` en versión `9.0.2` (o la versión parcheada para net10.0) o actualizar `System.IdentityModel.Tokens.Jwt` para mitigar las alertas GHSA-846f-f764-76mx y GHSA-2fmv-rv2c-59x7.

- [ ] **Step 3: Verificar que la compilación y tests corran limpios de alertas de seguridad**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: 0 warnings de vulnerabilidad de paquetes.

- [ ] **Step 4: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj
git commit -m "security: update cryptographic packages to resolve GHSA-846f-f764-76mx"
```

---

### Task 2: Validadores FluentValidation y sincronización con Constraints de Base de Datos

**Files:**
- Create: `bleid-api/BleidAppTraining.Application/Validators/BodyWeightValidator.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Validators/AuthValidators.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Validators/RoutineValidators.cs`
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Identity/AuthService.cs`
- Modify: `bleid-api/BleidAppTraining.Application.Tests/AuthServiceTests.cs`

**Interfaces:**
- Consumes: `UpdateProfileCommand`, `LogBodyWeightCommand`, `AddRoutineDayCommand`
- Produces: `UpdateProfileCommandValidator`, `LogBodyWeightCommandValidator`, `AddRoutineDayCommandValidator`

- [ ] **Step 1: Escribir tests para `UpdateProfileCommandValidator` y `LogBodyWeightCommandValidator`**
Crear pruebas unitarias verificando que `SessionMin` fuera de (30, 45, 60), `Age` fuera de (13, 100) y `WeightKg` fuera de (1, 500) sean rechazados.

- [ ] **Step 2: Implementar `UpdateProfileCommandValidator` en `AuthValidators.cs`**
Validar:
- `FullName`: max length 150.
- `Age`: entre 13 y 100.
- `DaysPerWeek`: entre 2 y 6.
- `SessionMin`: debe ser 30, 45 o 60 (alineado con la restricción `ck_users_session_min`).
- `Limitations`: validadas con `LimitationInputValidator`.

- [ ] **Step 3: Implementar `LogBodyWeightCommandValidator` y `AddRoutineDayCommandValidator`**
- `LogBodyWeightCommandValidator`:
  - `WeightKg`: entre 1 y 500 kg.
  - `Notes`: máximo 500 caracteres (alineado con `HasMaxLength(500)`).
- `AddRoutineDayCommandValidator`:
  - `Name`: máximo 100 caracteres cuando no sea nulo.

- [ ] **Step 4: Actualizar `AuthServiceTests.cs`**
Corregir la prueba que usaba `SessionMin = 75` para usar un valor válido (`SessionMin = 60`).

- [ ] **Step 5: Ejecutar suite de pruebas**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: PASS.

- [ ] **Step 6: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.Application/Validators/ bleid-api/BleidAppTraining.Application.Tests/AuthServiceTests.cs
git commit -m "fix(validation): align profile and bodyweight validation with postgres constraints"
```

---

### Task 3: Manejo de Excepciones en Middleware y Servicio de Peso Corporal

**Files:**
- Modify: `bleid-api/BleidAppTraining.API/Middleware/ExceptionMiddleware.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs`

- [ ] **Step 1: Ajustar `ExceptionMiddleware.cs` para capturar `ArgumentException`**
Mapear `ArgumentException` a `StatusCodes.Status400BadRequest` con su mensaje de error, impidiendo que caiga en 500 Internal Server Error.

- [ ] **Step 2: Actualizar `BodyWeightService.cs` para lanzar `ServiceValidationException`**
Sustituir `throw new ArgumentException(...)` por `throw new ServiceValidationException(...)` para mantener coherencia con el resto de los servicios de la aplicación.

- [ ] **Step 3: Ejecutar pruebas y verificar**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: PASS.

- [ ] **Step 4: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.API/Middleware/ExceptionMiddleware.cs bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs
git commit -m "fix(error-handling): map domain and argument exceptions to 400 Bad Request"
```

---

### Task 4: Estandarización de `AuthController` y Robustez de Claims

**Files:**
- Modify: `bleid-api/BleidAppTraining.API/Controllers/AuthenticatedControllerBase.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/AuthController.cs`

- [ ] **Step 1: Endurecer extracción de `CurrentUserId` en `AuthenticatedControllerBase`**
Usar `Guid.TryParse`:
```csharp
protected Guid CurrentUserId
{
    get
    {
        var rawId = User.FindFirstValue("userId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(rawId) || !Guid.TryParse(rawId, out var userId))
            throw new UnauthorizedAccessException("The access token does not contain a valid user id.");
        return userId;
    }
}
```

- [ ] **Step 2: Heredar `AuthController` de `AuthenticatedControllerBase`**
Eliminar las líneas duplicadas `Guid.Parse(User.FindFirst("userId")!.Value)` y reutilizar `CurrentUserId`.

- [ ] **Step 3: Ejecutar tests**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: PASS.

- [ ] **Step 4: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.API/Controllers/AuthenticatedControllerBase.cs bleid-api/BleidAppTraining.API/Controllers/AuthController.cs
git commit -m "refactor(auth): standardize controller base and harden claims extraction"
```

---

### Task 5: Manejo de Sesiones Activas en `WorkoutService`

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs`
- Modify: `bleid-api/BleidAppTraining.Application.Tests/WorkoutServiceTests.cs`

- [ ] **Step 1: Escribir test en `WorkoutServiceTests`**
Verificar que si el usuario inicia una sesión en un día diferente teniendo una sesión anterior sin finalizar, la sesión anterior se marque automáticamente como finalizada (`FinishedAt = DateTime.UtcNow`).

- [ ] **Step 2: Implementar auto-cierre de sesión previa en `WorkoutService.StartSessionAsync`**
Si `existingActive is not null` y `existingActive.RoutineDayId != command.RoutineDayId`:
Finalizar la sesión anterior asignando `existingActive.FinishedAt = DateTime.UtcNow` antes de crear la nueva sesión.

- [ ] **Step 3: Ejecutar tests**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: PASS.

- [ ] **Step 4: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs bleid-api/BleidAppTraining.Application.Tests/WorkoutServiceTests.cs
git commit -m "fix(workout): auto-close previous active session when starting a new day"
```

---

### Task 6: Swagger con Soporte para Bearer Token y Limpieza de DI

**Files:**
- Create: `bleid-api/BleidAppTraining.Application/DependencyInjection.cs`
- Modify: `bleid-api/BleidAppTraining.Infrastructure/DependencyInjection.cs`
- Modify: `bleid-api/BleidAppTraining.API/Program.cs`

- [ ] **Step 1: Crear `AddApplication` en `BleidAppTraining.Application`**
Mover el registro de `IWorkoutService`, `IRoutineService`, etc., a `BleidAppTraining.Application.DependencyInjection`.
Hacer que `Infrastructure` solo registre persistencia e identidad.
Invocar `builder.Services.AddApplication()` y `builder.Services.AddInfrastructure(builder.Configuration)` en `Program.cs`.

- [ ] **Step 2: Configurar soporte para Bearer Token en Swagger**
En `Program.cs`, enriquecer `builder.Services.AddSwaggerGen(options => ...)` con la definición de seguridad `Bearer` (SecurityDefinition y SecurityRequirement) para que los desarrolladores puedan autenticarse directamente desde Swagger UI en desarrollo.

- [ ] **Step 3: Ejecutar suite de pruebas completa**
Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: PASS sin errores.

- [ ] **Step 4: Commit de la tarea**
```bash
git add bleid-api/BleidAppTraining.Application/DependencyInjection.cs bleid-api/BleidAppTraining.Infrastructure/DependencyInjection.cs bleid-api/BleidAppTraining.API/Program.cs
git commit -m "feat(api): decouple application DI and add Swagger JWT Bearer security"
```
