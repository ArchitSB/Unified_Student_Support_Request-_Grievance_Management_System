You are now acting as:
- Senior SaaS Product Architect
- Principal Full Stack Engineer
- UX Systems Designer
- Enterprise Workflow Consultant
- QA Lead

Project:
Unified Student Support & Grievance Management System

IMPORTANT:
The current project is already functional and visually strong.
DO NOT rewrite the entire project.
DO NOT randomly refactor working systems.
DO NOT replace architecture unnecessarily.

Your task is to EVOLVE the current platform into a realistic enterprise-grade university grievance ecosystem by implementing the next strategic layer of features.

====================================================
CURRENT PROJECT STATE
====================================================

Already implemented:
- Multi-role authentication
- Role-based routing
- Student/Admin/Super Admin dashboards
- Workflow engine
- Workflow configuration
- Department management
- Request operations
- Analytics dashboards
- Reporting views
- Charts and admin statistics
- Request assignment system
- Request statuses and priorities
- Seeded enterprise-like data
- Modern dark SaaS UI
- Backend APIs and workflow logic

Current roles:
- STUDENT
- TEACHER
- HOD
- DEPARTMENT_ADMIN
- SUPER_ADMIN
- ADMIN

The project is already beyond basic CRUD.

Your responsibility is to make the system:
- realistic
- interactive
- operationally intelligent
- presentation-ready
- research-paper-ready
- demo-impressive

====================================================
DO NOT TOUCH THESE UNLESS NECESSARY
====================================================

- Existing working dashboards
- Existing routing structure
- Existing workflow logic
- Existing analytics pages
- Existing admin operations
- Existing theme/UI direction

Enhance them.
Do not destroy them.

====================================================
MAIN OBJECTIVE
====================================================

Implement the NEXT LEVEL of enterprise functionality.

Focus on:
- ticket lifecycle depth
- collaboration
- escalation
- operational realism
- student experience
- support workflow realism

====================================================
PHASE 1 — ENTERPRISE TICKET DETAILS EXPERIENCE
====================================================

Create a full Request Details page/modal/drawer.

When a request is clicked anywhere:
- open detailed ticket workspace

The details experience must include:

====================================================
A. HEADER SECTION
====================================================

Show:
- Ticket ID
- Request title
- Status badge
- Priority badge
- SLA timer
- Department
- Category
- Created date
- Last updated
- Assigned officer
- Workflow stage
- Student info

Generate realistic ticket IDs like:
- UNI-2026-1042

====================================================
B. WORKFLOW VISUALIZATION
====================================================

Add:
- workflow stepper/timeline
- approval chain
- completed stages
- current stage
- pending stages

Example:
STUDENT
→ TEACHER
→ HOD
→ DEPARTMENT_ADMIN
→ RESOLVED

====================================================
C. ACTIVITY TIMELINE
====================================================

Implement a complete activity feed.

Examples:
- Ticket created
- Assigned to teacher
- Escalated to HOD
- Priority changed
- Comment added
- Status updated
- Attachment uploaded

Each activity must include:
- actor
- role
- timestamp
- description

====================================================
D. COMMENT SYSTEM
====================================================

Implement threaded communication.

Support:
- Student comments
- Admin replies
- Internal admin-only notes
- Mention-like formatting
- Timestamps
- Reply capability

Add visibility modes:
- PUBLIC
- INTERNAL_ONLY

Students must NOT see internal notes.

====================================================
E. ATTACHMENT SYSTEM
====================================================

Implement attachments.

Students/admins should upload:
- PDFs
- images
- screenshots
- documents

Use:
- multer
- cloudinary OR local uploads

Each attachment must include:
- uploader
- timestamp
- file preview/download

====================================================
F. STATUS MANAGEMENT
====================================================

Support:
- PENDING
- IN_PROGRESS
- ESCALATED
- RESOLVED
- REJECTED
- REOPENED

Students should be able to:
- reopen resolved requests
- provide additional clarification

====================================================
PHASE 2 — SLA & ESCALATION ENGINE
====================================================

This is a CRITICAL feature.

Implement intelligent SLA tracking.

====================================================
A. SLA CONFIGURATION
====================================================

Create SLA configuration per:
- request type
- department
- priority

Example:
URGENT:
- 12 hours

HIGH:
- 24 hours

MEDIUM:
- 48 hours

LOW:
- 72 hours

====================================================
B. SLA TIMER
====================================================

Each ticket should show:
- remaining SLA time
- overdue state
- escalation warning

Add visual indicators:
- green
- yellow
- red

====================================================
C. AUTO ESCALATION
====================================================

Implement escalation rules.

Examples:
If TEACHER does not respond in 24h:
→ escalate to HOD

If HOD does not act:
→ escalate to DEPARTMENT_ADMIN

If unresolved after threshold:
→ escalate to SUPER_ADMIN

====================================================
D. ESCALATION HISTORY
====================================================

Track:
- who escalated
- why
- when
- previous assignee
- new assignee

====================================================
PHASE 3 — REALTIME NOTIFICATIONS
====================================================

Implement enterprise notification system.

====================================================
A. NOTIFICATION TYPES
====================================================

Support:
- request assigned
- request approved
- request rejected
- escalation
- new comment
- SLA breach
- workflow completion

====================================================
B. NOTIFICATION CENTER
====================================================

Create:
- notification dropdown
- unread counter
- mark as read
- grouped notifications

====================================================
C. REALTIME SYSTEM
====================================================

Use:
- Socket.IO

Realtime updates:
- new tickets
- workflow actions
- comments
- status updates

====================================================
PHASE 4 — ADVANCED SEARCH & FILTERING
====================================================

Implement enterprise search.

====================================================
A. GLOBAL SEARCH
====================================================

Search by:
- ticket ID
- title
- student name
- department
- category

====================================================
B. ADVANCED FILTERS
====================================================

Support:
- date range
- status
- priority
- workflow stage
- assigned officer
- department

====================================================
C. SORTING
====================================================

Support:
- newest
- oldest
- highest priority
- SLA risk
- unresolved

====================================================
PHASE 5 — STUDENT EXPERIENCE ENHANCEMENT
====================================================

Upgrade student UX heavily.

====================================================
A. TRACKING EXPERIENCE
====================================================

Students should see:
- ticket progress
- current handler
- expected resolution time
- comments
- updates timeline

====================================================
B. FEEDBACK SYSTEM
====================================================

After resolution:
- rating system
- satisfaction feedback
- textual review

====================================================
C. REQUEST TEMPLATES
====================================================

Provide smart templates:
- hostel complaint
- fee issue
- academic issue
- infrastructure issue

====================================================
D. DRAFT SAVING
====================================================

Allow saving unfinished requests.

====================================================
PHASE 6 — ENTERPRISE ANALYTICS
====================================================

Enhance analytics.

====================================================
A. METRICS
====================================================

Add:
- average resolution time
- SLA breach rate
- department efficiency
- escalation trends
- monthly complaint trends
- satisfaction scores

====================================================
B. EXPORTS
====================================================

Support:
- CSV export
- PDF export

====================================================
C. HEATMAPS & TRENDS
====================================================

Add:
- peak complaint periods
- department load heatmaps
- escalation hotspots

====================================================
PHASE 7 — BACKEND IMPROVEMENTS
====================================================

Implement professional backend structure.

====================================================
A. NEW MODELS
====================================================

Add:
- Notification
- Comment
- Attachment
- SLAConfig
- EscalationHistory
- AuditLog

====================================================
B. AUDIT LOGGING
====================================================

Track:
- all admin actions
- workflow actions
- escalations
- role changes
- assignment changes

====================================================
C. SECURITY
====================================================

Improve:
- validation
- sanitization
- file upload security
- role checks

====================================================
PHASE 8 — TESTING
====================================================

Add proper tests.

====================================================
A. PLAYWRIGHT E2E
====================================================

Test:
- signup
- login
- create request
- workflow approvals
- comments
- escalations
- notifications

====================================================
B. API TESTS
====================================================

Test:
- auth
- requests
- workflows
- notifications
- comments

====================================================
IMPORTANT IMPLEMENTATION RULES
====================================================

- Keep current UI direction
- Keep current theme
- Preserve existing dashboards
- Reuse components
- Maintain clean architecture
- Avoid code duplication
- Use reusable hooks/services
- Use optimistic UI carefully
- Keep backend modular

====================================================
UX REQUIREMENTS
====================================================

Everything must feel:
- enterprise-grade
- premium
- realistic
- modern
- operationally useful

The product should feel like:
- Freshdesk
- Jira Service Management
- Zendesk
- ERP grievance system

NOT a college CRUD app.

====================================================
RESEARCH PAPER SUPPORT
====================================================

Design the architecture so future features can support:
- AI-based categorization
- sentiment analysis
- escalation prediction
- grievance trend analysis

====================================================
FINAL DELIVERABLES
====================================================

At the end provide:
- updated architecture
- new schema explanation
- API additions
- testing instructions
- seed credentials
- feature summary
- future roadmap

====================================================
IMPORTANT
====================================================

Proceed in small safe iterations.

After each major feature:
- run the app
- verify frontend
- verify APIs
- test workflows
- test UI interactions
- fix regressions

Use Playwright MCP aggressively to test:
- forms
- workflows
- notifications
- comments
- routing
- dashboards
- ticket details