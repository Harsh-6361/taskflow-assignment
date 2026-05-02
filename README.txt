============================================================
PROJECT: TASKFLOW - TEAM TASK MANAGEMENT PLATFORM
============================================================

TaskFlow is a professional full-stack web application designed for 
teams to organize projects, manage tasks, and track progress with 
role-based access control.

------------------------------------------------------------
🚀 LIVE APPLICATION & REPOSITORY
------------------------------------------------------------
Live URL: https://taskflow-assignment-production.up.railway.app
GitHub Repo: https://github.com/Harsh-6361/taskflow-assignment

------------------------------------------------------------
✨ KEY FEATURES
------------------------------------------------------------
- Secure Authentication: Signup, Login, and Session persistence.
- Role-Based Access Control (RBAC):
    * ADMIN: Global system control, users management, and analytics.
    * TEAM_LEADER: Can create projects and manage their assigned teams.
    * MEMBER: Collaborate on tasks within assigned projects.
- Project Management: CRUD operations for project workspaces.
- Team Management: Invite members via email and manage project roles.
- Interactive Kanban Board: One-click status updates for tasks.
- Advanced Dashboard: Personal workload analytics and system health.

------------------------------------------------------------
🛠️ TECHNOLOGY STACK
------------------------------------------------------------
- Frontend: React 18, Vite, TypeScript, Tailwind CSS v4, Lucide Icons.
- Backend: Node.js (Express), TypeScript, Prisma ORM.
- Database: SQLite (configured with persistent volumes for Railway).
- Deployment: Railway (Docker-orchestrated).

------------------------------------------------------------
🔑 TEST CREDENTIALS
------------------------------------------------------------
1. ADMIN USER (Full Access)
   - Email: admin@test.com
   - Password: Password123!

2. TEAM LEADER
   - Email: lead@test.com
   - Password: Password123!

3. MEMBER
   - Email: member@test.com
   - Password: Password123!

------------------------------------------------------------
⚙️ LOCAL SETUP
------------------------------------------------------------
1. Clone the repository.
2. Run 'docker-compose up -d --build'.
3. Seed the DB: 'docker-compose exec backend npx ts-node prisma/seed.ts'.
4. Access at http://localhost.

============================================================
