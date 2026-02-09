# EventReserve - Event Reservation Platform

A full-stack web application for managing events and reservations with role-based access control.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Public Pages │  │  Participant │  │    Admin     │           │
│  │    (SSR)     │  │  Dashboard   │  │  Dashboard   │           │
│  │  /events     │  │  /dashboard  │  │   /admin     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                          │                                      │
│                    Context API (Auth)                           │
│                          │                                      │
│                      Axios + JWT                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ AuthModule   │  │ EventsModule │  │ Reservations │           │
│  │ JWT Strategy │  │   CRUD       │  │   Module     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                          │                                      │
│              Guards (JWT, Roles) + Validation                   │
│                          │                                      │
│                      TypeORM                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                   │
│  │   User   │  │  Event   │  │ Reservation  │                   │
│  └──────────┘  └──────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Class Diagram

```
┌─────────────────────────┐
│         User            │
├─────────────────────────┤
│ id: UUID                │
│ email: string (unique)  │
│ name: string            │
│ password: string        │
│ role: ADMIN|PARTICIPANT │
│ createdAt: Date         │
├─────────────────────────┤
│ events: Event[]         │
│ reservations: Reservation[]│
└─────────────────────────┘
         │
         │ 1
         │
         ▼ *
┌─────────────────────────┐
│         Event           │
├─────────────────────────┤
│ id: UUID                │
│ title: string           │
│ description: text       │
│ dateTime: timestamp     │
│ location: string        │
│ capacity: int           │
│ status: DRAFT|PUBLISHED │
│         |CANCELED       │
│ createdAt: Date         │
│ updatedAt: Date         │
├─────────────────────────┤
│ createdBy: User         │
│ reservations: Reservation[]│
└─────────────────────────┘
         │
         │ 1
         │
         ▼ *
┌─────────────────────────┐
│      Reservation        │
├─────────────────────────┤
│ id: UUID                │
│ status: PENDING|CONFIRMED│
│         |REFUSED|CANCELED│
│ createdAt: Date         │
│ updatedAt: Date         │
├─────────────────────────┤
│ user: User              │
│ event: Event            │
└─────────────────────────┘
```

## Tech Stack

- **Backend**: NestJS (TypeScript), MongoDB, JWT, class-validator
- **Frontend**: Next.js 14 (TypeScript), Context API, Axios
- **Testing**: Jest, React Testing Library, Supertest
- **DevOps**: Docker, Docker Compose, GitHub Actions

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized deployment)

## Installation & Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reserve
   ```

2. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB connection and JWT secret
   npm install
   npm run start:dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with API URL
   npm install
   npm run dev
   ```

4. **Database**
   - Create a MongoDB database named `reserve_db`
   - The backend will sync entities automatically in development

### Docker Deployment

```bash
# From project root
cp .env.example .env
# Edit .env with JWT_SECRET

docker-compose up --build
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=4000
DATABASE_URL=mongodb://localhost:27017/reserve_db
JWT_SECRET=your_secure_secret_min_16_chars
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Business Rules

### Event Status
- **DRAFT**: Event is being prepared, not visible publicly
- **PUBLISHED**: Event is available for reservations
- **CANCELED**: Event has been canceled, no new reservations

### Reservation Status
- **PENDING**: Reservation awaiting admin confirmation
- **CONFIRMED**: Reservation approved, ticket downloadable
- **REFUSED**: Reservation denied by admin
- **CANCELED**: Reservation canceled by user or admin

### Constraints
- Only PUBLISHED events are visible in the public catalog
- Participants cannot reserve:
  - Canceled or unpublished events
  - Events at full capacity
  - Events they already have an active reservation for
- PDF tickets are only available for CONFIRMED reservations
- Event capacity cannot be exceeded

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Events
- `GET /api/events` - List published events (public)
- `GET /api/events/:id` - Get event details (public)
- `GET /api/events/admin/all` - List all events (admin)
- `POST /api/events` - Create event (admin)
- `PATCH /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Cancel event (admin)
- `GET /api/events/admin/stats` - Event statistics (admin)

### Reservations
- `POST /api/reservations` - Create reservation (participant)
- `GET /api/reservations/me` - My reservations (participant)
- `PATCH /api/reservations/:id/cancel` - Cancel own reservation (participant)
- `GET /api/reservations/:id/ticket` - Download PDF ticket (owner/admin)
- `GET /api/reservations/admin/all` - All reservations (admin)
- `GET /api/reservations/admin/event/:eventId` - Reservations by event (admin)
- `PATCH /api/reservations/:id/confirm` - Confirm reservation (admin)
- `PATCH /api/reservations/:id/refuse` - Refuse reservation (admin)
- `PATCH /api/reservations/:id/admin-cancel` - Cancel any reservation (admin)
- `GET /api/reservations/admin/stats` - Reservation statistics (admin)

## Testing

### Backend
```bash
cd backend
npm test           # Unit tests
npm run test:e2e   # End-to-end tests (requires test DB)
npm run test:cov   # Coverage report
```

### Frontend
```bash
cd frontend
npm test           # Component tests
npm run test:watch # Watch mode
```

## CI/CD Pipeline

GitHub Actions workflow triggers on push/PR to main/master:

1. **Backend Job**
   - Install dependencies (with caching)
   - Lint
   - Run tests
   - Build

2. **Frontend Job**
   - Install dependencies (with caching)
   - Lint
   - Run tests
   - Build

Pipeline fails if any step fails.

## Project Structure

```
reserve/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── config/         # Configuration files
│   │   ├── events/         # Events module
│   │   ├── reservations/   # Reservations module
│   │   ├── shared/         # Guards, decorators, filters
│   │   └── users/          # Users module
│   ├── test/               # E2E tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth context
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/ci.yml    # GitHub Actions
├── docker-compose.yml
└── README.md
```
