# Riadh Voyages Agency Manager

A desktop management application for a travel agency, developed as a full-stack academic project.

The application centralizes daily agency operations such as customers, hotel bookings, flight bookings, payments, invoices, imports, backups, and activity logs.

## Project Context

The project is based on a realistic agency workflow where data is often managed through Excel files and paper documents. The objective is to replace scattered tracking with a structured desktop application connected to a shared database.

## Main Features

- Authentication with role-based access
- Customer management
- Hotel and flight booking management
- Payment tracking
- PDF invoice generation
- Dashboard indicators
- CSV and Excel import
- Settings and backup module
- Activity logs for traceability

## Technologies

- React
- TypeScript
- Vite
- Tauri
- NestJS
- Prisma
- PostgreSQL
- PDFKit
- XLSX import/export

## Repository Structure

```text
travel-agency-manager/
+-- backend/
+-- frontend/
+-- docs/
+-- README.md
```

## Backend Setup

```powershell
cd backend
pnpm install
Copy-Item .env.example .env
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

The backend runs on:

```text
http://localhost:3000
```

## Frontend Setup

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The frontend development server runs on:

```text
http://localhost:1420
```

## Documentation

The `docs/` folder contains:

- Project specification
- Architecture notes
- UML diagrams
- Database design
- API documentation

## What I Practiced

- Building a complete CRUD application
- Modeling relational data with Prisma
- Connecting a React interface to a NestJS API
- Structuring a desktop app with Tauri
- Designing business workflows for an operational system

## Verification

Backend:

```powershell
cd backend
pnpm run build
pnpm test -- --runInBand
pnpm exec prisma validate
```

Frontend:

```powershell
cd frontend
pnpm run build
pnpm tauri build
```

## Notes

This is a student project. It focuses on demonstrating full-stack design, database modeling, and workflow automation for a small travel agency.
