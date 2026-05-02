# 🤖 Claude Code Prompts - Team Task Manager

## How to Use This Guide

Copy each prompt below and paste it into Claude Code (or Kimi) **in order**. Complete one phase before moving to the next.

---

## 📁 PHASE 1: Backend Project Setup

### Prompt 1.1: Initialize Backend Project

```
I'm building a Team Task Manager application with Docker. I have the following structure:

task-manager/
├── backend/
├── frontend/
├── docker-compose.yml
└── Docker files

Initialize the backend Node.js project with TypeScript in the backend/ folder:

1. Create package.json with these dependencies:
   - express, @types/express
   - prisma, @prisma/client
   - bcrypt, @types/bcrypt
   - jsonwebtoken, @types/jsonwebtoken
   - cors, @types/cors
   - dotenv
   - zod (for validation)
   - typescript, ts-node, nodemon (dev dependencies)

2. Create tsconfig.json with proper TypeScript configuration for Node.js

3. Create .env file with:
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskmanager"
   JWT_SECRET="dev-secret-change-in-production"
   PORT=5000
   NODE_ENV="development"

4. Create basic folder structure:
   backend/
   ├── src/
   │   ├── index.ts
   │   ├── controllers/
   │   ├── routes/
   │   ├── middleware/
   │   ├── utils/
   │   └── types/
   ├── prisma/
   └── package.json

5. Add scripts to package.json:
   - "dev": "nodemon src/index.ts"
   - "build": "tsc"
   - "start": "node dist/index.js"

Create all these files and set up the basic Express server in src/index.ts with CORS and basic middleware.
```

---

### Prompt 1.2: Create Prisma Schema

```
Create the complete Prisma schema for the Team Task Manager in prisma/schema.prisma with these models:

1. User model:
   - id (String, @id, @default(uuid()))
   - email (String, @unique)
   - password (String)
   - name (String)
   - role (Enum: ADMIN, MEMBER)
   - createdAt, updatedAt

2. Project model:
   - id (String, @id, @default(uuid()))
   - name (String)
   - description (String?)
   - ownerId (String, references User)
   - status (Enum: ACTIVE, ARCHIVED, COMPLETED)
   - createdAt, updatedAt

3. ProjectMember model (many-to-many relationship):
   - id (String, @id, @default(uuid()))
   - projectId (String, references Project)
   - userId (String, references User)
   - role (Enum: ADMIN, MEMBER)
   - joinedAt (DateTime)
   - @@unique([projectId, userId])

4. Task model:
   - id (String, @id, @default(uuid()))
   - title (String)
   - description (String?)
   - projectId (String, references Project)
   - assignedToId (String?, references User)
   - createdById (String, references User)
   - status (Enum: TODO, IN_PROGRESS, REVIEW, DONE)
   - priority (Enum: LOW, MEDIUM, HIGH, URGENT)
   - dueDate (DateTime?)
   - createdAt, updatedAt

Set up all the proper relations between models. Use PostgreSQL as the datasource provider.
```

---

## 🔐 PHASE 2: Authentication System

### Prompt 2.1: Create Authentication Utilities

```
Create authentication utilities in the backend:

1. Create src/utils/password.ts:
   - hashPassword(password: string): Promise<string> using bcrypt
   - comparePassword(password: string, hash: string): Promise<boolean>

2. Create src/utils/jwt.ts:
   - generateToken(userId: string): string
   - verifyToken(token: string): { userId: string } | null

3. Create src/middleware/auth.ts:
   - authenticateToken middleware that:
     * Extracts JWT from Authorization header (Bearer token)
     * Verifies token
     * Attaches user to req.user
     * Returns 401 if invalid

4. Create src/middleware/roleCheck.ts:
   - requireRole(...roles: string[]) middleware that checks if authenticated user has required role

5. Create src/types/express.d.ts to extend Express Request type with user property

Make sure all utilities have proper error handling and TypeScript types.
```

---

### Prompt 2.2: Create Auth Controller and Routes

```
Create the authentication system:

1. Create src/controllers/authController.ts with:
   - signup(req, res): 
     * Validate email and password (min 8 chars)
     * Check if email exists
     * Hash password
     * Create user with default MEMBER role
     * Return user (without password) and JWT token
   
   - login(req, res):
     * Validate credentials
     * Check user exists
     * Compare password
     * Return user and JWT token
   
   - getCurrentUser(req, res):
     * Get current authenticated user
     * Return user details (no password)

2. Create src/routes/authRoutes.ts with:
   - POST /api/auth/signup
   - POST /api/auth/login
   - GET /api/auth/me (protected)

3. Update src/index.ts to use authRoutes

Add proper error handling, validation (using Zod), and return appropriate HTTP status codes.
```

---

## 📊 PHASE 3: Project Management

### Prompt 3.1: Create Project Controller

```
Create the project management system in backend:

1. Create src/controllers/projectController.ts with these functions:

   - createProject(req, res):
     * Authenticated user only
     * Create project with current user as owner
     * Automatically add owner to ProjectMember as ADMIN
     * Return created project

   - getAllProjects(req, res):
     * Get all projects where user is owner or member
     * Include member count
     * Return projects

   - getProjectById(req, res):
     * Get single project details
     * Check if user is member
     * Include all members with their roles
     * Include task count by status
     * Return 403 if user is not a member

   - updateProject(req, res):
     * Only project ADMIN can update
     * Update name, description, status
     * Return updated project

   - deleteProject(req, res):
     * Only owner can delete
     * Delete project and all related data (cascade)
     * Return success message

2. Create src/routes/projectRoutes.ts with all necessary routes

3. Add authorization checks for each endpoint

Use Prisma Client for all database operations and include proper error handling.
```

---

### Prompt 3.2: Create Team Management in Projects

```
Add team management functionality to the project controller:

1. In src/controllers/projectController.ts, add:

   - getProjectMembers(req, res):
     * Get all members of a project
     * Include user details (name, email, role)
     * Only project members can view

   - addProjectMember(req, res):
     * Only project ADMIN can add members
     * Add user to project with specified role (ADMIN or MEMBER)
     * Validate user exists
     * Check if user is already a member
     * Return added member

   - removeProjectMember(req, res):
     * Only project ADMIN can remove members
     * Cannot remove project owner
     * Remove user from project
     * Return success message

   - updateMemberRole(req, res):
     * Only project ADMIN can update roles
     * Cannot change owner's role
     * Update member role
     * Return updated member

2. Add these routes to projectRoutes:
   - GET /api/projects/:id/members
   - POST /api/projects/:id/members
   - DELETE /api/projects/:id/members/:userId
   - PATCH /api/projects/:id/members/:userId/role

Include proper authorization and validation.
```

---

## ✅ PHASE 4: Task Management

### Prompt 4.1: Create Task Controller

```
Create the task management system:

1. Create src/controllers/taskController.ts with:

   - createTask(req, res):
     * Only project members can create tasks
     * Validate required fields (title, projectId)
     * Set createdById to current user
     * Optional: assignedToId, description, priority, dueDate
     * Default status: TODO
     * Return created task

   - getAllTasks(req, res):
     * Get tasks with filtering:
       - By projectId (required or optional)
       - By status
       - By assignedToId
       - By priority
       - Overdue tasks
     * Only return tasks from projects user is member of
     * Include assignee and creator details
     * Return tasks array

   - getTaskById(req, res):
     * Get single task details
     * Include full project, assignee, and creator info
     * Check if user has access to task's project
     * Return task

   - updateTask(req, res):
     * Task creator, assignee, or project admin can update
     * Update title, description, priority, dueDate
     * Return updated task

   - updateTaskStatus(req, res):
     * Change task status (TODO → IN_PROGRESS → REVIEW → DONE)
     * Return updated task

   - assignTask(req, res):
     * Project admin or task creator can assign
     * Validate assignee is project member
     * Update assignedToId
     * Return updated task

   - deleteTask(req, res):
     * Task creator or project admin can delete
     * Delete task
     * Return success message

2. Create src/routes/taskRoutes.ts with all routes

3. Add proper authorization checks for each action

Use Prisma includes to fetch related data efficiently.
```

---

## 📈 PHASE 5: Dashboard & Analytics

### Prompt 5.1: Create Dashboard Controller

```
Create dashboard analytics endpoints:

1. Create src/controllers/dashboardController.ts with:

   - getStats(req, res):
     * Get overall statistics for current user:
       - Total tasks assigned to user
       - Tasks by status (TODO, IN_PROGRESS, REVIEW, DONE)
       - Overdue tasks count
       - Completion percentage
       - Tasks due this week
     * Return statistics object

   - getMyTasks(req, res):
     * Get all tasks assigned to current user
     * Group by status
     * Include project information
     * Sort by priority and due date
     * Return tasks

   - getOverdueTasks(req, res):
     * Get all overdue tasks for user
     * Include project and priority
     * Sort by due date (oldest first)
     * Return overdue tasks

   - getProjectStats(req, res):
     * Get statistics for a specific project
     * Only project members can access
     * Return:
       - Total tasks
       - Tasks by status
       - Tasks by priority
       - Member task distribution
       - Completion rate

2. Create src/routes/dashboardRoutes.ts with:
   - GET /api/dashboard/stats
   - GET /api/dashboard/my-tasks
   - GET /api/dashboard/overdue
   - GET /api/dashboard/projects/:id/stats

All endpoints should be protected (require authentication).
```

---

## 🎨 PHASE 6: Frontend Setup

### Prompt 6.1: Initialize Frontend Project

```
Initialize the React frontend with TypeScript in the frontend/ folder:

1. Create a React + TypeScript project using Vite
2. Install dependencies:
   - axios
   - react-router-dom
   - @types/react-router-dom
   - tailwindcss, postcss, autoprefixer

3. Set up Tailwind CSS configuration

4. Create folder structure:
   frontend/
   ├── src/
   │   ├── components/
   │   ├── pages/
   │   ├── context/
   │   ├── services/
   │   ├── types/
   │   ├── utils/
   │   ├── App.tsx
   │   └── main.tsx
   ├── public/
   └── package.json

5. Create .env file:
   VITE_API_URL=http://localhost:5000/api

6. Set up basic App.tsx with React Router

Create the initial setup with a clean, professional Tailwind CSS configuration.
```

---

### Prompt 6.2: Create Authentication Context & Service

```
Create authentication system in the frontend:

1. Create src/types/index.ts with TypeScript interfaces:
   - User
   - Project
   - Task
   - AuthResponse

2. Create src/services/api.ts:
   - Axios instance configured with baseURL
   - Request interceptor to add JWT token
   - Response interceptor for error handling

3. Create src/services/authService.ts:
   - signup(email, password, name)
   - login(email, password)
   - logout()
   - getCurrentUser()

4. Create src/context/AuthContext.tsx:
   - AuthProvider component
   - useAuth hook
   - State: user, token, loading
   - Functions: login, signup, logout
   - Persist token in localStorage
   - Auto-login on mount if token exists

5. Create src/components/ProtectedRoute.tsx:
   - Redirect to /login if not authenticated
   - Show loading spinner while checking auth

Implement proper TypeScript types for all functions and states.
```

---

### Prompt 6.3: Create Authentication Pages

```
Create authentication UI:

1. Create src/pages/Login.tsx:
   - Email and password inputs
   - Login button
   - Link to signup page
   - Show error messages
   - Redirect to /dashboard on success
   - Clean, modern design with Tailwind

2. Create src/pages/Signup.tsx:
   - Name, email, password inputs
   - Password confirmation
   - Signup button
   - Link to login page
   - Show validation errors
   - Redirect to /dashboard on success
   - Modern design matching login page

3. Update src/App.tsx:
   - Add AuthProvider
   - Set up routes:
     * / → redirect to /login or /dashboard
     * /login → Login page
     * /signup → Signup page
     * /dashboard → Dashboard (protected)
     * /projects → Projects (protected)
     * /projects/:id → Project detail (protected)

Use React Router v6 with proper navigation. Make forms user-friendly with loading states and error handling.
```

---

## 📦 PHASE 7: Project Management UI

### Prompt 7.1: Create Project Service & Components

```
Create project management UI:

1. Create src/services/projectService.ts:
   - getAllProjects()
   - getProjectById(id)
   - createProject(data)
   - updateProject(id, data)
   - deleteProject(id)
   - getProjectMembers(id)
   - addProjectMember(projectId, userId, role)
   - removeProjectMember(projectId, userId)

2. Create src/components/ProjectCard.tsx:
   - Display project name, description
   - Show member count, task count
   - Status badge (Active/Archived/Completed)
   - Click to view project details
   - Nice card design with Tailwind

3. Create src/components/ProjectForm.tsx:
   - Form for create/edit project
   - Inputs: name, description, status
   - Submit and cancel buttons
   - Validation
   - Can be used in modal or separate page

4. Create src/components/Modal.tsx:
   - Reusable modal component
   - Backdrop with click-to-close
   - Close button
   - Animated appearance
   - Used for forms and confirmations

Make components reusable and type-safe with proper TypeScript interfaces.
```

---

### Prompt 7.2: Create Projects Page

```
Create the projects management page:

1. Create src/pages/Projects.tsx:
   - List all user's projects in a grid
   - "Create Project" button (opens modal)
   - Filter by status (All, Active, Archived)
   - Search by project name
   - Use ProjectCard components
   - Show empty state if no projects
   - Loading state while fetching

2. Create src/pages/ProjectDetail.tsx:
   - Show project details (name, description, status)
   - "Edit Project" and "Delete Project" buttons (admin only)
   - Tabs:
     * Tasks tab (list of tasks in this project)
     * Team tab (list of members)
   - Create task button
   - Add member button (admin only)

3. Create src/components/TeamMembers.tsx:
   - List project members
   - Show name, email, role badge
   - Remove button (admin only, can't remove owner)
   - Add member button (admin only)

Design should be clean, professional, and responsive. Use Tailwind for styling.
```

---

## ✏️ PHASE 8: Task Management UI

### Prompt 8.1: Create Task Service & Components

```
Create task management UI components:

1. Create src/services/taskService.ts:
   - getAllTasks(filters)
   - getTaskById(id)
   - createTask(data)
   - updateTask(id, data)
   - updateTaskStatus(id, status)
   - assignTask(id, userId)
   - deleteTask(id)

2. Create src/components/TaskCard.tsx:
   - Display task title, description
   - Status badge with color coding:
     * TODO: gray
     * IN_PROGRESS: blue
     * REVIEW: yellow
     * DONE: green
   - Priority badge (LOW, MEDIUM, HIGH, URGENT)
   - Assignee avatar/name
   - Due date (highlight if overdue in red)
   - Click to view details
   - Drag handle for kanban board (future use)

3. Create src/components/TaskForm.tsx:
   - Form for create/edit task
   - Inputs:
     * Title (required)
     * Description (textarea)
     * Project (dropdown, if creating from dashboard)
     * Assign to (dropdown of project members)
     * Priority (dropdown)
     * Due date (date picker)
     * Status (dropdown)
   - Validation
   - Submit and cancel buttons

4. Create src/components/StatusBadge.tsx:
   - Reusable badge component
   - Different colors for different statuses
   - Small, medium, large sizes

Implement with proper TypeScript and responsive design.
```

---

### Prompt 8.2: Create Task Views

```
Create task management pages:

1. Create src/pages/Tasks.tsx:
   - View all user's tasks across all projects
   - Filter options:
     * By status (dropdown)
     * By project (dropdown)
     * By priority (dropdown)
     * Show only my tasks (toggle)
     * Show overdue only (toggle)
   - Sort options (due date, priority, created date)
   - List or kanban board view toggle
   - Create task button

2. Create src/components/TaskList.tsx:
   - Display tasks in list format
   - Group by status or project
   - Quick status update dropdown
   - Quick assign dropdown
   - Click task to open details modal

3. Create src/components/TaskDetail.tsx:
   - Modal showing full task details
   - All task information displayed
   - Edit button (creator, assignee, or admin)
   - Delete button (creator or admin)
   - Status update dropdown
   - Assign to dropdown
   - Close button

4. Create src/components/KanbanBoard.tsx (optional):
   - Columns for each status (TODO, IN_PROGRESS, REVIEW, DONE)
   - Drag and drop tasks between columns
   - Updates status automatically
   - Task cards in each column

Make the UI intuitive and responsive. Use smooth transitions and animations.
```

---

## 📊 PHASE 9: Dashboard UI

### Prompt 9.1: Create Dashboard Page

```
Create the main dashboard:

1. Create src/services/dashboardService.ts:
   - getStats()
   - getMyTasks()
   - getOverdueTasks()
   - getProjectStats(projectId)

2. Create src/components/StatCard.tsx:
   - Reusable card for displaying statistics
   - Props: title, value, icon, color
   - Clean design with Tailwind
   - Optional trend indicator (up/down)

3. Create src/pages/Dashboard.tsx:
   - Welcome message with user name
   - Statistics cards row:
     * Total tasks assigned
     * Tasks completed
     * Tasks in progress
     * Overdue tasks (red if > 0)
   - "My Tasks" section:
     * Quick filters (Today, This Week, All)
     * List of tasks
     * Group by status
   - "Overdue Tasks" section (if any):
     * List of overdue tasks with red highlight
   - "Recent Projects" section:
     * Quick access to 3-5 recent projects
     * Create project button

4. Create src/components/TasksByStatus.tsx:
   - Visual representation of tasks by status
   - Can be a simple bar chart or list
   - Percentage completed
   - Clickable to filter tasks

Design should be clean, modern dashboard style with good use of white space and colors.
```

---

## 🎨 PHASE 10: Polish & Navigation

### Prompt 10.1: Create Navigation & Layout

```
Create the application layout and navigation:

1. Create src/components/Navbar.tsx:
   - App logo/name on left
   - Navigation links:
     * Dashboard
     * Projects
     * Tasks
   - User menu on right:
     * User name/avatar
     * Dropdown menu:
       - Profile
       - Settings
       - Logout
   - Mobile responsive hamburger menu
   - Sticky at top

2. Create src/components/Sidebar.tsx (optional):
   - Collapsible sidebar for desktop
   - Quick navigation:
     * Dashboard
     * My Tasks
     * Projects list
     * Create project button
   - Collapsed state shows icons only

3. Create src/components/Layout.tsx:
   - Wrapper component
   - Includes Navbar
   - Optional Sidebar
   - Main content area
   - Footer (optional)
   - Different layouts for auth pages vs app pages

4. Update all pages to use Layout component

5. Create src/components/LoadingSpinner.tsx:
   - Centered spinner for loading states
   - Different sizes (small, medium, large)

Make navigation smooth and intuitive. Use Tailwind for responsive design.
```

---

### Prompt 10.2: Add Notifications & Error Handling

```
Add user feedback system:

1. Create src/components/Toast.tsx:
   - Toast notification component
   - Types: success, error, warning, info
   - Auto-dismiss after 3 seconds
   - Multiple toasts stack
   - Position: top-right
   - Slide-in animation

2. Create src/context/ToastContext.tsx:
   - ToastProvider component
   - useToast hook
   - Functions:
     * showSuccess(message)
     * showError(message)
     * showWarning(message)
     * showInfo(message)

3. Update all API calls to show toast notifications:
   - Success on create/update/delete
   - Error messages from API
   - Loading states

4. Create src/components/ErrorBoundary.tsx:
   - Catch React errors
   - Show friendly error page
   - Log errors to console
   - Reload button

5. Add error handling to all services:
   - Catch network errors
   - Handle 401 (redirect to login)
   - Handle 403 (show permission error)
   - Handle 404 (show not found)
   - Handle 500 (show server error)

Improve user experience with clear feedback for all actions.
```

---

## 🚀 PHASE 11: Testing & Docker Build

### Prompt 11.1: Prepare for Docker

```
Prepare the application for Docker deployment:

1. Backend preparation:
   - Ensure all environment variables are properly used
   - Update src/index.ts to handle graceful shutdown
   - Add /health endpoint for health checks
   - Create build script in package.json
   - Test that `npm run build` works

2. Frontend preparation:
   - Update API URL to use environment variable:
     const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
   - Create .env.production file
   - Test that `npm run build` works
   - Verify build output in dist/ folder

3. Create prisma/seed.ts (optional):
   - Seed script to create sample data
   - Create admin user
   - Create sample project
   - Create sample tasks

4. Update backend package.json to add:
   - "prisma": { "seed": "ts-node prisma/seed.ts" }

Test the entire application locally before Docker deployment.
```

---

### Prompt 11.2: Test with Docker Compose

```
Test the application with Docker:

1. Verify all Docker files are in place:
   - backend/Dockerfile
   - frontend/Dockerfile
   - frontend/nginx.conf
   - docker-compose.yml

2. Build and run with Docker Compose:
   ```
   docker-compose up --build
   ```

3. Test all functionality:
   - Signup new user
   - Login
   - Create project
   - Add team member
   - Create tasks
   - Update task status
   - Assign tasks
   - View dashboard
   - Test all filters
   - Delete operations

4. Check for errors:
   - View backend logs: docker-compose logs backend
   - View frontend logs: docker-compose logs frontend
   - View database logs: docker-compose logs database

5. Fix any issues and rebuild

Document any problems and solutions for the README.
```

---

## 📝 PHASE 12: Documentation & Deployment

### Prompt 12.1: Create README

```
Create comprehensive README.txt for submission:

Include these sections:

1. Project Overview
   - What it does
   - Key features
   - Technologies used

2. Live Application
   - Live URL: [will add after Railway deployment]
   - GitHub repo: [your repo URL]

3. Features List
   - Authentication
   - Role-based access
   - Project management
   - Team management
   - Task management
   - Dashboard
   - Analytics

4. Setup Instructions
   - Prerequisites
   - Backend setup steps
   - Frontend setup steps
   - Docker setup steps

5. Environment Variables
   - List all required variables
   - Example values

6. API Endpoints
   - List main endpoints by category
   - Authentication, Projects, Tasks, Dashboard

7. User Roles
   - Admin capabilities
   - Member capabilities

8. Tech Stack
   - Backend: Node.js, Express, Prisma, PostgreSQL
   - Frontend: React, TypeScript, Tailwind CSS
   - Deployment: Docker, Railway

9. Project Structure
   - Directory tree
   - Brief explanation of key folders

10. Testing
    - How to test locally
    - Docker testing

Make it clear, professional, and easy to follow.
```

---

### Prompt 12.2: Deploy to Railway

```
Deploy the application to Railway:

I need step-by-step instructions to:

1. Deploy backend to Railway:
   - How to create Railway project
   - How to add PostgreSQL database
   - How to deploy from GitHub
   - What environment variables to set
   - How to run Prisma migrations
   - How to generate domain

2. Deploy frontend to Railway:
   - How to create new service
   - How to link GitHub repo
   - How to set VITE_API_URL
   - How to generate domain

3. Verify deployment:
   - Test all features on live URL
   - Check logs for errors
   - Test on mobile device

4. Update README with live URLs

Provide exact Railway CLI commands or dashboard instructions.
```

---

## 🎥 PHASE 13: Demo Video

### Prompt 13.1: Demo Video Script

```
Help me create a 3-minute demo video script:

1. Introduction (20 seconds):
   - Project name and purpose
   - Tech stack overview

2. Authentication Demo (30 seconds):
   - Show signup
   - Show login
   - Show role-based dashboard

3. Project Management (40 seconds):
   - Create new project
   - Show project detail
   - Add team members
   - Show admin vs member view

4. Task Management (50 seconds):
   - Create multiple tasks
   - Assign to team members
   - Update task status
   - Show different priorities
   - Mark task as done

5. Dashboard (30 seconds):
   - Show statistics
   - Show my tasks
   - Show overdue tasks
   - Show filtering

6. Conclusion (10 seconds):
   - Recap features
   - Show live URL

Provide exact steps to demonstrate and what to say.
```

---

## ✅ Final Submission Checklist Prompt

```
Help me verify my submission is complete:

Check that I have:

1. Live Application:
   - [ ] Deployed to Railway
   - [ ] Backend URL working
   - [ ] Frontend URL working
   - [ ] Database connected
   - [ ] All features functional

2. GitHub Repository:
   - [ ] Code pushed to GitHub
   - [ ] Repository is public
   - [ ] .env files NOT committed
   - [ ] README.md included
   - [ ] All Docker files included

3. Documentation:
   - [ ] README.txt with all sections
   - [ ] Clear setup instructions
   - [ ] Environment variables documented
   - [ ] API endpoints listed

4. Demo Video:
   - [ ] 2-5 minutes long
   - [ ] Shows all key features
   - [ ] Good audio quality
   - [ ] Uploaded and link included

5. Features Working:
   - [ ] User signup/login
   - [ ] Create projects
   - [ ] Add team members
   - [ ] Role-based access
   - [ ] Create/assign tasks
   - [ ] Update task status
   - [ ] Dashboard with stats
   - [ ] Overdue task detection

6. Code Quality:
   - [ ] No console errors
   - [ ] Proper error handling
   - [ ] Loading states
   - [ ] Responsive design

Generate a submission checklist document I can use.
```

---

## 💡 Pro Tips for Using These Prompts

1. **Copy-Paste Each Prompt**: Don't modify, use them as-is for best results

2. **Complete in Order**: Each phase builds on the previous one

3. **Test After Each Phase**: Run the code and test before moving forward

4. **Save Progress**: Commit to git after each working phase

5. **Ask Follow-ups**: If Claude Code makes a mistake, ask:
   ```
   "The [X] isn't working. Here's the error: [paste error]. 
   Can you fix it?"
   ```

6. **Use Multiple Sessions**: If context gets too long, start new chat and say:
   ```
   "I'm building a Team Task Manager. I've completed Phase X. 
   Now I need to do [next phase]. Here's my current code structure..."
   ```

7. **Docker Test Often**: Run `docker-compose up` after phases 11-12 to catch issues early

8. **Document Issues**: Keep notes of problems and solutions for README

---

## 🎯 Expected Timeline

- **Phase 1-2** (Auth): 2-3 hours
- **Phase 3-4** (Projects & Tasks): 3-4 hours
- **Phase 5** (Dashboard): 1-2 hours
- **Phase 6-8** (Frontend): 4-5 hours
- **Phase 9-10** (Dashboard UI & Polish): 2-3 hours
- **Phase 11-12** (Testing & Deployment): 2-3 hours
- **Phase 13** (Documentation & Video): 1-2 hours

**Total: 15-22 hours** (2-3 days of focused work)

---

**Start with Prompt 1.1 and work your way through! Good luck! 🚀**
