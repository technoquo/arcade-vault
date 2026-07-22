# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Arcade Vault** — an online platform to play games and compete for the highest score. Built with Next.js 15 App Router, React 19, TypeScript (strict), and Tailwind CSS v4.

## Commands

```bash
npm run dev      # dev server with Turbopack
npm run build    # production build with Turbopack
npm run start    # production server
npm run lint     # ESLint
```

No test runner is configured yet.

## Architecture

- **`app/`** — Next.js App Router. `layout.tsx` is the root shell (fonts, global CSS). Add new routes as `app/<route>/page.tsx`.
- **`public/`** — static assets served at `/`.
- **Path alias** — `@/*` resolves to the repo root, usable in any import.
- **Styling** — Tailwind CSS v4 via PostCSS. No `tailwind.config` file; configuration is done in CSS using `@import "tailwindcss"` / `@theme` in `app/globals.css`.

## Development methodology

This project follows **Spec Driven Design** using the `/spec` and `/spec-impl` skills from `Klerith/fernando-skills`. New features should start with a spec before implementation.
