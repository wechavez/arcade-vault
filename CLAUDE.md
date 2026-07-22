# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

**Arcade Vault** is a Spanish-language web platform for playing games online and competing on
score leaderboards ("Salón de la Fama"). The `app/` directory currently contains the unmodified
`create-next-app` scaffold — the real product has not been built yet. Product intent and UI/data
shape live in `references/templates/` (see below), not in `app/`.

The README states this project follows Spec Driven Design via `/spec` and `/spec-impl` commands
from `npx skills@latest add Klerith/fernando-skills`. Those skills are not currently installed
(no `.claude/` directory present) — check whether they've been added before assuming the
commands exist.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

There is no test runner configured (no test script, no Jest/Vitest/Playwright dependency).

## Reference mockups (`references/templates/`)

These are standalone HTML/CDN-React prototypes (global `React`/`ReactDOM` via `<script>` tags,
no build step) that define the target design and behavior to port into the real Next.js App
Router implementation. Treat them as the spec for screens and data shape, not as code to run
or import directly.

- `Arcade Vault.html` — shell that loads the other files as plain scripts.
- `app.jsx` — root `App` component: hash-based routing (`{ name, id }` route objects synced to
  `location.hash`), current-user state persisted to `localStorage` (`av_user`), and score
  submission persisted to `localStorage` (`av_scores`).
- `nav.jsx` — top nav + mobile slide-out panel; routes: `biblioteca`, `salon`, `auth`.
- `biblioteca.jsx` — game library/catalog screen (routes to `detalle`).
- `detalle.jsx` — game detail screen (routes to `player`).
- `reproductor.jsx` — the game player screen: fake live scoring loop (`setInterval`), lives,
  levels, pause/end/save-score flow. This is a placeholder simulation, not a real game engine.
- `salon.jsx` — hall of fame / leaderboard screen.
- `auth.jsx` — login/signup form (client-side only, no real backend — `onLogin` just stores a
  display name).
- `data.jsx` — shared mock data: the `GAMES` array (id, title, category, cover, color, best
  score, play count) that every screen reads from.
- `styles.css` — the neon/CRT/pixel design system (CSS custom properties for color, `--pixel`
  and `--mono` fonts, glow/scanline effects). Port these tokens into `app/globals.css` /
  Tailwind theme rather than reinventing the palette.

When implementing real routes/pages, map these mock screens onto Next.js App Router routes
under `app/` (e.g. library → `app/page.tsx` or `app/biblioteca/`, detail → dynamic route,
player → dynamic route, auth and hall-of-fame as their own routes), replacing `localStorage`
persistence and the hash router with real Next.js routing and (eventually) a real backend/data
source and game logic.

## Stack notes

- Next.js 16.2.11, React 19, App Router, TypeScript (strict), Tailwind CSS v4 (via
  `@tailwindcss/postcss`, `@theme inline` in `app/globals.css`), ESLint 9 flat config.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Per `AGENTS.md`, this Next.js version may differ from training-data assumptions — check
  `node_modules/next/dist/docs/` for current APIs/conventions before relying on memory.
