# ICS Backoffice — CLAUDE.md

## Project Overview

Bug/Issue Task Tracking system สำหรับทีม dev ที่ใช้ติดตาม Issue, Task, และ Deployment Status

- **Frontend**: Next.js 16 (App Router) — port 9191 (dev), basePath `/ics-backoffice`
- **Backend**: NestJS 11 — port 3001
- **Database**: PostgreSQL — `ics-backoffice` database

## Key Architecture

```
ics-backoffice/
├── frontend/          # Next.js App Router (TypeScript + Tailwind v4)
│   ├── app/           # Pages (login, dashboard, issues, documents, reports)
│   ├── components/    # UI components (dashboard, issues, layout, ui)
│   ├── lib/api.ts     # Axios client — calls /api/* → proxied to :3001
│   └── types/         # Shared TypeScript types (issue.ts, document.ts)
├── backend/           # NestJS (TypeScript + TypeORM + PostgreSQL)
│   └── src/
│       ├── auth/      # JWT auth (cookie-based), bcryptjs password hashing
│       ├── issues/    # Issue CRUD
│       ├── documents/ # Document management + attachments
│       ├── notes/     # Notes on issues
│       └── entities/  # TypeORM entities (issue, user, document, attachment, note)
├── start.sh           # Run both services locally
├── Jenkinsfile        # CI/CD pipeline (deploys to Windows via PM2)
└── ecosystem.config.js # PM2 config for production
```

## Development Commands

```bash
# Start both services
./start.sh

# Or individually:
cd backend && npm run start:dev   # NestJS watch mode → :3001
cd frontend && npm run dev        # Next.js dev → :9191

# Open app
http://localhost:9191/ics-backoffice
# Login: admin / admin
```

## Environment

**backend/.env**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/ics-backoffice
JWT_SECRET=ics-backoffice-secret-key-2024
JWT_EXPIRES_IN=7d
PORT=3001
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=/ics-backoffice/api
```

## API Routing

Frontend ใช้ Next.js rewrites: `/api/*` → `http://localhost:3001/*`

ใน production frontend จะถูก serve ที่ `/ics-backoffice` (basePath) และ backend อยู่ที่ `/ics-backoffice/api`

## Domain Types

จาก `frontend/types/issue.ts`:

| Field | Type |
|---|---|
| `codeType` | `Java \| NodeJS \| NestJS \| NextJS \| ReactJS \| Java Springboot \| Python \| Golang` |
| `priority` | `Critical \| High \| Medium \| Low` |
| `taskStatus` | `New \| Todo \| InProgress \| Test \| Done` |
| `deploymentStatus` | `Wait Approve \| Wait Deploy \| Deployed` |
| `taskWorkPeriodUnit` | `Days \| Hours` |

Issue ที่ถูก cancel จะ set `isCancelled: true` — ไม่ลบออกจาก DB

## Auth

- JWT เก็บใน **HTTP-only cookie** (ไม่ใช่ localStorage)
- Guard: `JwtAuthGuard` ใน `backend/src/auth/jwt-auth.guard.ts`
- Default user: `admin` / `admin`

## Frontend Conventions

- **Tailwind v4** — syntax อาจต่างจาก v3 ให้ตรวจ `node_modules/next/dist/docs/` ก่อนเขียน code
- App Router เท่านั้น — ไม่ใช้ Pages Router
- Form validation ใช้ `react-hook-form` + `zod`
- HTTP client ใช้ `axios` ผ่าน `lib/api.ts`
- Drag & drop (Trello board) ใช้ `@dnd-kit/core` + `@dnd-kit/sortable`
- Calendar ใช้ `react-calendar`
- Charts ใช้ `recharts`

## Backend Conventions

- TypeORM entities อยู่ใน `src/entities/`
- DTO + validation ใช้ `class-validator` + `class-transformer`
- File uploads ใช้ `multer` → เก็บไว้ที่ `backend/uploads/`
- Global `ValidationPipe({ whitelist: true })` เปิดอยู่

## Deployment (Production)

Deploy ไปยัง Windows server ที่ `C:\apps\ics-backoffice` ผ่าน Jenkins + PM2

```
Jenkins Pipeline stages:
1. Checkout
2. Build Backend (npm ci + nest build)
3. Build Frontend (npm ci + next build)
4. Prepare Frontend Standalone (copy public + static assets)
5. Stop PM2
6. Deploy Backend (robocopy dist, npm ci --omit=dev)
7. Deploy Frontend (copy standalone output)
8. Deploy Config (ecosystem.config.js)
9. Start PM2
```

ข้อควรระวัง: `robocopy` exit code 0-7 = success (Jenkins ต้อง normalize ด้วย `if %ERRORLEVEL% LEQ 7 exit 0`)

## Important Notes

- อย่าแก้ไข `basePath` ใน `next.config.ts` — Jenkins pipeline ใช้ค่านี้ในการ deploy
- `frontend/AGENTS.md` → `@AGENTS.md` (ชี้ไปที่ `frontend/AGENTS.md`) เตือนว่า Next.js version นี้มี breaking changes
- Backend `uploads/` directory ต้องมีอยู่ก่อน deploy — Jenkins สร้างให้อัตโนมัติ
