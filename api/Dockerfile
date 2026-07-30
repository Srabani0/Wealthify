# Build context is THIS folder (api/) — the app is now fully standalone, with
# the shared Zod schemas/types vendored at src/shared, so nothing outside this
# directory is needed. (The previous version of this file assumed an npm
# workspaces monorepo and copied from a repo root that no longer exists.)
FROM node:22-slim

WORKDIR /app

# Install before copying source so this layer stays cached across code-only
# rebuilds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `prisma generate` validates the schema's env("DATABASE_URL")/env("DIRECT_URL")
# references and fails if they're unset — it needs non-empty values, not a
# reachable database. The real ones are injected as container env vars at
# runtime and take precedence over these build-time placeholders.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

# Fail the image build on type errors rather than discovering them at runtime.
RUN npm run typecheck

ENV NODE_ENV=production
EXPOSE 4000

# Starts via tsx (see the "// start" note in package.json): tsc does not rewrite
# the "@wealthify/shared" path alias in emitted JS, so plain
# `node dist/index.js` cannot resolve it.
CMD ["npm", "run", "start"]
