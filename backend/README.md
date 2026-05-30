# Riadh Voyages Backend

NestJS and PostgreSQL API for the Riadh Voyages agency manager.

## Setup

```bash
pnpm install
Copy-Item .env.example .env
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm run start:dev
```

The API listens on `http://localhost:3000` by default.

## Environment

Configure `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`,
`ADMIN_REGISTRATION_CODE`, and `PORT` in `.env`. Use unique secrets for every
deployed environment.

## Verification

```bash
pnpm run build
pnpm test -- --runInBand
pnpm run test:e2e -- --runInBand
pnpm exec prisma validate
```
