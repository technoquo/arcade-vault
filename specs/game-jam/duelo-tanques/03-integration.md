# SPEC — Integración de DUELO DE TANQUES en Arcade Vault (game-jam)

> **Status:** Propuesto
> **Depends on:** 05-games-leaderboard, `01-concept.md`, `02-design.md`
> **Date:** 2026-07-26
> **Objective:** Integrar el juego DUELO DE TANQUES (slug: `duelo-tanques`) como página jugable en Arcade Vault con leaderboard Top 12 conectado a Supabase.

---

## Scope

**In:**

- `public/duelo-tanques/game.js` — juego vanilla JS/canvas creado desde cero según `02-design.md`.
- `lib/data.ts` — nueva entrada en el array `GAMES[]`.
- Registro en tabla `games` de Supabase (slug: `duelo-tanques`).
- `components/DueloTanquesGame.tsx` — wrapper React con canvas escalable y callback `onGameOver`.
- `app/juego/[id]/jugar/page.tsx` — branch condicional que renderiza el nuevo componente.
- `window.onGameOver(score)` integrado desde el diseño en `game.js` (score = `roundsWonP1`, rango 0–5).

**Out of scope (para futuros specs):**

- Modificaciones a la lógica interna del juego (balanceo de cooldown, velocidad, cantidad de rebotes).
- Sonidos (disparo, explosión, rebote) — el diseño no los incluye para no bloquear autoplay.
- Sprites custom para tanques — el diseño usa solo formas geométricas.
- Modo single-player vs CPU (el juego es exclusivamente 1v1 local).
- Panel de administración para gestionar juegos desde la UI.
- Soporte táctil / controles móviles — el juego requiere teclado con al menos 8 teclas simultáneas.
- Tests automatizados.
- Cover image CSS (`.cover-duelo-tanques`) — próximo paso puntual, no bloquea la integración.

---

## Data model

**Entrada en `lib/data.ts`:**

```ts
{
  id: "duelo-tanques",
  title: "DUELO DE TANQUES",
  short: "Dos tanques, un laberinto, un solo superviviente.",
  long: "Duelo local a dos jugadores: pilotá tu tanque por un laberinto de muros destructibles, apuntá con precisión y disparás proyectiles que rebotan hasta 3 veces. El primero en ganar 5 rondas se corona.",
  cat: "VERSUS",
  cover: "cover-duelo-tanques",
  color: "magenta",
  best: 5,
  plays: "0",
}
```

**Fila en tabla `games` de Supabase:**

```sql
insert into games (slug, name, description)
values (
  'duelo-tanques',
  'DUELO DE TANQUES',
  'Dos tanques, un laberinto, un solo superviviente.'
);
```

---

## Implementation plan

1. **Crear `public/duelo-tanques/game.js`** siguiendo el diseño de `02-design.md`: canvas 800×600, grid interno 20×15 celdas de 40px, dos tanques con rotación + traslación, proyectiles con rebote (hasta 3), colisiones AABB, generación de laberinto con validación de conectividad BFS, cooldown de disparo 500ms, `endGame()` que llama `window.onGameOver(state.roundsWonP1)`. Verificación: `public/duelo-tanques/game.js` existe y abrir un HTML manual con el canvas muestra el laberinto renderizado.

2. **Registrar en `lib/data.ts`** — agregar la nueva entrada al final del array `GAMES[]`. Verificar que el slug `duelo-tanques` no colisiona con ningún `id` existente. Verificación: el juego aparece en el catálogo de la home filtrado por categoría VERSUS.

3. **Registrar en Supabase** — ejecutar el INSERT en la tabla `games`. Idempotente con `on conflict (slug) do nothing`. Verificación: `select id, slug from games where slug = 'duelo-tanques'` devuelve una fila.

4. **Crear `components/DueloTanquesGame.tsx`** — wrapper React con:
   - Canvas de 800×600 con id `"canvas"`.
   - Escalado CSS via `transform: scale()` + `ResizeObserver` que preserve el aspect ratio 4:3.
   - Un único `<Script strategy="afterInteractive" src="/duelo-tanques/game.js">` (no hay dependencias de sprites).
   - `useEffect` que expone `window.onGameOver = (score) => onGameOver(score)` al montar y lo limpia al desmontar.
   - Prop `onGameOver: (finalScore: number) => void` en la interfaz del componente.

   Verificación: el archivo compila sin errores de TypeScript.

5. **Conectar en `app/juego/[id]/jugar/page.tsx`** — agregar import de `DueloTanquesGame` y branch condicional `id === "duelo-tanques"` en la cadena de renderizado, antes del bloque `else` final. Verificación: navegar a `/juego/duelo-tanques/jugar` carga el componente.

6. **Verificación TypeScript** — ejecutar `npx tsc --noEmit`. Verificación: salida limpia, sin errores.

---

## Acceptance criteria

- [ ] `public/duelo-tanques/game.js` existe y el canvas renderiza el laberinto con dos tanques en esquinas opuestas.
- [ ] Navegar a `/juego/duelo-tanques/jugar` carga la página sin errores en consola.
- [ ] J1 responde a `W`/`A`/`S`/`D` y `Space`; J2 responde a flechas y `Enter`. Ambos jugadores pueden actuar simultáneamente sin conflictos de teclado.
- [ ] Los proyectiles rebotan hasta 3 veces en muros indestructibles y destruyen muros destructibles al primer impacto.
- [ ] Un impacto de proyectil en cualquier tanque termina la ronda; el otro tanque suma 1 punto; tras ~1.5s se regenera el laberinto y ambos respawnean.
- [ ] Un proyectil propio que rebota puede matar a su dueño (fuego amigo por rebote).
- [ ] Al llegar cualquiera de los dos jugadores a 5 rondas, aparece el modal con la puntuación (rondas ganadas por J1, rango 0–5).
- [ ] Guardar el score lo inserta en la tabla `scores` de Supabase y refresca el leaderboard.
- [ ] Un usuario no autenticado puede guardar un score introduciendo su nombre.
- [ ] El leaderboard Top 12 es visible para cualquier visitante sin iniciar sesión.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** `game.js` sin dependencias externas de build + `<Script strategy="afterInteractive">`. El canvas debe existir en el DOM antes de que el script lo busque.
- **Sí:** Un único `<Script>` (sin dependencias de spritesheets como Arkanoid o Snake). Simplifica el wrapper.
- **Sí:** Escalado CSS con `transform: scale()` + `ResizeObserver`, preservando aspect ratio 4:3. Mantiene las coordenadas internas (px absolutos) intactas sin tocar el juego.
- **Sí:** `window.onGameOver(score)` como contrato entre `game.js` y React. Mínima superficie de integración. Score = `roundsWonP1` (rango 0–5, entero).
- **Sí:** `user_id` nullable en scores. Permite partidas anónimas sin romper el leaderboard.
- **Sí:** J1 es siempre el "jugador principal" desde la óptica del leaderboard. J2 es el oponente aunque comparta teclado.
- **Sí:** Laberinto procedural con validación de conectividad BFS. Regenerado entre rondas.
- **Sí:** Fuego amigo por rebote propio. Elimina la estrategia trivial de "disparar sin parar".
- **No:** Autenticación obligatoria para jugar o guardar scores.
- **No:** Modo single-player vs CPU — el juego es 1v1 local exclusivamente.
- **No:** Sonidos en esta primera integración — evita bloqueos por autoplay policy.
- **No:** Soporte touch/móvil — se requieren teclado y ~9 teclas simultáneas.
- **No:** Modificaciones a la lógica de juego tras la integración.

---

## Risks

| Riesgo                                                                                      | Mitigación                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El canvas no existe en el DOM cuando `game.js` ejecuta `getElementById`                     | `strategy="afterInteractive"` garantiza que el DOM está listo; el `useEffect` monta el canvas antes del script.                                                                |
| `window.onGameOver` sobrescrito si el usuario recarga la partida sin remontar el componente | El `useEffect` de cleanup elimina `window.onGameOver` al desmontar; se reasigna en cada montaje. Aceptar prop `resetKey?: number` como en `SnakeGame` para forzar remontaje.   |
| Colisión de slug con juego existente                                                        | Slug validado en Fase 1 del agente `game-jam` contra `SLUGS_PROHIBIDOS`. `duelo-tanques` está aprobado y no colisiona con ninguna entrada de `GAMES[]`.                        |
| Generación de laberinto sin camino entre spawns                                             | Validación BFS obligatoria en `generateMaze()`; si no hay camino, se borra un muro destructible al azar y se reintenta hasta 20 veces (en la práctica basta con 1-2 intentos). |
| Bloqueo de teclado con >6 teclas simultáneas en teclados de bajo perfil                     | Documentado como limitación — los jugadores con teclados sin N-key rollover pueden experimentar ghosting. No hay mitigación en software; es hardware.                          |
| Score reportado (0–5) confunde al usuario acostumbrado a puntajes altos                     | El modal debe mostrar contexto ("Ganaste 5 de 5 rondas"). Documentar en `01-concept.md` que este juego usa un score cualitativo, no acumulativo.                               |
