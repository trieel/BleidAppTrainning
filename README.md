# BleidAppTraining

Monorepo for the BleidAppTraining MVP.

## Local setup

Start PostgreSQL:

```bash
docker compose up -d db
```

Start the API:

```bash
dotnet run --project bleid-api/BleidAppTraining.API
```

Start the web app:

```bash
cd bleid-web
npm run dev
```

The API uses ASP.NET Core User Secrets for local credentials. The frontend reads `NEXT_PUBLIC_API_URL` from `.env.local`.
