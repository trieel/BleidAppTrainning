# BleidAppTraining Web

Next.js PWA for the BleidAppTraining fitness MVP.

## Local setup

From this directory:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000` and expects the API at `http://localhost:5000` by default.

Make sure the API and PostgreSQL are running first. See the repository root `README.md` for the complete setup.

## Checks

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
```
