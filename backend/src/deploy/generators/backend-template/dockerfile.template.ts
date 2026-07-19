// `npm install` rather than `npm ci` deliberately — the generator doesn't ship a package-lock.json
// (nothing here can run `npm install` itself to produce a real one without network access at
// generate time), so there's no lockfile for `ci` to validate against.
export function renderBackendDockerfile(): string {
  return `FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./.env
EXPOSE 3001
CMD ["node", "dist/main.js"]
`;
}
