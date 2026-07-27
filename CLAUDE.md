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
- Integrar un juego canvas ya diseñado: `/add-game <slug>`.
- Implementar una spec de **juego nuevo** con cierre automatizado: `/spec-impl-game <NN-spec-name>` (`.claude/skills/spec-impl-game/SKILL.md`). Extiende `/spec-impl`: ejecuta las Fases 1-4 estándar (identificar spec → validar `Approved` → crear rama `spec-NN-slug` → implementar plan paso a paso con pausas) y, al terminar, agrega la Fase 5 que infiere el slug del juego desde `lib/data.ts` (`GAMES[]`) y dispara **en secuencia, nunca en paralelo** los subagentes `skin-designer` (5A) y `mobile-porter` (5B), cada uno con confirmación explícita (`sí` / `saltar` / `cancelar`). El estado de la spec permanece `Approved` durante todo el flujo — pasarlo a `Implementado` sigue siendo decisión humana tras verificar criterios de aceptación. Usalo en lugar de `/spec-impl` cuando la spec sea de un juego nuevo de Arcade Vault.

## Subagentes

- **`game-planner`** (`.claude/agents/game-planner.md`) — planifica y decide qué juego retro encaja con la plataforma. Analiza gaps del catálogo (categoría, color, mecánica) y propone ideas nuevas. Mantiene memoria persistente de todo lo propuesto en `references/game-suggestions-todo.md` (aprobados / propuestos / descartados / implementados) para no repetirse entre invocaciones. Interactivo por defecto: pregunta categoría, cantidad, color y restricciones antes de proponer. Invocalo cuando necesites ideas de próximos juegos; después de aprobar una propuesta, seguí con `/add-game <slug>`.
- **`game-jam`** (`.claude/agents/game-jam.md`) — a partir de un tema creativo (ej: "cyberpunk", "ninjas espaciales"), diseña un juego retro completo y genera 3 specs en `specs/game-jam/[slug]/` (`01-concept.md`, `02-design.md`, `03-integration.md`). Interactivo: pregunta tema, categoría, color, mecánica y restricciones; presenta un resumen y espera aprobación antes de escribir. Comparte memoria con `game-planner` vía `references/game-suggestions-todo.md` (marca el juego como PROPUESTO). Invocalo cuando quieras un juego nuevo desde cero con enfoque temático; después seguí con `/add-game <slug>` o `/spec-impl` sobre el spec `03-integration.md`.
- **`skin-designer`** (`.claude/agents/skin-designer.md`) — diseña e implementa skins para **un juego a la vez** (nunca en batch). Garantiza que el juego elegido tenga al menos `neon`, `retro` y `clasico`, validadas por contraste WCAG sobre el shell oscuro (`--bg` `#0a0a0f`). Mantiene memoria persistente en `references/game-with-template.md` (Implementados / Parcialmente / Pendientes). Interactivo: pregunta qué juego trabajar + qué skins + restricciones estéticas; presenta paletas con preview de contraste y espera aprobación explícita antes de editar `public/[slug]/game.js` y `components/[Slug]Game.tsx` (agrega `SKIN_COLORS`, `SKIN_BG`, selector y `localStorage` key `[slug]-skin`). Conserva skins extras existentes (ej. `pastel`/`pixel` de Tetris). Invocalo cuando quieras completar o revisar las skins de un juego específico.

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
