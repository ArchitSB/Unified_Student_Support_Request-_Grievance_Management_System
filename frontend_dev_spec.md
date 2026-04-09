# FRONTEND DEVELOPMENT SPEC

## 1. Tech Stack
- React (Vite)
- Tailwind CSS
- React Router
- Axios

---

## 2. Routes

Public Routes:
- /login
- /register

Student Routes:
- /dashboard
- /create-request
- /my-requests

Admin Routes:
- /admin/dashboard
- /admin/requests

---

## 3. Layout Structure

App Layout:
- Sidebar (left)
- Navbar (top)
- Main content

---

## 4. Components Breakdown

### Layout Components
- Sidebar
- Navbar

### UI Components
- Card
- Table
- Form
- Input
- Button
- Modal
- StatusBadge

---

## 5. Pages

### Login Page
- Email input
- Password input
- Login button

### Register Page
- Name
- Email
- Password

### Student Dashboard
- 3 stat cards
- Recent requests list

### Create Request Page
- Title input
- Description textarea
- Type dropdown
- Submit button

### My Requests Page
- Table with:
  - title
  - type
  - status
  - created date

### Admin Dashboard
- 4 stat cards
- Requests overview table

### Admin Requests Page
- Table with:
  - student name
  - type
  - status
  - actions (approve/reject)

---

## 6. State Management

- Store user info (role, token)
- Store requests list
- Use context or simple state

---

## 7. API Integration (PLACEHOLDER)

- POST /login
- POST /register
- GET /requests
- POST /requests
- PATCH /requests/:id

---

## 8. UI Rules

- Use Tailwind
- Dark mode support
- Responsive layout
- Clean spacing

---

## 9. Notes

- Follow FRONTEND_SPEC.md for design
- Do not change structure
- Keep components reusable