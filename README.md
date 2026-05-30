# Riadh Voyages Agency Manager

Desktop travel-agency management application for customers, hotel and flight
bookings, payments, invoices, imports, settings, backups, and activity logs.

## Structure

- `frontend`: React, Vite, and Tauri desktop application
- `backend`: NestJS API with Prisma and PostgreSQL
- `docs`: project specification and architecture notes
- `release`: distributable Windows installers

## Local Development

Start the backend:

```powershell
cd backend
Copy-Item .env.example .env
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

Start the frontend:

```powershell
cd frontend
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

The API defaults to `http://localhost:3000`, and the frontend development server
runs on `http://localhost:1420`.

## Verification

```powershell
cd backend
pnpm run build
pnpm test -- --runInBand
pnpm run test:e2e -- --runInBand
pnpm exec prisma validate

cd ..\frontend
pnpm run build
pnpm tauri build
```
