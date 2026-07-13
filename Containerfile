# hamlive-oss production image. Build: podman build -f Containerfile .
#
# The runtime layout must mirror the repo (/app/package.json, /app/server/dist,
# /app/client/dist): configLib resolves .env and YAML relative to __dirname, the
# server serves client assets from ../../client/dist, and the root package.json
# "imports" map (#@server/*, #@client/*) must be present for module resolution.

# ---- Stage 1: compile TypeScript (needs devDependencies) ----
FROM node:22-alpine AS build
WORKDIR /app
# mongodb-memory-server is a devDep whose postinstall downloads a glibc mongod
# binary — useless on alpine and slow. Skip it.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci
COPY server ./server
COPY client ./client
RUN npm run build

# ---- Stage 2: production node_modules only ----
FROM node:22-alpine AS proddeps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 3: runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --from=proddeps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/client/dist ./client/dist
USER node
EXPOSE 3000
# /api is unauthenticated and only responds once mongoose has connected
# (app.listen runs inside the connect .then), so a 200 also proves DB health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/server.js"]
