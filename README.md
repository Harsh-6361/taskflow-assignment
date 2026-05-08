# TaskFlow - Team Task Management Platform (Firebase Edition)

TaskFlow is a comprehensive, full-stack web application designed for teams to organize projects, manage tasks, and track overall progress efficiently. It features a modern UI, role-based access control, and real-time dashboard analytics.

## ✨ Key Features

- **Robust Authentication**: Powered by **Firebase Authentication** for secure and scalable user management.
- **Hierarchical Access Control**: 
  - `ADMIN`: Global control over all projects, users, and system analytics.
  - `TEAM_LEADER`: Ability to create projects and manage their assigned teams.
  - `MEMBER`: View assigned tasks and collaborate within project spaces.
- **Project Organization**: Create detailed project workspaces with descriptions, status tracking, and member management.
- **Interactive Task Boards**: Kanban-style task views with one-click status updates.
- **Advanced Dashboard**:
  - Personal workload overview and overdue task alerts.
  - Interactive "My Tasks" feed.
  - System-wide network health and activity tracking (Admin only).
- **Scalable Database**: Powered by **Google Cloud Firestore** for high-performance, real-time data synchronization.

## 🏗️ Architecture

The project is structured as a monorepo:

1. **`/frontend`**: React application built with Vite, TypeScript, and Tailwind CSS.
2. **`/backend`**: Express.js API powered by Node.js, TypeScript, and Firebase Admin SDK.

## 🚀 Quick Start (Docker)

1. Create a `.env` file in the root with your Firebase credentials (see `.env.example`).
2. Build and orchestrate:
```bash
docker-compose up -d --build
```

## ☁️ Deployment

### 1. Backend (Railway/Docker)
- **Root Directory**: `/backend`
- **Variables**:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`: Raw JSON string of your service account key.
  - `PORT`: `5000`
  - `NODE_ENV`: `production`

### 2. Frontend (Vercel/Vite)
- **Variables**:
  - `VITE_API_URL`: Your backend URL.
  - `VITE_FIREBASE_API_KEY`: ...
  - `VITE_FIREBASE_AUTH_DOMAIN`: ...
  - `VITE_FIREBASE_PROJECT_ID`: ...
  - `VITE_FIREBASE_STORAGE_BUCKET`: ...
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`: ...
  - `VITE_FIREBASE_APP_ID`: ...

## 📜 License

This project is licensed under the ISC License.
