# Diseño Técnico: Sistema de Suscripción y Monetización con Mercado Pago (+4 Días de Entrenamiento)

**Fecha**: 2026-10-31  
**Estado**: Aprobado tras Builder Check  
**Autor**: BleidApp Core Team  

---

## 1. Contexto e Intención

BleidApp Training es una aplicación web y móvil para planificación y registro de entrenamientos de fuerza. Actualmente, el flujo de Onboarding permite seleccionar frecuencias de 2 a 6 días por semana sin costo alguno, y el gestor de rutinas permite agregar días de forma ilimitada (`AddDayAsync`).

El objetivo es establecer un modelo de negocio *freemium* sustentable:
- **Nivel Free**: Permite planificar y registrar entrenamientos de hasta 4 días por semana (cubriendo la gran mayoría de rutinas Full-Body y Upper/Lower tradicionales) completamente gratis.
- **Nivel Pro**: Desbloquea la capacidad de entrenar 5 o 6 días por semana (splits avanzados tipo Push/Pull/Legs o Arnold Splits) mediante una suscripción mensual con débito automático recurrente vía **Mercado Pago** (~5 USD / mes fijados en moneda local, ej. ARS).

---

## 2. Objetivos, No-Objetivos y Anti-Objetivos

### Objetivos (Goals)
1. **Control en Onboarding**: Si un usuario no suscriptor selecciona 5 o 6 días semanales, al llegar al paso final se presenta el modal de suscripción Pro; el usuario puede suscribirse para activar su rutina de 5/6 días o elegir continuar gratis con 4 días.
2. **Control en Rutinas**: Bloquear el endpoint y la UI de `AddDay` cuando la rutina activa ya cuenta con 4 días activos, desplegando el modal de upgrade a Pro.
3. **Débito Automático con Mercado Pago**: Integrar la API de *Preapproval* (suscripciones recurrentes) de Mercado Pago para procesar cobros mensuales automáticos con tarjeta de crédito/débito en moneda local.
4. **Sincronización vía Webhook y Verificación Activa**: Procesar de manera idempotente las notificaciones de Mercado Pago (`preapproval` y `payment`) y contar con verificación sincrónica en `/subscription/callback` para evitar condiciones de carrera por latencia del webhook.
5. **Manejo de Cancelación y Fin de Período**: Si el usuario cancela, conserva el acceso Pro hasta el final de los 30 días ya abonados (`CurrentPeriodEnd`). Al expirar o ante fallo definitivo de cobro, la rutina activa se recorta a 4 días desactivando los días 5 y 6 (`IsActive = false`), protegiendo todas las sesiones históricas.
6. **Experiencia de Usuario Transparente**: Informar claramente el valor de Pro, mostrar badges distintivos en el selector de días y ofrecer una opción clara de "Continuar gratis con 4 días" si no desea pagar.

### No-Objetivos (Non-Goals)
1. Métodos de pago en efectivo no recurrentes (RapiPago / PagoFácil) para la suscripción, ya que no admiten débito automático mensual sin intervención del usuario.
2. Conversión dinámica multidivisa en tiempo real (el precio se configura centralizadamente en la moneda local de la cuenta de Mercado Pago del comercio, ej. ARS).
3. Restringir otras características core (ejercicios, historial de pesos o métricas de volumen continúan disponibles para usuarios Free).

### Anti-Objetivos (Anti-Goals)
1. **Almacenamiento de datos de tarjeta**: Bajo ninguna circunstancia la app capturará, transmitirá ni almacenará números de tarjeta, CVV o fechas de vencimiento en servidores propios (cumplimiento PCI-DSS total delegando el checkout a Mercado Pago).
2. **Pérdida de datos en downgrade**: Si el usuario cancela Pro, no se deben eliminar de la base de datos las sesiones ni series históricas realizadas en los días 5 y 6. El recorte desactiva el día de la rotación activa (`IsActive = false`) sin destruir datos históricos.

---

## 3. Restricciones Técnicas

1. **Stack Tecnológico**:
   - Backend: ASP.NET Core (.NET 10), Entity Framework Core, PostgreSQL, ASP.NET Core Identity.
   - Frontend: Next.js (App Router, React 19), Tailwind CSS, TypeScript.
2. **Mercado Pago API**:
   - La API de *Preapproval* (`/v1/preapproval`) requiere un monto en moneda local (ISO 4217, ej. `ARS`), `payer_email`, `back_url` y descripción.
   - Los webhooks requieren validación de firma criptográfica (`x-signature` y `x-request-id`) para evitar suplantaciones.
3. **Integridad de Base de Datos**:
   - `WorkoutSessions` referencia a `RoutineDayId`. La eliminación física directa de un día con entrenamientos registrados lanza una excepción de validación (`RoutineService.cs:124-127`). Por ello, se implementa desactivación lógica (`IsActive = false`).

---

## 4. Enfoques Considerados y Selección

### Enfoque 1: Checkout Hosted / Redirect de Mercado Pago Preapproval (SELECCIONADO)
- **Descripción**: La aplicación crea la suscripción mediante la API de Mercado Pago y redirige al usuario a la página oficial de checkout de Mercado Pago para autorizar el débito automático. Al finalizar, regresa a BleidApp y el webhook / verificación activa el plan.
- **Ventajas**: Cumplimiento de seguridad absoluto, máxima confiabilidad percibida por el usuario, cero dependencias pesadas en el bundle del frontend, soporte automático de 3D Secure y validaciones antifraude bancarias.
- **Trade-off**: Implica una breve redirección fuera del sitio web antes de regresar con el estado de pago.

### Enfoque 2: Checkout Embebido con Mercado Pago Bricks en Next.js
- **Descripción**: Se integra el SDK de Mercado Pago en un modal dentro de la app para que el usuario ingrese la tarjeta sin salir de la página.
- **Ventajas**: El usuario permanece visualmente dentro de la aplicación.
- **Trade-offs**: Mayor complejidad técnica en React/Next.js, riesgo de rotura ante actualizaciones de scripts de terceros, manejo manual de errores de validación bancaria y mayor superficie de auditoría de seguridad.

**Decisión**: Se selecciona el **Enfoque 1** por brindar la mejor combinación de seguridad, simplicidad arquitectónica y tasa de conversión confiable.

---

## 5. Decisiones Tomadas con el Usuario

1. **Doble candado**: La restricción de más de 4 días aplica tanto al Onboarding inicial como a la creación de nuevos días en la rutina activa.
2. **Modalidad de pago**: Débito automático recurrente mensual (Suscripción vía Mercado Pago Preapproval).
3. **Política de Onboarding y Uso Gratuito**: Si un usuario elige 5 o 6 días pero decide no pagar en el paywall del paso final, la app le permite continuar usando la plataforma de forma 100% gratuita ajustando su rutina a 4 días.
4. **Vigencia tras Cancelación**: Al cancelar el débito automático, el usuario mantiene su acceso Pro hasta la fecha de expiración del período pagado (`CurrentPeriodEnd`). Al cumplirse la fecha, la rutina activa se recorta a 4 días.

---

## 6. Arquitectura y Componentes a Construir

### A. Modelo de Datos (BleidAppTraining.Domain)
- Nueva entidad `Subscription`:
  - `Id` (Guid, PK)
  - `UserId` (Guid, FK a User)
  - `ExternalPreapprovalId` (string, ID de suscripción de Mercado Pago)
  - `PayerEmail` (string)
  - `Status` (Enum: `Pending`, `Active`, `PastDue`, `Cancelled`)
  - `Amount` (decimal)
  - `CurrencyId` (string, ej. "ARS")
  - `CurrentPeriodEnd` (DateTime?)
  - `CancelledAt` (DateTime?)
  - `CreatedAt`, `UpdatedAt` (DateTime)
- Entidad `RoutineDay`:
  - Agregar propiedad `IsActive` (bool, default `true`) para permitir desactivar/ocultar días en downgrade sin romper referencias con `WorkoutSessions`.

### B. Capa de Aplicación y Servicios (BleidAppTraining.Application)
- `ISubscriptionService` y `SubscriptionService`:
  - `CreateCheckoutSessionAsync(Guid userId, CancellationToken ct)`: interactúa con Mercado Pago API, registra suscripción en estado `Pending` y genera el link `init_point`.
  - `VerifySessionAsync(Guid userId, string preapprovalId, CancellationToken ct)`: consulta activamente Mercado Pago para resolver la condición de carrera tras la redirección antes de que llegue el webhook.
  - `HandleWebhookAsync(MercadoPagoWebhookPayload payload, string signatureHeader, CancellationToken ct)`: procesa notificaciones de MP de forma idempotente, actualiza `Status` y `CurrentPeriodEnd`.
  - `GetSubscriptionStatusAsync(Guid userId, CancellationToken ct)`: evalúa si el usuario es Pro (`IsProActive: bool`), considerando estado `Active` y `CurrentPeriodEnd >= DateTime.UtcNow`. Si venció el período, ejecuta automáticamente `EnforceDowngradeAsync`.
  - `EnforceDowngradeAsync(Guid userId, CancellationToken ct)`: recorta los días 5 y 6 de la rutina activa desactivándolos (`IsActive = false`) y ajusta `DaysPerWeek = 4`. Si el usuario se vuelve a suscribir en el futuro, los días inactivos se reactivan (`IsActive = true`).
- Modificaciones en `OnboardingService`:
  - Si `command.DaysPerWeek > 4`, verificar si el usuario tiene suscripción activa. Si no la tiene, rechazar con error de validación de negocio.
- Modificaciones en `RoutineService`:
  - En `AddDayAsync`, verificar que si los días activos (`routine.Days.Count(d => d.IsActive) >= 4`), el usuario debe contar con suscripción Pro activa.
  - Filtrar días por `IsActive` en consultas de rutina para que los días desactivados no aparezcan en la rotación activa.
- Modificaciones en `WorkoutService`:
  - En `StartSessionAsync`, validar que `day.IsActive` sea verdadero; de lo contrario impedir iniciar sesión en un día bloqueado por downgrade.

### C. Capa de Infraestructura (BleidAppTraining.Infrastructure)
- `MercadoPagoClient`: Cliente HTTP tipado con `HttpClient` para interactuar con la API `/v1/preapproval` de Mercado Pago utilizando `MercadoPago:AccessToken`.
- Configuración EF Core y Migración:
  - Crear tabla `Subscriptions` con índices por `UserId` y `ExternalPreapprovalId`.
  - Agregar columna `IsActive` en `RoutineDays` con valor predeterminado `true`.

### D. Capa de API (BleidAppTraining.API)
- `SubscriptionsController`:
  - `POST /api/subscriptions/checkout`: inicia el flujo de suscripción y retorna `{ initPoint: string }`.
  - `POST /api/subscriptions/verify`: verifica sincrónicamente el `preapproval_id` al volver a la app.
  - `GET /api/subscriptions/my`: retorna el estado de la suscripción (`isPro`, `status`, `currentPeriodEnd`).
  - `POST /api/subscriptions/cancel`: cancela la suscripción en Mercado Pago y programa el fin de vigencia.
  - `POST /api/subscriptions/webhook`: endpoint público para recibir eventos de Mercado Pago con validación de firma.

### E. Frontend (bleid-web)
- `SubscriptionModal` / Paywall:
  - Componente modal reutilizable que destaca:
    - Título: "Desbloqueá 5 o 6 días con Bleid Pro".
    - Precio y período: "Débito mensual automático de $X ARS (~5 USD)".
    - Beneficios claros: volumen óptimo, divisiones avanzadas (PPL / Arnold Split).
    - Botón primario: "Suscribirme con Mercado Pago".
    - Botón secundario (en onboarding): "Continuar gratis con 4 días".
- Integración en Onboarding (`app/onboarding/page.tsx`):
  - En el paso 2, el slider permite mover a 5 o 6 días mostrando una etiqueta `PRO`.
  - Al presionar "Crear mi rutina" en el paso 5, si eligió > 4 días y no es Pro:
    - Se guarda el borrador en `localStorage`.
    - Se despliega el modal. Si elige "Continuar gratis con 4 días", se ajusta `days = 4` y se crea la rutina inmediatamente sin costo.
    - Si hace click en "Suscribirme", se redirige a Mercado Pago.
- Integración en Rutinas (`app/(app)/workout/page.tsx`):
  - Si la rutina tiene 4 días activos y el usuario presiona "+ Agregar día", se abre el modal de suscripción en lugar del modal de creación de día.
- Página de retorno (`app/(app)/subscription/callback/page.tsx`):
  - Pantalla a la que Mercado Pago redirige al usuario con feedback de confirmación, verificación activa con el backend y redirección fluida a su rutina o dashboard.

---

## 7. Decisiones de Arquitectura del Desarrollador (Builder Calls)
1. **Condición de carrera resuelta**: Se incluye el endpoint `POST /api/subscriptions/verify` para verificación inmediata en la pantalla de callback, sin esperar a que el webhook llegue.
2. **Estrategia de recorte no destructiva**: Los días 5 y 6 se marcan con `IsActive = false`. Jamás se borran sesiones ni registros de series históricas.
3. **Reactivación automática**: Si un usuario cancela y semanas después se vuelve a suscribir a Pro, sus días previamente configurados se reactivan sin obligarlo a cargar su rutina de nuevo.
4. **Protección en ejecución de entrenamientos**: `WorkoutService` bloquea el inicio de cualquier sesión sobre días con `IsActive = false`.
