# TaskFlow Frontend

This is the React frontend for the TaskFlow application, providing a modern, responsive, and intuitive interface for team task management.

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **API Client**: Axios

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v20+ recommended) installed.

### Installation

1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root of the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

*(Ensure the URL points to your running TaskFlow backend API)*

### Development

To start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

To create a production-ready build:

```bash
npm run build
```

This will compile the application into the `dist` directory.

## 🐳 Docker Support

The frontend includes a multi-stage `Dockerfile`. 
- **Stage 1**: Compiles the React application using Node.js.
- **Stage 2**: Serves the compiled static assets using a lightweight Nginx web server.

*(For full-stack Docker execution, refer to the `docker-compose.yml` in the project root).*
