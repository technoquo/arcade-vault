# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Arcade Vault** — plataforma online para jugar juegos retro y competir por el mayor puntaje. Built with Next.js 15 App Router, React 19, TypeScript (strict), and Tailwind CSS v4.

**Tech stack:**

- **Framework:** Next.js 15 App Router + React 19
- **Styling:** Tailwind CSS v4 via PostCSS (no `tailwind.config`; config via `@theme` in `app/globals.css`)
- **Backend/DB:** Supabase (auth + `games` y `scores` tables)
- **Email:** Resend (formulario de contacto en `/about`)
- **Testing:** No test runner configured yet.

## Skills

- Usa siempre `/frontend-design` para diseñar la interfaz del usuario.
- Nuevas features: empieza con `/spec` y luego implementa con `/spec-impl`.

## Architecture

```
app/
  layout.tsx              ← root shell (fonts, global CSS, UserProvider)
  page.tsx                ← home/landing
  about/page.tsx          ← about + contact form (Resend)
  auth/page.tsx           ← login/signup (Supabase Auth: email+password y OAuth)
  juegos/page.tsx         ← catálogo de juegos (server component, fetch desde Supabase)
  juego/[id]/page.tsx     ← detalle del juego
  juego/[id]/jugar/page.tsx ← pantalla de juego + HUD + leaderboard lateral
  salon/page.tsx          ← Salón de la Fama (top scores por juego, podium, tabla)
  api/
    contact/route.ts      ← POST para envío de email vía Resend
    scores/route.ts       ← GET (top 12 por juego) / POST (guardar score) vía Supabase

components/
  Nav.tsx                 ← nav server component
  NavClient.tsx           ← nav client (sesión de usuario)
  AsteroidsGame.tsx       ← juego Asteroids (canvas)
  TetrisGame.tsx          ← juego Tetris (canvas)
  ArkanoidGame.tsx        ← juego Arkanoid (canvas + spritesheet)
  SnakeGame.tsx           ← juego Snake (canvas, acepta resetKey prop)

context/
  UserContext.tsx         ← UserProvider + useUser hook (estado local de usuario/scores)

lib/
  supabase/client.ts      ← createClient() para browser
  supabase/server.ts      ← createClient() para server components / route handlers
  data.ts                 ← tipos (Game, ScoreEntry, SavedScore, AuthUser), GAMES[], CATS[], seededScores()

middleware.ts             ← Supabase auth middleware (refresca sesión en cada request)
specs/                    ← especificaciones de cada feature (Spec Driven Design)
public/                   ← assets estáticos (spritesheets, sonidos, fuentes)
```

**Path alias:** `@/*` resuelve a la raíz del repo.

## Supabase — tablas principales

- **`games`**: `id`, `slug`, `name`, `description` — catálogo de juegos.
- **`scores`**: `id`, `game_id` (FK), `player_name`, `score`, `user_id` (nullable), `created_at`.

## Juegos implementados

| Slug       | Componente      | Estado       |
| ---------- | --------------- | ------------ |
| `rocas`    | `AsteroidsGame` | Implementado |
| `tetris`   | `TetrisGame`    | Implementado |
| `arkanoid` | `ArkanoidGame`  | Implementado |
| `snake`    | `SnakeGame`     | Implementado |

Los juegos reciben `onGameOver(finalScore: number)` para reportar el puntaje final. `SnakeGame` también acepta `resetKey: number` para reiniciar.

## Flujo de score

1. Al terminar el juego, se muestra modal con puntaje final.
2. El jugador ingresa sus iniciales (máx 10 chars, se convierte a mayúsculas).
3. Se llama `POST /api/scores` con `{ game_slug, player_name, score, user_id? }`.
4. El leaderboard lateral se refresca automáticamente.

## Development methodology

Este proyecto sigue **Spec Driven Design** con `/spec` y `/spec-impl` (skills de `Klerith/fernando-skills`). Toda nueva feature debe tener su spec en `specs/` antes de implementarse.
