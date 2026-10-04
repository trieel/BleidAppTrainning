# BleidAppTraining API

ASP.NET Core Web API organized using Clean Architecture.

- `BleidAppTraining.Domain`: entities, value objects and domain rules.
- `BleidAppTraining.Application`: use cases, services and interfaces.
- `BleidAppTraining.Infrastructure`: persistence and external integrations.
- `BleidAppTraining.API`: HTTP endpoints and composition root.

Run the API from the repository root with:

```bash
dotnet run --project bleid-api/BleidAppTraining.API
```

The health check is available at `GET /health`.

The API applies pending migrations and seeds the `user` and `admin` roles on startup. To manage migrations manually:

```bash
DOTNET_ROOT=$HOME/.dotnet $HOME/.dotnet/tools/dotnet-ef migrations list \
  --project bleid-api/BleidAppTraining.Infrastructure \
  --startup-project bleid-api/BleidAppTraining.API
```
