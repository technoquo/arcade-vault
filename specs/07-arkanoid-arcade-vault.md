# SPEC 07 — Integración de ARKANOID en Arcade Vault

> **Status:** Draft
> **Depends on:** 05-games-leaderboard
> **Date:** 2026-07-24
> **Objective:** Integrar el juego ARKANOID (slug: `arkanoid`) como página jugable en Arcade Vault con leaderboard Top 12 conectado a Supabase.

---

## Scope

**In:**

- `public/arkanoid/game.js` — archivo del juego copiado de la fuente indicada.
- `public/arkanoid/assets/spritesheet.js` — dependencia de sprites, debe cargarse antes que `game.js`.
- `public/arkanoid/assets/spritesheet-breakout.png` — imagen del spritesheet.
- `public/arkanoid/assets/sounds/ball-bounce.mp3` y `break-sound.mp3` — efectos de sonido.
- `lib/data.ts` — nueva entrada en el array `GAMES[]`.
- Registro en tabla `games` de Supabase (slug: `arkanoid`).
- `components/ArkanoidGame.tsx` — wrapper React con canvas escalable y callback `onGameOver`.
- `app/juego/[id]/jugar/page.tsx` — branch condicional que renderiza el nuevo componente.
- Conexión de `window.onGameOver(score)` en `game.js` (no está integrado actualmente).

**Out of scope (para futuros specs):**

- Modificaciones a la lógica interna del juego (balanceo, mecánicas, nuevas features).
- Panel de administración para gestionar juegos desde la UI.
- Soporte táctil / controles móviles.
- Tests automatizados.
- Cover image CSS (`.cover-arkanoid`) en `app/globals.css` — próximo paso pero no bloquea.

---

## Data model

**Entrada en `lib/data.ts`:**

```ts
{
  id: "arkanoid",
  title: "ARKANOID",
  short: "Rompe los bloques antes de perder todas las vidas.",
  long: "Paleta, pelota y muros de bloques cromáticos. Destruye cada fila antes de que se te acaben las vidas.",
  cat: "ARCADE",
  cover: "cover-arkanoid",
  color: "magenta",
  best: 10000,
  plays: "0",
}
```

**Fila en tabla `games` de Supabase:**

```sql
insert into games (slug, name, description)
values (
  'arkanoid',
  'ARKANOID',
  'Rompe los bloques antes de perder todas las vidas.'
);
```

---

## Implementation plan

1. **Copiar assets a `public/arkanoid/`** — copiar `game.js`, `assets/spritesheet.js`, `assets/spritesheet-breakout.png`, `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3` desde `references/started-games/04-arkanoid/`. Verificación: `public/arkanoid/game.js` existe.

2. **Registrar en `lib/data.ts`** — agregar la entrada `arkanoid` al array `GAMES[]`. Verificación: el juego aparece en el catálogo de la home.

3. **Registrar en Supabase** — ejecutar el INSERT en la tabla `games`. Verificación: `select id, slug from games where slug = 'arkanoid'` devuelve una fila.

4. **Analizar `game.js`** — confirmar dimensiones (800×600), canvas ID (`gameCanvas`), y localizar el punto exacto de game-over para insertar `window.onGameOver`. Verificación: resumen de análisis mostrado al usuario.

5. **Crear `components/ArkanoidGame.tsx`** — wrapper con canvas escalable via `ResizeObserver`, carga de `assets/spritesheet.js` antes de `game.js` via dos `<Script>` secuenciales, y exposición de `window.onGameOver`. Verificación: el archivo compila sin errores de TypeScript.

6. **Conectar `window.onGameOver` en `game.js`** — insertar la llamada en el bloque `if (state.lives === 0)` (línea ~202). Requiere aprobación explícita del usuario tras ver el diff. Verificación: el diff es mínimo y no toca lógica de juego.

7. **Conectar en `app/juego/[id]/jugar/page.tsx`** — agregar import de `ArkanoidGame` y branch `id === "arkanoid"` en el condicional de renderizado. Verificación: navegar a `/juego/arkanoid/jugar` carga el componente.

8. **Verificación TypeScript** — ejecutar `npx tsc --noEmit`. Verificación: salida limpia, sin errores.

---

## Acceptance criteria

- [ ] `public/arkanoid/game.js` existe y coincide con la fuente de referencia.
- [ ] `public/arkanoid/assets/spritesheet.js` y `spritesheet-breakout.png` existen.
- [ ] `public/arkanoid/assets/sounds/ball-bounce.mp3` y `break-sound.mp3` existen.
- [ ] Navegar a `/juego/arkanoid/jugar` carga la página sin errores en consola.
- [ ] El canvas muestra el juego Arkanoid en ejecución con sprites visibles.
- [ ] Al terminar la partida (vidas = 0) aparece el modal con la puntuación obtenida.
- [ ] Guardar el score lo inserta en la tabla `scores` de Supabase y refresca el leaderboard.
- [ ] Un usuario no autenticado puede guardar un score introduciendo su nombre.
- [ ] El leaderboard es visible para cualquier visitante sin iniciar sesión.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** `game.js` sin modificaciones a la lógica + `<Script strategy="afterInteractive">`. El canvas debe existir en el DOM antes de que el script lo busque.
- **Sí:** Dos `<Script>` secuenciales en el componente: primero `assets/spritesheet.js` (con `onLoad` que activa el segundo), luego `game.js`. Requerido porque `game.js` llama a `loadSpritesheet()` y `drawSprite()` que solo existen tras cargar el primero.
- **Sí:** Escalado CSS con `transform: scale()` + `ResizeObserver`. Mantiene las coordenadas internas intactas sin tocar el juego.
- **Sí:** `window.onGameOver(score)` como contrato entre `game.js` y React. Mínima superficie de integración.
- **Sí:** `user_id` nullable en scores. Permite partidas anónimas sin romper el leaderboard.
- **Sí:** Slug `arkanoid` como nueva entrada independiente (no reutiliza `bloque-buster` que ya existe en `lib/data.ts` como juego conceptual diferente).
- **No:** Autenticación obligatoria para jugar o guardar scores.
- **No:** Modificaciones a la lógica de juego — fuera de scope de una integración.
- **No:** Soporte touch/móvil — el juego usa teclado y ratón exclusivamente.

---

## Risks

| Riesgo                                                                                      | Mitigación                                                                                                      |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `assets/spritesheet.js` no cargado antes de `game.js`                                       | Usar `onLoad` en el primer `<Script>` para activar el segundo; nunca cargar ambos en paralelo.                  |
| El canvas `gameCanvas` no existe en el DOM cuando `game.js` ejecuta `getElementById`        | `strategy="afterInteractive"` garantiza que el DOM está listo; el `useEffect` monta el canvas antes del script. |
| Sonidos bloqueados por política de autoplay del navegador                                   | `game.js` ya usa `.play().catch(() => {})` — los errores se silencian correctamente.                            |
| `window.onGameOver` sobrescrito si el usuario recarga la partida sin remontar el componente | El `useEffect` de cleanup elimina `window.onGameOver` al desmontar; se reasigna en cada montaje.                |

---

## What is **not** in this spec

- Cover image CSS (`.cover-arkanoid`) — si se añade, va en su propio cambio puntual.
- Soporte táctil / controles móviles.
- Modificaciones a la lógica interna del juego.
- Panel de administración para gestionar juegos.
- Tests automatizados.
