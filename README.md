# TaskFlow - Team Task Management Platform

TaskFlow is a comprehensive, full-stack web application designed for teams to organize projects, manage tasks, and track overall progress efficiently. It features a modern UI, role-based access control, and real-time dashboard analytics.

## ✨ Key Features

- **Robust Authentication**: Secure signup and login flows powered by JWT and bcrypt.
- **Hierarchical Access Control**: 
  - `ADMIN`: Global control over all projects, users, and system analytics.
  - `TEAM_LEADER`: Ability to create projects and manage their assigned teams.
  - `MEMBER`: View assigned tasks and collaborate within project spaces.
- **Project Organization**: Create detailed project workspaces with descriptions, status tracking, and member management.
- **Interactive Task Boards**: Kanban-style task views with one-click status updates (Todo, In Progress, Review, Done).
- **Advanced Dashboard**:
  - Personal workload overview and overdue task alerts.
  - Interactive "My Tasks" feed.
  - System-wide network health and activity tracking (Admin only).
- **Zero-Config Database**: Powered by SQLite for instant local setup and easy portability.

## 🏗️ Architecture

The project is structured as a monorepo containing two main parts:

1. **`/frontend`**: A React application built with Vite, TypeScript, and Tailwind CSS v4.
2. **`/backend`**: An Express.js API powered by Node.js, TypeScript, and Prisma ORM.

For detailed instructions on each component, refer to their respective READMEs:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🚀 Quick Start (Docker)

The easiest way to run TaskFlow is using Docker Compose. This single command will build and orchestrate both the frontend and backend services, including the SQLite database volume.

### Prerequisites
- Docker
- Docker Compose

### 1. Build and Run
From the root of the repository, execute:
```bash
docker-compose up -d --build
```

### 2. Seed the Database
To create the initial test accounts, run the seed script inside the running backend container:
```bash
docker-compose exec backend npx ts-node prisma/seed.ts
```

### 3. Access the Application
- **Frontend UI**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 🔑 Test Credentials

Once the database is seeded, you can log in immediately:

- **Admin Account**: `admin@test.com` / `Password123!`
- **Team Leader**: `lead@test.com` / `Password123!`
- **Team Member**: `member@test.com` / `Password123!`

## ☁️ Deployment

TaskFlow is optimized for containerized deployment platforms like Railway. 

When deploying:
1. Ensure you attach a **Persistent Volume** to the backend service and mount it to `/app/prisma` to prevent SQLite data loss upon rebuilds.
2. Provide the `VITE_API_URL` as a Build Argument for the frontend service to ensure the React application connects to your live backend domain.

## 📜 License

This project is licensed under the ISC License.
