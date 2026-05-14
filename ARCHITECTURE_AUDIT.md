# Architecture Audit

## Current Architecture

- Frontend:
  - React + Vite single-page app
  - Context-based auth state in `frontend/src/context/AuthContext.jsx`
  - Custom fetch wrapper in `frontend/src/lib/api.js`
  - Role-based routing in `frontend/src/App.jsx` and `frontend/src/components/ProtectedRoute.jsx`
- Backend:
  - Express API mounted under `/api/v1`
  - JWT bearer auth in `backend/middelwares/auth.js`
  - Zod request validation in `backend/middelwares/validateRequest.js`
  - Mongoose models for `User`, `StudentProfile`, `AdminProfile`, `Department`, `Request`, `WorkflowConfig`, `RequestUpdate`
- Data model pattern:
  - `User` stores identity, role, and optional `departmentId`
  - Profile collections store role-specific attributes
  - `Request` stores workflow state, approval history, and assignment

## Existing Strengths

- Centralized API success and error envelope is already in place.
- Role-based request access rules are implemented server-side.
- Workflow progression and approval history exist instead of being UI-only.
- Department and workflow configuration have usable CRUD foundations.
- Basic security middleware already exists: `helmet`, rate limiting, JWT checks.

## Critical Issues

### 1. Broken student onboarding UX

- `frontend/src/pages/auth/Register.jsx` renders step labels as static blocks only.
- There is no active-step state, no tab click handler, and no next/back flow.
- Result: "University Details" appears like a tab but is not interactive.

### 2. Department relation is broken during registration

- Student registration sends `department` as free text, not `departmentId`.
- Admin registration also sends `department` as free text, not `departmentId`.
- Backend auth services store that text on profile records, but workflow scoping depends on `User.departmentId`.
- Result:
  - newly registered students cannot auto-route requests cleanly
  - newly registered admins may pass authentication but fail department-scoped operations

### 3. Auth is access-token only

- No refresh token endpoint exists.
- No logout endpoint exists.
- Frontend logs out immediately when `/auth/me` fails.
- Result: token expiry produces brittle UX and no controlled session lifecycle.

### 4. Request lifecycle rules are inconsistent

- `backend/services/request.service.js` creates new requests with `status: 'IN_PROGRESS'`.
- The same service only allows student edits when `status === 'PENDING'`.
- Result: newly created requests are effectively not editable by students.

### 5. Frontend-backend contract drift

- Frontend docs still mention Axios, but implementation uses native `fetch`.
- README claims registration and contracts are fully upgraded, but current onboarding does not support department linkage.
- Super-admin pages reuse admin APIs in ways that are functional but not cleanly separated.

### 6. Schema consistency gaps

- `User.department` and profile `department` duplicate denormalized department names.
- `RequestComment` exists but is not integrated into routes/services/UI.
- No ticket identifier exists on `Request`, making operational tracking weak.
- Auth/session persistence is not modeled in the database.

## Missing Enterprise Features

- No refresh-token session store
- No notification subsystem
- No audit log entity
- No SLA configuration or breach tracking model
- No ticket numbering
- No attachments pipeline
- No comment visibility model
- No real analytics backend beyond simple aggregates
- No test suite
- No Docker, CI, Swagger, or production logging strategy

## Immediate Action Plan

### Phase 2 now

1. Fix student multi-step onboarding and make step tabs interactive.
2. Add department metadata endpoint for registration forms.
3. Save `departmentId` during student/admin registration while preserving display names.
4. Add stronger password validation and frontend field-level validation.
5. Introduce refresh and logout auth endpoints plus client retry flow.
6. Fix request editability mismatch by aligning create/update lifecycle behavior.

### Next after this slice

1. Introduce ticket IDs, audit logs, notifications, and comments.
2. Refactor request/workflow models for SLA, escalation, and analytics.
3. Migrate frontend to centralized query/state architecture.
4. Add tests, seed expansion, API docs, Docker, and CI/CD.
