# BleidAppTraining

Monorepo for the BleidAppTraining fitness MVP.

## Prerequisites

- .NET 10 SDK
- Node.js and npm
- Docker with Compose

## Local setup

1. Start PostgreSQL. The credentials in `compose.yaml` are for local development only.

```bash
docker compose up -d db
```

2. Configure the API's local secrets. These values are stored outside the repository by ASP.NET Core User Secrets.

```bash
dotnet user-secrets --project bleid-api/BleidAppTraining.API set "ConnectionStrings:Default" "Host=localhost;Database=bleidapp;Username=dev;Password=dev"
dotnet user-secrets --project bleid-api/BleidAppTraining.API set "Jwt:Secret" "change-this-to-a-long-random-development-secret"
```

3. Start the API with the HTTP development profile used by the web app.

```bash
dotnet run --project bleid-api/BleidAppTraining.API --launch-profile http
```

The API runs at `http://localhost:5000`. Its health check is available at `GET /health`.

4. Install and configure the web app.

```bash
cd bleid-web
npm install
cp .env.example .env.local
npm run dev
```

The web app runs at `http://localhost:3000` and reads `NEXT_PUBLIC_API_URL` from `.env.local`.

## Useful commands

Run frontend checks:

```bash
cd bleid-web
npm run lint
npx tsc --noEmit --incremental false
```

List EF Core migrations:

```bash
dotnet ef migrations list \
  --project bleid-api/BleidAppTraining.Infrastructure \
  --startup-project bleid-api/BleidAppTraining.API
```
