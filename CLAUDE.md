# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js on port 3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

No test suite is configured. Type-check manually with `npx tsc --noEmit`.

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL), deployed on Vercel.

**Routing and auth model:** Three distinct user roles with separate login flows:
- `joueur` — authenticates via a team code (`code_equipe`), auto-generated as `IUT-NOMEQUIPE-2027` when a team is created through the public inscription flow (see `lib/data/equipes.ts#createEquipe`)
- `benevole` — email + password, checked against DB or `BENEVOLES_CREDENTIALS` env var
- `admin` — env-var credentials (`ADMIN_EMAIL/PASSWORD`) or staff provisioning via `STAFF_DEFAULT_PASSWORD` (provisioning is disabled if that var is unset — there is no hardcoded fallback password)

Sessions are an HMAC-signed (`SESSION_SECRET`), httpOnly, `tournoi_session` cookie set by the three `/api/auth/*` login routes (see `lib/session.ts`). `middleware.ts` does a lightweight (unsigned) role check to redirect `/admin`, `/benevole`, `/joueur` page navigation server-side; the actual security boundary is `requireRole()` from `lib/session.ts`, called at the top of every sensitive API route handler. Client components never read the cookie directly — they call `GET /api/auth/session` to refresh their own display-only `sessionStorage` cache and detect logout/expiry.

**Data layer:** All Supabase access goes through `lib/data/*.ts` modules — one file per domain (equipes, participants, matchs, taches, etc.). The single client is initialized in `lib/supabase.ts` using `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role key — all queries bypass RLS, which is intentionally disabled on every table; **all access control lives in the API route layer via `requireRole()`, not in Postgres**). The `TABLES` constant in `lib/supabase.ts` maps logical names to actual table names.

**API routes** live in `app/api/` and are consumed by client components via `fetch`. All pages are `'use client'` — there are no React Server Components in use today. Every route that touches non-public data calls `requireRole([...])` from `lib/session.ts` before doing anything else; `GET /api/participants` is the one route with three-tiered output (anonymous → public spectator list only, `joueur` → own-IUT rows only, `admin`/`benevole` → full rows) instead of a flat allow/deny.

**Styling:** Custom design system built on Tailwind utilities defined in `app/globals.css` (`.btn-primary`, `.panel`, `.panel-deep`, `.glass`, `.card-hover`, `.interactive-tile`, `.live-stripe`, `.animate-rise-in`). Prefer these classes over raw Tailwind for consistency.

## Required environment variables

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
ADMIN_EMAIL
ADMIN_PASSWORD
BENEVOLES_CREDENTIALS   # pipe-separated list of email:password pairs
SESSION_SECRET          # HMAC secret for signing the session cookie — required in every environment (local + Vercel)
```

Optional: `ADMIN_2_EMAIL`, `ADMIN_2_PASSWORD`, `STAFF_DEFAULT_PASSWORD` / `BENEVOLE_DEFAULT_PASSWORD` (staff→admin auto-provisioning is disabled if neither is set — this is the safe default, not a bug).
