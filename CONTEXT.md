# Unified Student Support System - Current Context Snapshot

## 1) Project Status
- Full-stack grievance/request platform is integrated end-to-end.
- Backend: Express + MongoDB + JWT + Zod.
- Frontend: React (Vite) + React Router.
- Current architecture includes hierarchical workflow approvals and department-scoped operations.

## 2) Active Roles
- STUDENT
- TEACHER
- HOD
- DEPARTMENT_ADMIN
- SUPER_ADMIN
- ADMIN (legacy compatibility role)

## 3) Frontend Routing
Public:
- /login
- /register
- /admin/login
- /admin/register

Student:
- /dashboard
- /create-request
- /my-requests

Operations:
- /admin/dashboard
- /admin/requests
- /admin/workflows
- /admin/departments

Route behavior:
- Protected layout shell
- Role-aware redirects
- Session bootstrap via GET /api/v1/auth/me

## 4) Backend Basics
- API base: /api/v1
- Health endpoint: GET /health
- Auth header: Authorization: Bearer <JWT_TOKEN>
- Auth rate limit: 30 requests per 15 minutes on /api/v1/auth/*

## 5) Response Contract
Success:
```json
{"success": true, "message": "...", "data": {}, "meta": null}
```

Error:
```json
{"success": false, "message": "...", "errors": []}
```

## 6) Endpoint Inventory
Auth:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/admin/register
- POST /api/v1/auth/admin/login
- GET /api/v1/auth/me

Student flow:
- POST /api/v1/requests
- GET /api/v1/requests/my
- GET /api/v1/requests/:id
- PATCH /api/v1/requests/:id
- GET /api/v1/requests/:id/updates

Workflow action:
- POST /api/v1/requests/:id/action
	- action: APPROVE | REJECT | FORWARD
	- allowed roles: TEACHER, HOD, DEPARTMENT_ADMIN, SUPER_ADMIN, ADMIN

Operations:
- GET /api/v1/admin/requests
- PATCH /api/v1/admin/requests/:id/status
- PATCH /api/v1/admin/requests/:id/assign
- GET /api/v1/admin/dashboard/stats
- GET /api/v1/admin/users
- GET /api/v1/admin/departments
- POST /api/v1/admin/departments
- PATCH /api/v1/admin/departments/:id
- DELETE /api/v1/admin/departments/:id
- GET /api/v1/admin/workflows
- POST /api/v1/admin/workflows
- PATCH /api/v1/admin/workflows/:id
- DELETE /api/v1/admin/workflows/:id

## 7) Current Data Shape Highlights
User:
- role enum includes STUDENT, TEACHER, HOD, DEPARTMENT_ADMIN, SUPER_ADMIN, ADMIN
- departmentId relation

Request:
- workflowId, departmentId, currentStep, taggedTeacherId
- approvalHistory[] (actorId, role, action, remark, timestamp)

Other key models:
- RequestUpdate
- Department
- WorkflowConfig
- StudentProfile
- AdminProfile

## 8) Frontend UX Stage
- Admin request operations page includes:
	- details side drawer
	- approval timeline view
	- assign modal
	- workflow action modal
- Toast notifications are active.
- Optimistic updates are active on operations/config pages.

## 9) Environment Notes
Backend required:
- MONGODB_URI
- JWT_SECRET

Backend optional:
- NODE_ENV, PORT, JWT_EXPIRES_IN
- CORS_ORIGINS
- ADMIN_SIGNUP_KEY

Frontend optional:
- VITE_API_BASE_URL

Recent fix notes:
- CORS now accepts configured origins and localhost/127.0.0.1 dev ports.
- Admin signup now generates employeeId to avoid duplicate-null unique failures.

## 10) Quick Run
Backend:
```bash
cd backend && npm install && npm run dev
```

Frontend:
```bash
cd frontend && npm install && npm run dev
```

Seed/migrate helpers:
```bash
cd backend && npm run seed:admin
cd backend && npm run seed:db
cd backend && npm run migrate:profiles
```

## 11) Compact Prompt Block
```text
Project: Unified Student Support, Request and Grievance Management System.
Stack: Backend (Express+MongoDB+JWT+Zod), Frontend (React+Vite+Router).
Roles: STUDENT, TEACHER, HOD, DEPARTMENT_ADMIN, SUPER_ADMIN, legacy ADMIN.
Frontend routes: /login, /register, /admin/login, /admin/register, /dashboard, /create-request, /my-requests, /admin/dashboard, /admin/requests, /admin/workflows, /admin/departments.
API base: /api/v1. Health: GET /health.
Auth APIs: POST /auth/register, POST /auth/login, POST /auth/admin/register, POST /auth/admin/login, GET /auth/me.
Student APIs: POST /requests, GET /requests/my, GET /requests/:id, PATCH /requests/:id, GET /requests/:id/updates.
Workflow API: POST /requests/:id/action with APPROVE|REJECT|FORWARD.
Operations APIs: /admin/requests, /admin/dashboard/stats, /admin/users, /admin/departments, /admin/workflows (GET/POST/PATCH/DELETE as implemented).
Request enums: type(ACADEMIC|FINANCE|HOSTEL|INFRASTRUCTURE|OTHER), priority(LOW|MEDIUM|HIGH|URGENT), status(PENDING|IN_PROGRESS|RESOLVED|REJECTED).
Contracts: success { success:true,message,data,meta }, error { success:false,message,errors }.
```
