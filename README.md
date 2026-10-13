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

## Supabase (Google OAuth)

The Supabase credentials live outside the repository in `bleid-web/.env.local` (gitignored). Copy the placeholders from `bleid-web/.env.example` and fill them from **Project Settings > API Keys**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) and `SUPABASE_SERVICE_KEY` (`sb_secret_...`).

`SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` and any signing-key material are server-only: never prefix them with `NEXT_PUBLIC_`. New projects use asymmetric JWT signing keys, so `SUPABASE_JWKS_URL` can be used for public-key verification when no legacy JWT secret is available. The JWKS URL is public; the secret key is not.

Google OAuth configuration:

1. Google Cloud Console > APIs & Services > Credentials > OAuth client ID (Web application).
2. Authorized redirect URI for Google: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard > Authentication > Providers > Google: enable and paste the Client ID and Client Secret.
4. Supabase Dashboard > Authentication > URL Configuration: set Site URL and add redirect URLs.

| Environment | Redirect URL |
| --- | --- |
| Dev | `http://localhost:3000/auth/callback/google` |
| Prod | `https://<your-domain>/auth/callback/google` |

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
