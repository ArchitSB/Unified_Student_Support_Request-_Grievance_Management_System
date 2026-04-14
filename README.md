# Unified Student Support, Request and Grievance Management System

This repository contains a full-stack grievance and support request platform with:

- Backend API: Node.js, Express, MongoDB, JWT auth
- Frontend app: React (Vite), role-based UI for Student and Admin

The project is now connected end-to-end across auth, student request workflows, and admin management workflows.

## 1. Current Functional Scope

### Frontend (Implemented)

- Auth:
	- Student register
	- Login (Student/Admin)
	- Persisted session with token in localStorage
	- Bootstrapped profile via GET /auth/me on refresh
- Route protection:
	- Private routes behind auth
	- Role-based access for STUDENT and ADMIN pages
	- Automatic redirect based on role
- Student features:
	- Dashboard with live metrics (total, pending+in-progress, resolved)
	- Recent activity from latest requests
	- Create request (title, description, type, priority)
	- List/filter/search own requests
- Admin features:
	- Dashboard summary stats (open, unassigned, SLA breaches, resolved today)
	- Urgent queue from backend
	- Full request listing with filters
	- Update request status
	- Assign request to admin user
- Shared layout:
	- Role-aware sidebar links
	- Navbar user profile and logout
	- Theme toggle support (light/dark)

### Backend (Implemented)

- Health endpoint
- Auth module:
	- Register student
	- Register admin (with admin signup key)
	- Login
	- Admin login
	- Current user profile
- Student request module:
	- Create request
	- List own requests with pagination/filter/search
	- Request details
	- Update own request (only when status is PENDING)
	- Request timeline/activity updates
- Admin module:
	- List all requests with pagination/filter/search
	- Update request status
	- Assign request to admin
	- Dashboard stats + urgent queue
	- List assignable admin users
- Security and reliability:
	- JWT bearer auth middleware
	- Role authorization middleware
	- Zod validation middleware
	- Auth rate limiting
	- Centralized error handling

## 2. Project Structure

- backend: Express API, MongoDB models, services, controllers, routes
- frontend: React app with role-based pages and API client

Key directories:

- backend/routes
- backend/controllers
- backend/services
- backend/models
- backend/validators
- frontend/src/pages
- frontend/src/context
- frontend/src/lib

## 3. Backend API Reference

Base URL:

- http://localhost:5000/api/v1

Health:

- GET /health

Auth header for protected endpoints:

- Authorization: Bearer <JWT_TOKEN>

### 3.1 Response Contracts

Success response shape:

```json
{
	"success": true,
	"message": "...",
	"data": {},
	"meta": null
}
```

Error response shape:

```json
{
	"success": false,
	"message": "...",
	"errors": []
}
```

Validation errors return status 400 with field/path details in errors.

### 3.2 Auth Endpoints

Rate-limited under /api/v1/auth (30 requests per 15 minutes per client).

1. POST /api/v1/auth/register
- Access: Public
- Body:

```json
{
	"name": "Student Name",
	"email": "student@university.edu",
	"password": "StrongPass123",
	"department": "Computer Science",
	"universityId": "U2023001",
	"batch": "2023-2027"
}
```

- Notes:
	- Creates STUDENT role only.
	- Returns auth token and user object.

2. POST /api/v1/auth/login
- Access: Public
- Body:

```json
{
	"email": "student@university.edu",
	"password": "StrongPass123"
}
```

- Returns auth token and user object.

3. POST /api/v1/auth/admin/register
- Access: Public (guarded with signup key)
- Body:

```json
{
	"name": "Admin User",
	"email": "admin@university.edu",
	"password": "StrongPass123",
	"department": "Support Operations",
	"adminSignupKey": "<ADMIN_SIGNUP_KEY>"
}
```

- Notes:
	- Creates ADMIN role users.
	- Requires backend ADMIN_SIGNUP_KEY configuration.

4. POST /api/v1/auth/admin/login
- Access: Public
- Body:

```json
{
	"email": "admin@university.edu",
	"password": "StrongPass123"
}
```

- Notes:
	- Fails if account is not ADMIN.

5. GET /api/v1/auth/me
- Access: Authenticated (STUDENT or ADMIN)
- Returns current user profile from token.

### 3.3 Student Request Endpoints

All endpoints below require:

- Authenticated user
- Role: STUDENT

1. POST /api/v1/requests
- Create a request
- Body:

```json
{
	"title": "Hostel internet issue",
	"description": "Detailed issue description...",
	"type": "HOSTEL",
	"priority": "HIGH",
	"attachments": []
}
```

2. GET /api/v1/requests/my
- List own requests
- Query params:
	- page (default 1)
	- limit (default 10, max 100)
	- status: PENDING | IN_PROGRESS | RESOLVED | REJECTED
	- type: ACADEMIC | FINANCE | HOSTEL | INFRASTRUCTURE | OTHER
	- search (full text on title/description)

3. GET /api/v1/requests/:id
- Get one own request by id

4. PATCH /api/v1/requests/:id
- Update own request
- Allowed only while request status is PENDING
- Body fields (all optional):

```json
{
	"title": "Updated title",
	"description": "Updated description",
	"type": "ACADEMIC",
	"priority": "MEDIUM"
}
```

5. GET /api/v1/requests/:id/updates
- Get timeline entries for a request
- Timeline action values:
	- CREATED
	- UPDATED
	- ASSIGNED
	- STATUS_CHANGED

### 3.4 Admin Endpoints

All endpoints below require:

- Authenticated user
- Role: ADMIN

1. GET /api/v1/admin/requests
- List all requests
- Query params:
	- page (default 1)
	- limit (default 20, max 100)
	- status
	- type
	- priority: LOW | MEDIUM | HIGH | URGENT
	- assignee (admin user ObjectId)
	- search

2. PATCH /api/v1/admin/requests/:id/status
- Update request status
- Body:

```json
{
	"status": "IN_PROGRESS"
}
```

3. PATCH /api/v1/admin/requests/:id/assign
- Assign request to admin user
- Body:

```json
{
	"assignedTo": "<ADMIN_USER_OBJECT_ID>"
}
```

4. GET /api/v1/admin/dashboard/stats
- Returns:
	- summary.openTickets
	- summary.unassigned
	- summary.slaBreaches
	- summary.resolvedToday
	- urgentQueue[]

5. GET /api/v1/admin/users
- Returns active ADMIN users for assignment workflows.

## 4. Data Models (Current)

### User

- name
- email (unique)
- passwordHash
- role: STUDENT | ADMIN
- department
- isActive
- createdAt, updatedAt

### Request

- studentId (User)
- title
- description
- type: ACADEMIC | FINANCE | HOSTEL | INFRASTRUCTURE | OTHER
- priority: LOW | MEDIUM | HIGH | URGENT
- status: PENDING | IN_PROGRESS | RESOLVED | REJECTED
- assignedTo (User or null)
- attachments (array of URL strings)
- createdAt, updatedAt

### RequestUpdate

- requestId
- actorId
- action: CREATED | UPDATED | ASSIGNED | STATUS_CHANGED
- meta (mixed)
- createdAt

### StudentProfile

- userId (User, unique)
- universityId (unique, nullable)
- department
- program
- batch
- semester
- phone
- isVerified

### AdminProfile

- userId (User, unique)
- employeeId (unique, nullable)
- department
- designation
- permissions[]
- isSuperAdmin

## 5. Frontend Routes

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

Unknown routes redirect to role-specific default page (or /login if unauthenticated).

## 6. Frontend API Client Map

Implemented in frontend/src/lib/api.js.

authApi:

- register(payload)
- login(payload)
- adminRegister(payload)
- adminLogin(payload)
- getMe()

studentApi:

- createRequest(payload)
- listMyRequests(query)
- getRequestById(id)
- updateRequest(id, payload)
- getRequestUpdates(id)

adminApi:

- listRequests(query)
- updateStatus(id, status)
- assignRequest(id, assignedTo)
- getDashboardStats()
- listAdmins()

## 7. Environment Variables

### Backend required

- MONGODB_URI
- JWT_SECRET

### Backend optional

- NODE_ENV (default: development)
- PORT (default: 5000)
- JWT_EXPIRES_IN (default: 7d)
- ADMIN_SIGNUP_KEY (required for admin register endpoint)
- CORS_ORIGINS (comma-separated, default: http://localhost:5173)
- ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_DEPARTMENT (for seeding)

### Frontend

- VITE_API_BASE_URL (default: http://localhost:5000/api/v1)

## 8. Local Run Commands

Backend:

```bash
cd backend
npm install
npm run dev
```

Seed admin (optional but recommended):

```bash
cd backend
npm run seed:admin
```

Seed full database (admin + students + profiles + requests + timelines):

```bash
cd backend
npm run seed:db
```

Backfill profile schemas for pre-existing users:

```bash
cd backend
npm run migrate:profiles
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 9. AI Context Pack (Copy for New Chats)

Use this block as prompt context for any new AI model:

```text
Project: Unified Student Support, Request and Grievance Management System
Stack: Backend (Express + MongoDB + JWT + Zod), Frontend (React + Vite + React Router)
Roles: STUDENT, ADMIN

Frontend routes:
- Public: /login, /register, /admin/login, /admin/register
- Student: /dashboard, /create-request, /my-requests
- Admin: /admin/dashboard, /admin/requests

Backend base URL: /api/v1
Global health: GET /health

Auth endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/admin/register
- POST /auth/admin/login
- GET /auth/me

Student endpoints (require STUDENT):
- POST /requests
- GET /requests/my
- GET /requests/:id
- PATCH /requests/:id
- GET /requests/:id/updates

Admin endpoints (require ADMIN):
- GET /admin/requests
- PATCH /admin/requests/:id/status
- PATCH /admin/requests/:id/assign
- GET /admin/dashboard/stats
- GET /admin/users

Request enums:
- type: ACADEMIC, FINANCE, HOSTEL, INFRASTRUCTURE, OTHER
- priority: LOW, MEDIUM, HIGH, URGENT
- status: PENDING, IN_PROGRESS, RESOLVED, REJECTED

Response shapes:
- Success: { success: true, message, data, meta }
- Error: { success: false, message, errors }
```

