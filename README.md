# WaterFlow

WaterFlow is a full-stack water tanker booking platform with role-based flows for **customers**, **captains**, and **admins**.  
It includes real-time delivery tracking using **SSE** with optional **Kafka** ingestion for high-throughput location updates.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Realtime:** Server-Sent Events (SSE), Kafka (optional)
- **Infra:** Docker Compose, Nginx (production compose)

## Repository Structure

```text
WaterFlow/
├── client/                 # React app (Vite)
├── server/                 # Express API + Prisma
├── nginx/                  # Nginx config for prod compose
├── docker-compose.yml      # Local infra (Postgres, Zookeeper, Kafka)
└── docker-compose.prod.yml # Production-oriented stack
```

## Core Features

- JWT-based authentication and role handling (`CUSTOMER`, `CAPTAIN`, `ADMIN`)
- Customer booking creation and booking history
- Captain online/offline state, location updates, delivery workflow
- Nearby captains and nearby offices discovery
- Office creation, joining, member approval flow
- Admin dashboard APIs for users, bookings, offices
- Live tracking endpoint: `GET /api/tracking/:bookingId`
- Health endpoint: `GET /api/health`

## Backend API Modules

- `/api/auth` - register, login, profile, Aadhaar verify, logout
- `/api/bookings` - create, list, accept, status update, cancel
- `/api/captains` - nearby captains, location updates
- `/api/addresses` - saved addresses CRUD
- `/api/offices` - office discovery, creation, membership, updates
- `/api/admin` - admin stats and moderation endpoints
- `/api/bids` - bidding routes (mounted in server)

## Prerequisites

- Node.js (18+ recommended)
- npm
- Docker + Docker Compose (for local Postgres/Kafka stack)

## Local Development Setup

### 1) Start infrastructure

From repository root:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5433`
- Zookeeper on `localhost:2181`
- Kafka on `localhost:9092`

### 2) Configure backend environment

```bash
cd server
cp .env.example .env
```

Update `server/.env` values (minimum):
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL` (default frontend origin)
- `KAFKA_BROKER` (optional, app can fallback to SSE-only behavior)

Example local DB URL for compose setup:

```env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5433/waterflow_db?schema=public"
```

### 3) Install dependencies

```bash
cd server && npm ci
cd ../client && npm ci
```

### 4) Prepare database

```bash
cd server
npm run db:push
```

### 5) Run apps

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

By default:
- API: `http://localhost:5001`
- Frontend: `http://localhost:5173`

## Frontend Environment

`client/.env.development`:

```env
VITE_API_URL=http://localhost:5001/api
```

`client/.env.production`:

```env
VITE_API_URL=https://api.waterflow.in/api
```

## Build Commands

Backend:

```bash
cd server
npm run build
```

Frontend:

```bash
cd client
npm run lint
npm run build
```

## Production Notes

- `docker-compose.prod.yml` runs Kafka, server, and Nginx.
- It expects `DATABASE_URL` and `JWT_SECRET` from environment.
- Nginx proxies API traffic and exposes HTTP/HTTPS.

## Current Validation Snapshot

At the time of generating this README:
- `server`: `npm run build` succeeds
- `server`: `npm test` fails because no tests are defined in `package.json`
- `client`: `npm run lint` currently reports existing lint errors in source files

