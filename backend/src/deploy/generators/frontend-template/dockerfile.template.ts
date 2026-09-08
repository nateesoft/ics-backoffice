// Multi-stage build. `output:'standalone'` does NOT auto-copy `public/`/`.next/static/` (confirmed
// against Next's own docs) — the real app's Jenkins pipeline does this by hand today
// (`xcopy .next\static ...`), so the final stage explicitly COPYs both, same as that pipeline does.
export function renderFrontendDockerfile(): string {
  return `FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
`;
}
