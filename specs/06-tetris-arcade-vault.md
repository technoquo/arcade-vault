# SPEC 06 — Integración de TETRIS en Arcade Vault

> **Status:** Aprobado
> **Depends on:** 05-games-leaderboard
> **Date:** 2026-07-24
> **Objective:** Integrar el juego TETRIS (slug: `tetris`) como página jugable en Arcade Vault con leaderboard Top 12 conectado a Supabase.

---

## Scope

**In:**

- `public/tetris/game.js` — archivo del juego copiado de `references/started-games/03-tetris/`.
- `public/tetris/style.css` — estilos del juego copiados de la misma fuente.
- `lib/data.ts` — nueva entrada en el array `GAMES[]`.
- Registro en tabla `games` de Supabase (slug: `tetris`).
- `components/TetrisGame.tsx` — wrapper React con canvas escalable y callback `onGameOver`.
- `app/juego/[id]/jugar/page.tsx` — branch condicional que renderiza `TetrisGame`.
- Conexión de `window.onGameOver(score)` en `public/tetris/game.js` (si no está ya).

**Out of scope (para futuros specs):**

- Modificaciones a la lógica interna del juego (balanceo, velocidad, nuevas mecánicas).
- Panel de administración para gestionar juegos desde la UI.
- Soporte táctil / controles móviles.
- Tests automatizados.
- Cover image CSS (`.cover-tetris`) si no existe — próximo paso manual, no bloquea la integración.
- Canvas de preview de siguiente pieza (`#next-canvas`) — solo el tablero principal se integra en el wrapper.

---

## Data model

**Entrada en `lib/data.ts`:**

```ts
{
  id: "tetris",
  title: "TETRIS",
  short: "Completa líneas antes de que el tablero se llene.",
  long: "Tetris es un videojuego de rompecabezas creado en 1984 por el ingeniero soviético Alexey Pajitnov. Es uno de los videojuegos más famosos y populares de la historia.",
  cat: "ARCADE",
  cover: "cover-tetris",
  color: "green",
  best: 10000,
  plays: "0",
}
```

**Fila en tabla `games` de Supabase:**

```sql
insert into games (slug, name, description)
values (
  'tetris',
  'TETRIS',
  'Completa líneas antes de que el tablero se llene.'
);
```

---

## Implementation plan

1. **Copiar assets** — Copiar `game.js` y `style.css` de `references/started-games/03-tetris/`
   a `public/tetris/`. Verificar que `public/tetris/game.js` existe antes de continuar.

2. **Registrar en `lib/data.ts`** — Agregar la nueva entrada al array `GAMES[]` con los
   valores confirmados. Verificar que el juego aparece en el catálogo.

3. **Registrar en Supabase** — Ejecutar `INSERT INTO games` con slug `tetris`. Verificar
   la fila con `SELECT` antes de continuar.

4. **Analizar `game.js`** — Detectar dimensiones del canvas (`300×600`, id `"board"`),
   punto de game-over (`endGame()`), y si `window.onGameOver` ya está conectado.

5. **Crear `components/TetrisGame.tsx`** — Wrapper React con `ResizeObserver` para escalar
   el canvas, `useEffect` que expone `window.onGameOver`, y `<Script strategy="afterInteractive">`.

6. **Conectar `window.onGameOver` en `game.js`** — Insertar la llamada en el punto de
   game-over detectado en el Paso 4, con aprobación explícita del usuario antes de modificar.

7. **Conectar en `app/juego/[id]/jugar/page.tsx`** — Agregar import de `TetrisGame` y
   branch condicional `id === "tetris"` antes del bloque else final.

8. **Verificación TypeScript** — Ejecutar `npx tsc --noEmit`. Corregir cualquier error
   hasta obtener salida limpia.

---

## Acceptance criteria

- [ ] `public/tetris/game.js` existe y coincide con la fuente de referencia.
- [ ] Navegar a `/juego/tetris/jugar` carga la página sin errores en consola.
- [ ] El canvas `#board` muestra el juego Tetris en ejecución.
- [ ] Las piezas descienden, rotan y se bloquean correctamente.
- [ ] Al completar la partida (tablero lleno) aparece el modal con la puntuación obtenida.
- [ ] Guardar el score lo inserta en la tabla `scores` de Supabase y refresca el leaderboard.
- [ ] Un usuario no autenticado puede guardar un score introduciendo su nombre.
- [ ] El leaderboard Top 12 es visible para cualquier visitante sin iniciar sesión.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** `game.js` sin modificaciones a la lógica + `<Script strategy="afterInteractive">`.
  El canvas `#board` debe existir en el DOM antes de que el script lo busque.
- **Sí:** Escalado CSS con `transform: scale()` + `ResizeObserver`. Mantiene las
  coordenadas internas intactas sin tocar el juego.
- **Sí:** `window.onGameOver(score)` como contrato entre `game.js` y React. Mínima
  superficie de integración.
- **Sí:** `user_id` nullable en scores. Permite partidas anónimas sin romper el leaderboard.
- **Sí:** Solo se integra el canvas principal `#board` (300×600). El canvas de preview
  `#next-canvas` queda fuera del wrapper — el juego lo gestiona internamente.
- **No:** Autenticación obligatoria para jugar o guardar scores.
- **No:** Modificaciones a la lógica de juego — fuera de scope de una integración.
- **No:** `style.css` del juego se copia a `public/tetris/` pero no se importa en el
  componente React; el escalado se maneja vía CSS inline en el wrapper.

---

## Risks

| Riesgo                                                                                    | Mitigación                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game.js` usa dos canvas (`#board` y `#next-canvas`) — el wrapper solo renderiza `#board` | El juego busca `#next-canvas` en el DOM; si no existe, puede lanzar error. Verificar en el Paso 4 y añadir el segundo canvas al wrapper si es necesario. |
| `window.onGameOver` no existe en `game.js` — el modal no se activa                        | Leer el código antes de implementar; añadir la llamada en `endGame()` con aprobación del usuario.                                                        |
| El juego arranca antes de que React monte el canvas                                       | `strategy="afterInteractive"` garantiza que el DOM está listo; si el juego usa `DOMContentLoaded`, puede necesitar ajuste.                               |
