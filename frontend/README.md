# Riadh Voyages Frontend

Desktop frontend for the Riadh Voyages agency manager. It uses React, Vite, and
Tauri.

## Setup

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The Vite development server runs on `http://localhost:1420`.

## Environment

Set `VITE_API_BASE_URL` in `.env.local` when the frontend should use a local or
custom backend. Without an override, the application uses the hosted API.

## Verification

```bash
pnpm run build
pnpm tauri build
```
