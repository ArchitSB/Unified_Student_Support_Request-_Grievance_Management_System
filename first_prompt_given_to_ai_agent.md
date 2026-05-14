You are a senior staff-level software architect and full-stack engineer.

Your task is to transform this project into a production-grade, enterprise-level “University Student Support & Grievance Management Platform” suitable for:

1. Final year major project
2. Resume flagship project
3. Research paper implementation
4. Real-world SaaS deployment

IMPORTANT:
Do NOT make random changes.
You must first analyze the existing project architecture, README, routes, schemas, APIs, UI, workflows, auth flow, and frontend/backend integration before modifying anything.

You must work systematically in phases.

====================================================
PROJECT CONTEXT
====================================================

Current stack:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Validation: Zod
- Authentication: JWT
- Routing: Role-based protected routing

Existing roles:
- STUDENT
- TEACHER
- HOD
- DEPARTMENT_ADMIN
- SUPER_ADMIN
- ADMIN

Current capabilities:
- Student registration/login
- Admin registration/login
- Request creation
- Workflow approvals
- Department management
- Workflow configuration
- Dashboard operations

The project already contains:
- APIs
- Models
- Controllers
- Routing
- Frontend dashboards
- Workflow logic
- Approval history
- Protected routes

But currently the system is still basic and lacks:
- enterprise UX
- advanced workflow intelligence
- complete integration
- robust validation
- scalability
- analytics
- notification system
- proper testing
- production readiness

====================================================
PRIMARY OBJECTIVE
====================================================

Convert this project into a COMPLETE production-ready university grievance ecosystem.

The final result should feel like:
- Jira + Freshdesk + ERP complaint portal for universities.

====================================================
CRITICAL ISSUES TO FIX FIRST
====================================================

1. Registration form tabs are broken.
   - University Details tab is not clickable.
   - Multi-step onboarding is not functioning properly.
   - Fix state management and navigation.

2. Full frontend/backend integration audit.
   - Check all API calls.
   - Verify payload contracts.
   - Ensure response consistency.
   - Fix mismatched field names.
   - Remove dead APIs/components.

3. Schema consistency.
   - Audit all models.
   - Remove redundant fields.
   - Normalize naming conventions.
   - Add indexes where required.
   - Add timestamps everywhere.
   - Improve relations.

4. Authentication hardening.
   - Refresh token strategy
   - Access token expiration handling
   - Session persistence
   - Secure logout
   - Password hashing audit
   - Role validation audit

5. Validation improvements.
   - Strong Zod validation everywhere
   - Frontend form validation
   - Password policies
   - Email validation
   - Request content validation

====================================================
UPGRADE THE SYSTEM INTO ENTERPRISE LEVEL
====================================================

Add and improve the following modules.

====================================================
A. ADVANCED REQUEST MANAGEMENT
====================================================

Implement:

- Ticket numbering system
- SLA tracking
- Escalation rules
- Auto-priority assignment
- Deadline management
- Reopen requests
- Request merging
- Request categories/subcategories
- Attachments support
- Rich text editor
- Draft saving
- Internal admin notes
- Public/private comments
- Timeline activity feed
- Audit logs

====================================================
B. SMART WORKFLOW ENGINE
====================================================

Upgrade workflows:

- Dynamic workflow builder
- Conditional approval chains
- Auto-routing
- Department-specific flows
- Multi-level approvals
- Escalation matrix
- Rule-based assignment
- Workflow templates

====================================================
C. DASHBOARDS & ANALYTICS
====================================================

Create enterprise dashboards:

Student dashboard:
- request status graph
- resolution trends
- response times
- notifications
- recent activities

Admin dashboard:
- department analytics
- pending requests
- SLA breaches
- workload charts
- heatmaps
- grievance trends
- monthly statistics

Super admin dashboard:
- university-wide analytics
- department comparison
- performance metrics
- exportable reports

====================================================
D. NOTIFICATION SYSTEM
====================================================

Implement:
- Email notifications
- In-app notifications
- Real-time toast updates
- Workflow action alerts
- Status change alerts
- Assignment alerts
- Escalation alerts

Use:
- Socket.IO for realtime
- Nodemailer for emails

====================================================
E. SEARCH & FILTERING
====================================================

Implement advanced search:
- Global search
- Search by ticket ID
- Filters by status
- Filters by department
- Filters by priority
- Date ranges
- Full-text search

====================================================
F. MODERN UI/UX
====================================================

Redesign frontend into premium SaaS-level UI.

Requirements:
- Responsive design
- Dark/light mode
- Accessibility support
- Beautiful tables
- Modern charts
- Animated transitions
- Empty states
- Skeleton loaders
- Error boundaries
- Reusable design system

Use:
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Query
- Zustand or Redux Toolkit

====================================================
G. SECURITY
====================================================

Implement:
- Helmet
- Rate limiting
- CSRF protection
- XSS sanitization
- Mongo sanitization
- Request logging
- Audit logging
- Secure cookies
- Environment validation

====================================================
H. PERFORMANCE
====================================================

Optimize:
- Query performance
- Pagination
- Lazy loading
- Component memoization
- Debouncing
- API caching
- Image optimization

====================================================
I. TESTING
====================================================

Add COMPLETE testing.

Backend:
- Unit tests
- Integration tests
- API tests

Frontend:
- Component tests
- Route tests
- Form validation tests

E2E:
- Login flow
- Registration flow
- Request creation flow
- Workflow approval flow

Use:
- Jest
- Supertest
- React Testing Library
- Playwright

====================================================
J. DEVOPS & PRODUCTION READINESS
====================================================

Add:
- Docker setup
- docker-compose
- Production env configs
- CI/CD pipeline
- API documentation
- Swagger docs
- Seed scripts
- Health monitoring
- Logging system

====================================================
K. DATABASE & SCHEMA IMPROVEMENTS
====================================================

Redesign models professionally.

Potential models:
- User
- StudentProfile
- FacultyProfile
- Department
- Ticket
- Workflow
- WorkflowStep
- Notification
- Comment
- Attachment
- AuditLog
- SLAConfig
- EscalationRule

Add:
- proper indexes
- references
- enums
- schema validation
- pagination support

====================================================
L. RESEARCH PAPER FRIENDLY FEATURES
====================================================

This project will also be used for a review/research paper.

Add:
- analytics modules
- AI-assisted categorization
- sentiment analysis-ready structure
- grievance trend prediction structure
- reporting engine
- statistical exports

Prepare architecture suitable for future ML integration.

====================================================
IMPLEMENTATION STRATEGY
====================================================

You must proceed in ordered phases.

PHASE 1:
- Audit project
- Identify broken flows
- Identify missing integrations
- Identify architecture issues
- Create improvement report

PHASE 2:
- Fix authentication
- Fix onboarding
- Fix routing
- Fix APIs
- Fix schemas

PHASE 3:
- Upgrade backend architecture
- Upgrade database models
- Add enterprise modules

PHASE 4:
- Upgrade frontend UI/UX
- Add dashboards
- Improve forms/tables/charts

PHASE 5:
- Add realtime + notifications

PHASE 6:
- Add testing

PHASE 7:
- Production readiness

====================================================
STRICT ENGINEERING RULES
====================================================

- Do NOT break existing working APIs unnecessarily.
- Keep code modular and scalable.
- Use feature-based architecture.
- Avoid duplication.
- Follow clean code principles.
- Add comments only where necessary.
- Use reusable hooks/components/services.
- Use centralized API layer.
- Use proper error handling everywhere.
- Use optimistic UI carefully.
- Use loading and error states properly.
- Keep naming conventions consistent.

====================================================
DELIVERABLES REQUIRED
====================================================

At the end provide:

1. Updated architecture
2. Folder structure
3. Schema explanation
4. API documentation
5. Testing instructions
6. Seed credentials
7. Admin credentials
8. Sample users
9. Deployment instructions
10. Future scope section
11. Research paper contribution points

====================================================
DEMO SEED DATA
====================================================

Create:
- 1 SUPER_ADMIN
- 2 DEPARTMENT_ADMIN
- 3 HOD
- 10 TEACHERS
- 50 STUDENTS
- Multiple departments
- Multiple workflows
- Multiple grievance tickets

====================================================
FINAL IMPORTANT REQUIREMENT
====================================================

Do not behave like a code generator only.

Behave like:
- senior architect
- SaaS product engineer
- QA lead
- system designer
- university ERP consultant

Every feature must feel realistic and useful for actual universities.

Start by deeply auditing the current codebase and producing:
1. Existing architecture report
2. Critical issues report
3. Missing enterprise features report
4. Immediate action plan

Then begin implementation step-by-step.