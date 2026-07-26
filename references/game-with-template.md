# Juegos con template (skins)

Referencia de qué juegos de Arcade Vault ya tienen las 3 skins estándar (`neon`, `retro`, `clasico`) aplicadas. Cada juego se trabaja **individualmente** — el subagente `skin-designer` nunca modifica varios juegos a la vez.

Convenciones:

- localStorage key por juego: `[slug]-skin`. Fallback: `clasico`.
- Fondo de referencia para contraste: `#0a0a0f` (variable `--bg` en `app/globals.css`).
- Editable a mano — el agente reconcilia en Fase 1 si detecta drift.

## Resumen

| Slug       | Componente      | Skins actuales             | Falta   | Estado       |
| ---------- | --------------- | -------------------------- | ------- | ------------ |
| `tetris`   | `TetrisGame`    | retro, neon, pastel, pixel | clasico | Parcial      |
| `rocas`    | `AsteroidsGame` | clasico, retro, neon       | —       | Implementado |
| `arkanoid` | `ArkanoidGame`  | clasico, retro, neon       | —       | Implementado |
| `snake`    | `SnakeGame`     | clasico, retro, neon       | —       | Implementado |

## Implementados (3 skins estándar completas)

- [x] `rocas` (Asteroids) — tiene `clasico`, `retro`, `neon` · Auditado 2026-07-26
- [x] `arkanoid` — tiene `clasico`, `retro`, `neon` · Nota: bloques usan spritesheet PNG original; tint vía canvas auxiliar con `source-atop` sobre paddle y pelota · Auditado 2026-07-26
- [x] `snake` — tiene `clasico`, `retro`, `neon` · localStorage key `snake-skin`, fallback `clasico` · Auditado 2026-07-26

## Parcialmente implementados

- [ ] `tetris` — tiene `retro`, `neon`, `pastel`, `pixel` · **Falta:** `clasico` · Auditado 2026-07-26

## Diseñados (paleta aprobada, pendiente de código)

_Ninguno todavía._

## Pendientes de diseño

_Ninguno todavía._

## Descartados

_Ninguno._
