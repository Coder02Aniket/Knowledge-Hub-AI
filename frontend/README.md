# KnowledgeHub Frontend

This is the KnowledgeHub frontend application built with React, TypeScript, and Vite. It is styled with Tailwind CSS v4 and manages state via Zustand. It interacts directly with the Java Spring Boot backend.

## Prerequisites

- [Bun](https://bun.sh/) (or Node.js/npm) installed.

## Setup & Running

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server (which proxies `/knowledgehub` to the local backend running on `http://localhost:8080`):
   ```bash
   bun dev
   ```

3. Build for production:
   ```bash
   bun run build
   ```

## Architecture

- **React + Vite**: High-performance development.
- **Tailwind CSS v4**: Utility-first styling with `@tailwindcss/vite`.
- **Zustand**: Lightweight global state management for Auth, Conversations, and Documents.
- **Axios**: HTTP client configured for session-cookie authentication.
- **React Router**: Client-side routing.
- **React Markdown**: Rendering AI responses correctly.

## Deployment Notes

To deploy alongside the Spring Boot application, run `bun run build` and place the contents of the `dist/` directory into `src/main/resources/static/` of the Spring Boot project. Alternatively, configure a reverse proxy (like Nginx) to serve the static frontend and route `/knowledgehub/api/*` to the Java backend.
