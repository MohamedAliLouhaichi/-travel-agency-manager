# Riadh Voyages Backend

NestJS API for the Riadh Voyages agency manager.

## Responsibilities

- Authentication and JWT security
- Customer, booking, payment, invoice, settings, import, and activity-log APIs
- Prisma database access
- PostgreSQL schema management
- PDF invoice generation
- CSV and Excel import support

## Setup

```powershell
pnpm install
Copy-Item .env.example .env
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm run start:dev
```

The API runs on:

```text
http://localhost:3000
```

## Environment Variables

Configure these values in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `ADMIN_REGISTRATION_CODE`
- `PORT`

## Verification

```powershell
pnpm run build
pnpm test -- --runInBand
pnpm run test:e2e -- --runInBand
pnpm exec prisma validate
```
