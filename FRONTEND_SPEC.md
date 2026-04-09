# Unified Student Support, Request & Grievance Management System
## Frontend Specification

---

## 1. App Overview

**Purpose**
The Unified Student Support System is a centralized SaaS platform designed to streamline and manage student requests, inquiries, and grievances. It provides transparency, accountability, and an efficient resolution workflow between students and the university administration.

**User Roles**
- **Student**: Can submit requests/grievances, track their status in real-time, message support staff, and view their history.
- **Admin (Support Staff/Faculty)**: Can review, triage, re-assign, and resolve requests. Has access to global analytics and priority queues.

---

## 2. Global Layout

**Sidebar Structure**
- A persistent, collapsible left-hand sidebar for primary navigation.
- Includes core links (Dashboard, Requests, Settings) and a bottom-anchored "Logout" button.
- Displays an active state indicator (highlight or vertical line) for the current route.

**Navbar Structure**
- A top horizontal bar containing a global search input (`cmd+k` quick search), notification bell (with unread badge indicator), and user profile dropdown.
- Breadcrumbs indicating the current page path (e.g., *Home / Requests / View Request*).

**Main Layout Behavior**
- **Desktop**: Fixed sidebar and top navbar, with the main content area functioning as a scrollable container.
- **Mobile/Tablet**: The sidebar is hidden behind a hamburger menu trigger in the navbar, opening via an off-canvas slide-out animation.

---

## 3. Pages

### Login Page
- **Purpose**: Authenticate users into the system.
- **Layout Structure**: Split layout. Left side contains the login form centrally aligned. Right side features a subtle 3D background visualization and branding.
- **Components Used**: Form, Inputs, Button, Visual Background.

### Register Page
- **Purpose**: Onboard new students.
- **Layout Structure**: Similar to the Login page, but with a multi-step form (Personal Info -> University Details -> Password).
- **Components Used**: Form, Inputs, Button, Stepper/Progress Indicator.

### Student Dashboard
- **Purpose**: A personalized bird's-eye view of the student's current standing and activities.
- **Layout Structure**: Top row with summary metric cards. Below, a two-column layout: left column for "Recent Updates/Activity", right column for "Quick Actions" and "Important Announcements".
- **Components Used**: Card, List Item, Button, Status Badge.

### Create Request Page
- **Purpose**: Submit a new grievance or support ticket.
- **Layout Structure**: Focused, single-column centered container to minimize distractions.
- **Components Used**: Form (File Upload, Textarea, Select Dropdown), Card, Button.

### My Requests Page
- **Purpose**: Allow students to browse and filter their submitted items.
- **Layout Structure**: Full-width page header with a "Create New" CTA. Below, a comprehensive data table with filters (Status, Category, Date).
- **Components Used**: Table, Pagination, Status Badge, Filter Dropdowns, Search Input.

### Admin Dashboard
- **Purpose**: Provide staff with an operational overview to identify bottlenecks and urgent issues.
- **Layout Structure**: Top row of aggregate statistic cards (Open, Overdue, Resolved Today). Middle row featuring a chart (Requests across departments). Bottom row showing the "Action Needed" urgent queue.
- **Components Used**: Card, Chart Container, Table, Status Badge.

### All Requests Page
- **Purpose**: Primary workspace for Admins to view, assign, and manage all system requests.
- **Layout Structure**: Full-width dense data view. Top bar containing robust filtering (Assignee, Priority, Department).
- **Components Used**: Table (with inline actions), Status Badge, Modal (for quick view/assignment), Pagination.

---

## 4. Components

### Sidebar
- **Purpose**: Primary system navigation.
- **Props**: `links` (array of objects), `isCollapsed` (boolean).
- **Behavior**: Collapses horizontally to show only icons. Hovering over icons in collapsed state shows a tooltip.

### Navbar
- **Purpose**: Contextual information and global actions.
- **Props**: `user` (object), `notificationsCount` (number), `breadcrumbs` (array).
- **Behavior**: Sticks to the top of the viewport. Globals search opens a command palette overlay.

### Card
- **Purpose**: Container for discrete pieces of content or metrics.
- **Props**: `title` (string), `subtitle` (string), `children` (ReactNode), `hoverable` (boolean).
- **Behavior**: If `hoverable` is true, slight Y-axis translation and shadow increase on hover.

### Table
- **Purpose**: Display dense lists of requests.
- **Props**: `columns` (array), `data` (array), `isLoading` (boolean), `onRowClick` (function).
- **Behavior**: Maintains sticky headers while scrolling vertically. Shows empty state if no data.

### Form (Input, Textarea, Select)
- **Purpose**: Data capture from the user.
- **Props**: `label` (string), `error` (string), `required` (boolean), `placeholder` (string).
- **Behavior**: Highlights red on error, displays error message below the field. Blue focus ring on active state.

### Modal
- **Purpose**: Secondary workflows (e.g., confirming deletion, assigning a ticket) without leaving the context.
- **Props**: `isOpen` (boolean), `onClose` (function), `title` (string).
- **Behavior**: Appears with a fade-in backdrop. Focus is trapped inside the modal until closed. Esc key closes modal.

### Status Badge
- **Purpose**: At-a-glance visualization of a request's state.
- **Props**: `status` (enum: 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED').
- **Behavior**: Renders different colors based on status (e.g., Yellow for Pending, Blue for In Progress, Green for Resolved).

---

## 5. UI Design System

**Typography Style**
- **Primary Font**: `Inter` or `Plus Jakarta Sans` for clean, highly legible SaaS UI.
- **Headings**: Semi-bold (600), tight letter spacing (-0.02em).
- **Body**: Regular (400), readable line-height (1.5).

**Color Palette**
- **Brand Primary**: Indigo (#4F46E5) – Used for primary buttons and active states.
- **Neutral Background (Light)**: Slate 50 (#F8FAFC) for canvas, White (#FFFFFF) for elements.
- **Neutral Background (Dark)**: Slate 900 (#0F172A) for canvas, Slate 800 (#1E293B) for elements.
- **Semantic Colors**: 
  - Success: Emerald (#10B981)
  - Warning: Amber (#F59E0B)
  - Danger: Rose (#EF4444)

**Spacing System**
- Baseline grid of `4px` (`0.25rem`).
- Common spacing: `8px` (xs), `16px` (sm), `24px` (md), `32px` (lg), `48px` (xl).

**Border Radius & Shadows**
- **Radii**: `4px` for inputs/buttons, `8px` to `12px` for cards and modals.
- **Shadows**: Soft, multi-layered shadows. 
  - *Base*: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
  - *Hover*: `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`

---

## 6. UX & Interactions

- **Hover States**: Interactive elements (buttons, links, row items) must have a subtle background color shift (e.g., `slate-100` to `slate-200`) and cursor change.
- **Loading States**: Use "Skeleton" pulsating shapes instead of basic spinners for full-page loads or table data fetching to improve perceived performance.
- **Form Validation Behavior**: "Lazy" validation. Show error states only *after* the user submits or blurs a field they have interacted with.
- **Smooth Transitions**: All state changes (hover, focus, toggles) should utilize a `150ms ease-in-out` CSS transition.

---

## 7. Dashboard Design

**Student Dashboard Layout**
- **Top Metrics**: 3 Cards showing "Total Requests", "Pending Action", "Resolved".
- **Main Area**: A "Recent Activity" timeline list showing the 5 most recent updates on their requests.
- **Side Panel**: A card containing a direct "Submit New Grievance" button and "Support Guidelines".

**Admin Dashboard Layout**
- **Top Metrics**: 4 Cards showing "Open Tickets", "Unassigned", "SLA Breaches", "Resolved Today".
- **Main Area**: A high-density table view of "Urgent / Escalated Requests" requiring immediate attention.
- **Side Panel**: Donut chart visualizing "Requests by Department" or "Requests by Category" for a quick workload overview.

---

## 8. Theme

- **Light Mode**: High contrast text on bright, airy backgrounds. Elements use soft drop shadows to establish visual hierarchy and depth.
- **Dark Mode**: Low-strain palette using deep slate tones. Elements rely on slight background color lightening (borders and surfaces) rather than heavy drop shadows to denote elevation.
- **Toggle Behavior**: App should default to system preference (`prefers-color-scheme`), with a manual override toggle in the sidebar or navbar that persists choice in `localStorage`.

---

## 9. 3D & Visual Enhancements

- **Purpose**: Elevate the UI beyond a standard template without harming performance or usability.
- **Login/Register Hero Area**: Implement a highly optimized, subtle Three.js canvas in the background of the auth screens. Suggestion: A slow-rotating, abstract wireframe sphere or gentle "wave" particles in the brand's Indigo color. It should feel premium, ambient, and non-distracting.
- **Decorative Elements**: Occasional use of "Glassmorphism" (backdrop blur with slight white border) on floating UI elements like toast notifications or the navbar.
- **Constraints**: 3D elements will be restricted entirely to marketing/auth pages. Inside the actual dashboard application, strict 2D performance will be maintained. No heavy WebGL inside the admin tables.

---

## 10. Notes

- **Keep UI Minimal and Professional**: Prioritize white space. Let the data breathe. Do not crowd the screen with unnecessary borders.
- **Inspiration**: Look to modern SaaS products like Linear, Vercel, or Stripe dashboards for aesthetic and interaction cues.
- **Avoid Overdesign**: If an element doesn't serve a clear functional purpose, remove it.
- **Usability First**: Ensure high color contrast for text, large enough clickable areas (min 44px height for mobile), and full keyboard tab-navigation support. Visuals should support the workflow, not impede it.
