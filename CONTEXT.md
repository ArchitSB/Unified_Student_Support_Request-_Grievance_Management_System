# Unified Student Support System - Condensed AI Context

## 1) Project Summary
- Full-stack grievance/request platform.
- Roles: STUDENT and ADMIN.
- Backend: Express + MongoDB + JWT + Zod.
- Frontend: React (Vite) + React Router.
- Current state: frontend and backend are integrated end-to-end.

## 2) Frontend Routes
Public:
- /login
- /register
- /admin/login
- /admin/register

Student-only:
- /dashboard
- /create-request
- /my-requests

Admin-only:
- /admin/dashboard
- /admin/requests

Auth/route behavior:
- Private route guard enabled.
- Role-based redirection enabled.
- Session rehydration via GET /api/v1/auth/me.

## 3) Backend Basics
- API base: /api/v1
- Health: GET /health
- Protected routes require: Authorization: Bearer <JWT_TOKEN>
- Auth rate limit: 30 requests / 15 minutes on /api/v1/auth/*

## 4) Response Contracts
Success:
```json
{"success": true, "message": "...", "data": {}, "meta": null}
```

Error:
```json
{"success": false, "message": "...", "errors": []}
```

## 5) API Endpoints
Auth:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/admin/register
- POST /api/v1/auth/admin/login
- GET /api/v1/auth/me

Student endpoints (require STUDENT):
- POST /api/v1/requests
- GET /api/v1/requests/my
- GET /api/v1/requests/:id
- PATCH /api/v1/requests/:id
- GET /api/v1/requests/:id/updates

Admin endpoints (require ADMIN):
- GET /api/v1/admin/requests
- PATCH /api/v1/admin/requests/:id/status
- PATCH /api/v1/admin/requests/:id/assign
- GET /api/v1/admin/dashboard/stats
- GET /api/v1/admin/users

Rules:
- Student can update own request only when status is PENDING.
- Register endpoint creates STUDENT users only.
- Admin register endpoint creates ADMIN users and requires adminSignupKey.

## 6) Domain Enums
Request type:
- ACADEMIC, FINANCE, HOSTEL, INFRASTRUCTURE, OTHER

Priority:
- LOW, MEDIUM, HIGH, URGENT

Status:
- PENDING, IN_PROGRESS, RESOLVED, REJECTED

Timeline action:
- CREATED, UPDATED, ASSIGNED, STATUS_CHANGED

## 7) Core Models
User:
- name, email(unique), passwordHash, role, department, isActive

Request:
- studentId, title, description, type, priority, status, assignedTo, attachments[]

RequestUpdate:
- requestId, actorId, action, meta

## 8) Frontend API Client Map
authApi:
- register(payload), login(payload), adminRegister(payload), adminLogin(payload), getMe()

studentApi:
- createRequest(payload), listMyRequests(query), getRequestById(id), updateRequest(id, payload), getRequestUpdates(id)

adminApi:
- listRequests(query), updateStatus(id, status), assignRequest(id, assignedTo), getDashboardStats(), listAdmins()

## 9) Environment Variables
Backend required:
- MONGODB_URI
- JWT_SECRET

Backend optional:
- NODE_ENV, PORT, JWT_EXPIRES_IN, CORS_ORIGINS, ADMIN_SIGNUP_KEY
- ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_DEPARTMENT (seed script)

Frontend optional:
- VITE_API_BASE_URL (default http://localhost:5000/api/v1)

## 10) Quick Run
Backend:
```bash
cd backend && npm install && npm run dev
```

Backfill missing role profiles for existing users:
```bash
cd backend && npm run migrate:profiles
```

Seed admin:
```bash
cd backend && npm run seed:admin
```

Frontend:
```bash
cd frontend && npm install && npm run dev
```

## 11) Copy Block For New AI Chat
```text
Project: Unified Student Support, Request and Grievance Management System.
Stack: Express+MongoDB+JWT+Zod (backend), React+Vite+Router (frontend).
Roles: STUDENT, ADMIN.
Routes: /login, /register, /admin/login, /admin/register, /dashboard, /create-request, /my-requests, /admin/dashboard, /admin/requests.
API base: /api/v1. Health: GET /health.
Auth: POST /auth/register, POST /auth/login, POST /auth/admin/register, POST /auth/admin/login, GET /auth/me.
Student APIs: POST /requests, GET /requests/my, GET /requests/:id, PATCH /requests/:id, GET /requests/:id/updates.
Admin APIs: GET /admin/requests, PATCH /admin/requests/:id/status, PATCH /admin/requests/:id/assign, GET /admin/dashboard/stats, GET /admin/users.
Enums: type(ACADEMIC|FINANCE|HOSTEL|INFRASTRUCTURE|OTHER), priority(LOW|MEDIUM|HIGH|URGENT), status(PENDING|IN_PROGRESS|RESOLVED|REJECTED).
Contracts: success { success:true,message,data,meta }, error { success:false,message,errors }.
Rule: student can edit own request only when status=PENDING.
Rule: admin signup requires ADMIN_SIGNUP_KEY and adminSignupKey payload field.
```
