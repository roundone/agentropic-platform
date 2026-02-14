# Agentropic Platform — Development Changelog

> Reverse-chronological log of what was built, what's working, what's not, and what's next.
> This file exists so that new Claude Code sessions can pick up exactly where we left off.

---

## Session: Feb 13, 2026 (Morning)

### What was done
1. **Neon DB confirmed working** — schema already pushed (from Feb 12), connection string in `.env` and `.env.local`
2. **Seed script run successfully** — all 4 projects (Dify, GPT Researcher, Bolt.new, OpenClaw) upserted into Neon
3. **Landing page wired to DB** — replaced hardcoded `FEATURED_PROJECTS` array with live DB query; `page.tsx` now an async server component
4. **Verified API endpoint** — `GET /api/projects` returns all 4 projects from Neon
5. **Verified local dev** — homepage renders projects from DB, all 4 project cards visible
6. **Created CHANGELOG.md** — this file, for cross-session continuity
7. **Updated `Agentropic/CLAUDE.md`** — current status now reflects "Phase 1 MVP scaffold deployed"

### What's blocking
- **fly.io billing** — `flyctl apps create` fails with "We need your payment information." Must add credit card at: `https://fly.io/dashboard/nishant-837/billing`

### What's next (once fly.io billing is resolved)
1. Create `agentropic-sessions` fly.io app
2. Test machine creation with `nginx:alpine` (simple smoke test)
3. Verify full session launch → iframe → stop flow
4. Build real project Docker images (start with GPT Researcher — simplest Dockerfile)
5. Deploy to Vercel with `DATABASE_URL` env var set (if not already)
6. Clerk production mode
7. Custom domain

---

## Session: Feb 12, 2026 (Evening)

### What was built
**Full Phase 1 MVP scaffold — from zero to deployed on Vercel.**

#### Frontend (Next.js 16 + App Router + shadcn/ui)
- **Landing page** (`src/app/page.tsx`) — Hero section ("Try the AI tools everyone's talking about — instantly"), "How it works" 3-step section (Browse → Launch → Explore), Featured Projects grid, CTA
- **Projects page** (`src/app/projects/page.tsx`) — Grid of project cards with categories, star counts, descriptions, "Try It" buttons
- **Project detail page** (`src/app/projects/[slug]/page.tsx`) — Individual project view
- **Session page** (`src/app/session/[id]/page.tsx`) — Where users interact with running containers (iframe/xterm.js)
- **Dashboard** (`src/app/dashboard/page.tsx`) — User's sessions and usage
- **Sign-in / Sign-up** — Clerk-powered auth pages
- **Layout components** — Header with nav (Agentropic logo, Projects, Sign In, Get Started), Footer

#### Auth (Clerk)
- Clerk integrated with development keys
- Google OAuth + email/password sign-in working
- Clerk webhook handler (`src/app/api/webhooks/clerk/route.ts`) — syncs users to our DB
- Middleware protecting dashboard routes (`src/middleware.ts`)

#### Database (Neon Postgres + Drizzle ORM)
- Schema defined (`src/db/schema.ts`): users, projects, sessions, usage_records tables
- Drizzle config + connection (`src/db/index.ts`, `drizzle.config.ts`)
- Seed script (`src/db/seed.ts`) — 4 projects: Dify, GPT Researcher, Bolt.new, OpenClaw

#### API Routes
- `GET /api/projects` — List all active projects
- `GET /api/projects/[slug]` — Get single project by slug
- `POST /api/sessions` — Create a new session (starts fly.io machine)
- `GET /api/sessions/[id]` — Get session details
- `PATCH /api/sessions/[id]` — Update session (extend, stop)
- `GET /api/sessions/launch?projectId=` — Redirect-based session creation (for "Try It" buttons)
- `POST /api/sessions/[id]/stop` — Stop a running session

#### Container Infrastructure
- fly.io client (`src/server/fly/client.ts`) — Create, start, stop, destroy machines
- Dockerfiles for all 4 projects:
  - `containers/dify/Dockerfile`
  - `containers/gpt-researcher/Dockerfile`
  - `containers/bolt-new/Dockerfile`
  - `containers/openclaw/Dockerfile`
- Base Dockerfiles: `containers/_base/Dockerfile.node`, `containers/_base/Dockerfile.python`

#### CI/CD
- GitHub Actions: `ci.yml` (lint + build on PR), `deploy-containers.yml` (Docker build/push)

#### Deployment
- **Vercel**: Deployed successfully under nishie's Vercel account
- **GitHub**: Repo at `github.com/roundone/agentropic-platform`, branch `main`, 2 commits
- **fly.io**: API token configured, `agentropic-sessions` app creation attempted

### What's working
- Landing page, projects page, sign-in page all render correctly on Vercel
- Clerk auth flow works (Google + email, development mode)
- API routes exist and are structured

### What's NOT working / not yet done
- **Neon DB not connected** — Need to create Neon project and add `DATABASE_URL` to Vercel env vars
- **Seed script not run** — Projects are hardcoded in the UI for now, not from DB
- **fly.io machines not tested** — Container launch flow is coded but untested end-to-end
- **Dockerfiles not built/pushed** — No container images exist on fly.io registry yet
- **Session iframe/xterm.js** — UI exists but no live container to connect to
- **No custom domain** — Running on Vercel's default `.vercel.app` URL
- **Clerk in development mode** — Need to switch to production for real deploys

### Environment / Credentials
- Clerk dev keys: configured in `.env.local` (not committed)
- fly.io API token: configured in `.env.local`
- Neon: connected (`DATABASE_URL` in `.env` and `.env.local`), schema pushed, seed run
- Vercel: deployed under nishie's account
- GitHub: `roundone/agentropic-platform`
