# syntax=docker/dockerfile:1
#
# Railway/Docker image for the LaundryWush frontend (TanStack Start + Nitro).
#
# Two stages: build the Nitro `node-server` artifact, then run only `.output` on
# a slim Node base. The runtime image carries no source, no dev dependencies,
# and no package manager cache.

FROM node:24-slim AS build

WORKDIR /app

# Copy manifests first so dependency installation stays cached across source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Nitro resolves routeRules at build time, so the API target must be present
# now, not at container start. Railway supplies the backend service URL.
ARG API_PROXY_TARGET
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

ENV NODE_ENV=production
RUN npm run build

FROM node:24-slim

WORKDIR /app

# `.output` is self-contained: Nitro traces and bundles what the server needs.
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production

# Railway injects PORT; Nitro reads it. HOST must be 0.0.0.0 for the platform
# to reach the container — the default 127.0.0.1 would only accept local traffic.
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
