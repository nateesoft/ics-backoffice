export interface ComposeConfig {
  dbName: string;
  dbUser: string;
  dbPassword: string;
  frontendPort: number;
  backendPort: number;
  deployHost: string; // browser-reachable hostname for the frontend to call the backend, e.g. "localhost" or the server's real address
}

// 3 services: `db` (official postgres image — auto-creates POSTGRES_DB on first boot, no admin
// CREATE DATABASE call needed), `backend`, `frontend`. Only frontend + backend get host-exposed
// ports; db is reachable only inside the compose network (hostname `db`), matching the "isolated
// Postgres per deployment, nothing shared" decision.
export function renderDockerCompose(config: ComposeConfig): string {
  return `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${config.dbName}
      POSTGRES_USER: ${config.dbUser}
      POSTGRES_PASSWORD: ${config.dbPassword}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${config.dbUser} -d ${config.dbName}"]
      interval: 2s
      timeout: 3s
      retries: 20

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://${config.dbUser}:${config.dbPassword}@db:5432/${config.dbName}
      PORT: 3001
    ports:
      - "${config.backendPort}:3001"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://${config.deployHost}:${config.backendPort}
      INTERNAL_API_URL: http://backend:3001
      PORT: 3000
    ports:
      - "${config.frontendPort}:3000"
    depends_on:
      - backend

volumes:
  db-data:
`;
}
