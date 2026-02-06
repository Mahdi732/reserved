# EventReserve - Project Instructions

## Project Overview
Full-stack event reservation platform with role-based access control.

## Tech Stack
- **Backend**: NestJS + TypeScript + PostgreSQL + TypeORM
- **Frontend**: Next.js 14 + TypeScript + Context API
- **Testing**: Jest + React Testing Library
- **DevOps**: Docker + GitHub Actions CI/CD

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Development

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env  # Edit with your DB credentials
   npm install
   npm run start:dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

3. **With Docker**
   ```bash
   cp .env.example .env
   docker-compose up --build
   ```

## Project Structure
```
reserve/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/     # JWT authentication
│   │   ├── events/   # Event management
│   │   ├── reservations/  # Reservation handling
│   │   └── users/    # User management
│   └── test/         # E2E tests
├── frontend/         # Next.js app
│   └── src/
│       ├── app/      # Pages (App Router)
│       ├── components/
│       ├── context/  # Auth context
│       └── lib/      # API client
├── .github/workflows/  # CI/CD
└── docker-compose.yml
```

## Available Tasks (VS Code)
- Backend: Dev Server
- Frontend: Dev Server
- Backend: Test
- Frontend: Test
- Backend: Lint
- Frontend: Lint
- Docker: Build & Run

## Testing
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- E2E: `cd backend && npm run test:e2e` (requires test DB)

## Business Rules
- Events: DRAFT → PUBLISHED → CANCELED
- Reservations: PENDING → CONFIRMED/REFUSED → CANCELED
- Only PUBLISHED events visible publicly
- PDF tickets only for CONFIRMED reservations
