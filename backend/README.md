# TaskFlow Backend

This is the Node.js/Express API backend for the TaskFlow application, providing robust authentication, role-based access control, and data persistence.

## 🛠️ Technology Stack

- **Runtime**: Node.js (v20)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (via local file `dev.db`)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) & bcrypt

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v20+ recommended) installed.

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root of the `backend` directory:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
NODE_ENV="development"
```

### Database Setup

TaskFlow uses a local SQLite database for zero-config persistence.

1. Generate the Prisma Client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
2. Seed the database with initial admin and test data:
   ```bash
   npx ts-node prisma/seed.ts
   ```

### Development

To start the local development server with hot-reloading:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### Production Build

To compile the TypeScript code for production:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

## 🐳 Docker Support

The backend includes a `Dockerfile` tailored for production. It automatically handles dependency installation, Prisma client generation, and schema synchronization upon container startup.

*(For full-stack Docker execution, refer to the `docker-compose.yml` in the project root).*
