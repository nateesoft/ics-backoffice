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
│   ├── app/           # Pages (login, dashboard, issues, documents, reports, meeting)
│   ├── components/    # UI components (dashboard, issues, layout, ui, documents, chat)
│   ├── lib/api.ts     # Axios client — calls /api/* → proxied to :3001
│   └── types/         # Shared TypeScript types (issue.ts, document.ts)
├── backend/           # NestJS (TypeScript + TypeORM + PostgreSQL)
│   └── src/
│       ├── auth/           # JWT auth (cookie-based), bcryptjs password hashing
│       ├── issues/         # Issue CRUD
│       ├── documents/      # Document management + attachments
│       ├── document-folders/ # Document folder sub-menu management
│       ├── notes/          # Notes on issues
│       ├── comments/       # Issue comments (threaded)
│       ├── chat/           # Real-time chat (WebSocket gateway)
│       ├── notifications/  # In-app notifications
│       └── entities/       # TypeORM entities (see list below)
├── start.sh           # Run both services locally
├── Jenkinsfile        # CI/CD pipeline (deploys to Windows via PM2)
└── ecosystem.config.js # PM2 config for production
```

### Backend Entities (`backend/src/entities/`)

| Entity | Table | หมายเหตุ |
|---|---|---|
| `User` | `users` | |
| `Issue` | `issues` | มี `isCancelled` แทนการลบ |
| `IssueAttachment` | `issue_attachments` | |
| `IssueHistory` | `issue_history` | |
| `IssueComment` | `issue_comments` | threaded (parentId) |
| `CommentAttachment` | `comment_attachments` | |
| `CommentReaction` | `comment_reactions` | emoji reactions |
| `Document` | `documents` | มี `folderId` FK → `document_folders` |
| `DocumentAttachment` | `document_attachments` | |
| `DocumentFolder` | `document_folders` | sidebar sub-menu folders |
| `Note` | `notes` | sticky notes บน dashboard |
| `Notification` | `notifications` | |
| `ChatMessage` | `chat_messages` | |

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

จาก `frontend/types/document.ts`:

| Field | Type | หมายเหตุ |
|---|---|---|
| `category` | `Database \| API Endpoint \| Service \| Infrastructure \| Security \| Other` | fixed enum |
| `docType` | `general \| sequence \| flowchart` | |
| `folderId` | `number \| null` | FK → `document_folders` |

## Document Folders (Sidebar Sub-menu)

Sidebar ตรง "Documents" มีปุ่ม **"+"** สำหรับสร้าง folder sub-menu:
- Folders เก็บใน DB table `document_folders` (ไม่ใช่ localStorage)
- API: `GET/POST /document-folders`, `PATCH/DELETE /document-folders/:id`
- Frontend API object: `docFoldersApi` ใน `lib/api.ts`
- URL pattern: `/documents?folderId=<id>` — page filter docs ตาม `folderId`
- เมื่อสร้าง document ขณะอยู่ใน folder view → document จะ assign `folderId` อัตโนมัติ
- Sidebar component ใช้ `useSearchParams` → ต้อง wrap ด้วย `<Suspense>` ใน `DashboardLayout`
- Documents page ใช้ `useSearchParams` → component แยกเป็น `DocumentsInner` wrap ด้วย `<Suspense>` ใน default export

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
- `useSearchParams()` ต้อง wrap ด้วย `<Suspense>` เสมอ (Next.js 16 requirement) — ดูตัวอย่างใน `documents/page.tsx` และ `DashboardLayout.tsx`
- Navigation links ต้องใช้ Next.js `<Link>` เสมอ (ไม่ใช่ `<a>`) เพื่อให้ `basePath` prefix ถูกต้องใน production

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
- TypeORM `synchronize: true` — schema เปลี่ยน (เพิ่ม column/table) จะ migrate อัตโนมัติตอน backend start
- `useSearchParams()` ใน Client Component ต้องมี Suspense boundary — ถ้าลืมจะ error ตอน build (`missing-suspense-with-csr-bailout`)
