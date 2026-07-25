# Riadh Voyages Frontend

React, Vite, and Tauri frontend for the Riadh Voyages desktop application.

## Responsibilities

- Login and protected navigation
- Dashboard pages
- Customer, booking, payment, invoice, import, settings, and activity-log screens
- API integration with the NestJS backend
- Desktop packaging through Tauri

## Setup

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The Vite development server runs on:

```text
http://localhost:1420
```

## Environment Variables

Set the backend URL in `.env.local` when needed:

```text
VITE_API_BASE_URL=http://localhost:3000
```

## Verification

```powershell
pnpm run build
pnpm tauri build
```
