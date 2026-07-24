# SPEC 08 — Integración de SNAKE en Arcade Vault

> **Status:** Draft
> **Depends on:** 05-games-leaderboard
> **Date:** 2026-07-24
> **Objective:** Integrar el juego SNAKE (slug: `snake`) como página jugable en Arcade Vault con leaderboard Top 12 conectado a Supabase, creando el game.js desde cero con sprites de frutas.

---

## Scope

**In:**

- `public/snake/game.js` — juego Snake vanilla JS/canvas creado desde cero.
- `public/snake/snake-assets/fruits.png` — spritesheet de frutas (copiado de references/).
- `public/snake/snake-assets/sprites.js` — atlas de coordenadas de sprites (copiado de references/).
- `lib/data.ts` — nueva entrada en el array `GAMES[]`.
- Registro en tabla `games` de Supabase (slug: `snake`).
- `components/SnakeGame.tsx` — wrapper React con canvas escalable y callback `onGameOver`.
- `app/juego/[id]/jugar/page.tsx` — branch condicional que renderiza el nuevo componente.
- `window.onGameOver(score)` integrado desde el diseño en `game.js`.

**Out of scope (para futuros specs):**

- Modificaciones a la lógica interna del juego (power-ups, niveles, balanceo).
- Panel de administración para gestionar juegos desde la UI.
- Soporte táctil / controles móviles.
- Tests automatizados.
- Cover image CSS (`.cover-snake`) — ya existe en globals.css de la entrada "serpentina".

---

## Data model

**Entrada en `lib/data.ts`:**

```ts
{
  id: "snake",
  title: "SNAKE",
  short: "Come frutas y crece sin morder tu cola.",
  long: "Una serpiente hambrienta recorre la cuadrícula devorando frutas exóticas. Come más para crecer y sumar puntos, pero jamás toques los bordes ni tu propia cola.",
  cat: "ARCADE",
  cover: "cover-snake",
  color: "green",
  best: 10000,
  plays: "0",
}
```

**Fila en tabla `games` de Supabase:**

```sql
insert into games (slug, name, description)
values ('snake', 'SNAKE', 'Come frutas y crece sin morder tu cola.');
```

**Estado interno del juego (`game.js`):**

```js
// Grid 28×28 celdas de 20px → canvas 560×560 px
const state = {
  snake: [{ x, y }], // array de segmentos, cabeza en [0]
  food: { x, y, spriteKey },
  score: 0,
  speed: 150, // ms entre ticks; decrece con el score
  dir: { x: 1, y: 0 }, // dirección actual
  nextDir: { x, y }, // bufferiza el siguiente cambio de dirección
  running: false,
};
```

---

## Implementation plan

1. **Copiar assets** (`public/snake/snake-assets/`) — fruits.png y sprites.js desde references/source-assets/snake-assets/. Verificar que los archivos existen en destino.

2. **Registrar en `lib/data.ts`** — nueva entrada al final del array GAMES[]. Verificar que el slug `snake` no colisiona con ningún id existente.

3. **Registrar en Supabase** — `insert into games` con `on conflict (slug) do nothing`. Verificar con select.

4. **Crear `public/snake/game.js`** — Snake vanilla JS completo: grid 28×28, sprites de frutas del SPRITE_ATLAS, puntuación diferenciada por tipo de fruta, velocidad progresiva, `window.onGameOver(score)` en el punto de game-over.

5. **Crear `components/SnakeGame.tsx`** — wrapper con dos `<Script>` (sprites.js primero, game.js después), canvas 560×560 con id `"canvas"`, escalado CSS con ResizeObserver, y exposición de `window.onGameOver` via useEffect.

6. _(Omitido — `window.onGameOver` ya integrado en el Paso 4.)_

7. **Conectar en `app/juego/[id]/jugar/page.tsx`** — import SnakeGame y nuevo branch `id === "snake"` en la cadena condicional, antes del bloque else final.

8. **Verificación TypeScript** — `npx tsc --noEmit` debe pasar sin errores.

---

## Acceptance criteria

- [ ] `public/snake/game.js` existe y el canvas renderiza la serpiente en movimiento.
- [ ] Navegar a `/juego/snake/jugar` carga la página sin errores en consola.
- [ ] La serpiente responde a las teclas de flecha y WASD.
- [ ] Comer una fruta alarga la serpiente, incrementa el score y muestra una nueva fruta diferente.
- [ ] Chocar con el borde o con la propia cola dispara el modal "FIN DEL JUEGO".
- [ ] El modal muestra la puntuación correcta (la del juego, no el ticker de la HUD).
- [ ] Guardar el score lo inserta en la tabla `scores` de Supabase y refresca el leaderboard.
- [ ] Un usuario no autenticado puede guardar un score introduciendo su nombre.
- [ ] El leaderboard es visible para cualquier visitante sin iniciar sesión.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** `game.js` sin dependencias externas de build + `<Script strategy="afterInteractive">`. El canvas debe existir en el DOM antes de que el script lo busque.
- **Sí:** sprites.js cargado en su propio `<Script>` antes de game.js, para que `window.SPRITE_ATLAS` esté disponible cuando game.js se ejecute.
- **Sí:** Escalado CSS con `transform: scale()` + `ResizeObserver`. Mantiene las coordenadas internas (20px/celda) intactas sin tocar el juego.
- **Sí:** `window.onGameOver(score)` como contrato entre `game.js` y React. Mínima superficie de integración.
- **Sí:** `user_id` nullable en scores. Permite partidas anónimas sin romper el leaderboard.
- **Sí:** Game.js creado desde cero — no existe referencia preexistente de snake en el proyecto.
- **No:** Autenticación obligatoria para jugar o guardar scores.
- **No:** Modificaciones a la lógica de juego tras la integración.
- **No:** Implementar el placeholder "serpentina" en este spec — son slugs distintos.

---

## Risks

| Riesgo                                                                             | Mitigación                                                                                                                                          |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `window.SPRITE_ATLAS` no disponible cuando `game.js` se ejecuta                    | sprites.js se carga en `<Script>` separado con prioridad anterior a game.js; game.js espera en `window.onload` o comprueba la existencia del atlas. |
| La imagen `fruits.png` tarda en cargar y el canvas queda en blanco el primer frame | Usar `img.onload` en game.js antes de arrancar el loop; mostrar la serpiente inmediatamente pero esperar la imagen para las frutas.                 |
| Colisión de slug con la entrada "serpentina" existente en data.ts                  | Son ids distintos (`snake` vs `serpentina`); no hay colisión. Verificado en lectura de data.ts.                                                     |
