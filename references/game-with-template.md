# Juegos con template (skins)

Referencia de qué juegos de Arcade Vault ya tienen las 3 skins estándar (`neon`, `retro`, `clasico`) aplicadas. Cada juego se trabaja **individualmente** — el subagente `skin-designer` nunca modifica varios juegos a la vez.

Convenciones:

- localStorage key por juego: `[slug]-skin`. Fallback: `clasico`.
- Fondo de referencia para contraste: `#0a0a0f` (variable `--bg` en `app/globals.css`).
- Editable a mano — el agente reconcilia en Fase 1 si detecta drift.

## Resumen

| Slug       | Componente      | Skins actuales             | Falta                | Estado                  |
| ---------- | --------------- | -------------------------- | -------------------- | ----------------------- |
| `tetris`   | `TetrisGame`    | retro, neon, pastel, pixel | clasico              | Parcial                 |
| `rocas`    | `AsteroidsGame` | clasico, retro, neon       | —                    | Implementado            |
| `arkanoid` | `ArkanoidGame`  | —                          | neon, retro, clasico | Pendiente (spritesheet) |
| `snake`    | `SnakeGame`     | —                          | neon, retro, clasico | Pendiente               |

## Implementados (3 skins estándar completas)

- [x] `rocas` (Asteroids) — tiene `clasico`, `retro`, `neon` · Auditado 2026-07-26

## Parcialmente implementados

- [ ] `tetris` — tiene `retro`, `neon`, `pastel`, `pixel` · **Falta:** `clasico` · Auditado 2026-07-26

## Diseñados (paleta aprobada, pendiente de código)

_Ninguno todavía._

## Pendientes de diseño

- [ ] `arkanoid` — 0 skins · **Falta:** `neon`, `retro`, `clasico` (nota: usa spritesheet, puede requerir CSS filters o repintar sprites) · Auditado 2026-07-26
- [ ] `snake` — 0 skins · **Falta:** `neon`, `retro`, `clasico` · Auditado 2026-07-26

## Descartados

_Ninguno._
