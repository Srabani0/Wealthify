# Build context is THIS folder (web/) — the app is now fully standalone, with
# the shared Zod schemas/types vendored at src/shared, so nothing outside this
# directory is needed. (The previous version assumed an npm workspaces monorepo
# and copied from a repo root that no longer exists.)
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables into the static bundle AT BUILD TIME, not at
# container start — they must be passed as build args, not runtime env vars:
#   docker build --build-arg VITE_API_BASE_URL=... --build-arg VITE_CLOUDINARY_CLOUD_NAME=... .
ARG VITE_API_BASE_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME

RUN npm run build

# ---- Runtime: serve the static build ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
