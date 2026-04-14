# Advanced System Plan

## Roles
- STUDENT
- TEACHER
- HOD
- DEPARTMENT_ADMIN
- SUPER_ADMIN

## Core Features
- Multi-level approval workflow
- Department-based routing
- Request escalation
- Timeline tracking
- Role-based dashboards
- Profile system
- Request comments
- Analytics

## Workflow Examples

### Academic Request
Student → Teacher → HOD → Approved

### Finance Request
Student → Finance Admin → Resolved

## New Models Needed
- Department
- WorkflowConfig
- RequestComments
- AssignmentLogs

## Key Enhancements
- Tag teacher in request
- Auto-routing based on department
- Escalation logic
- Approval chain tracking