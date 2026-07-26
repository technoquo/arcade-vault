# DESIGN TÉCNICO — DUELO DE TANQUES (game-jam)

> **Status:** Propuesto
> **Date:** 2026-07-26
> **Slug:** `duelo-tanques`
> **Depende de:** `01-concept.md`

---

## Canvas

- **Dimensiones:** `800 × 600` px.
- **ID del canvas:** `"canvas"`.
- **Coordenadas internas:** pixel-perfect. Se superpone conceptualmente una grilla de `20 × 15` celdas de `40 px` para colocar muros; los tanques se mueven en coordenadas continuas (px, no celdas).

## Estado interno

```js
const CELL = 40;
const COLS = 20;
const ROWS = 15;

const state = {
  phase: "playing", // "playing" | "round-end" | "match-end"
  maze: [], // ROWS × COLS de valores: 0 vacío, 1 indestructible, 2 destructible
  tanks: [
    // J1 (magenta)
    { x: 60, y: 60, angle: 0, cooldown: 0, alive: true, color: "#f0f", controls: "wasd" },
    // J2 (cyan)
    { x: 740, y: 540, angle: Math.PI, cooldown: 0, alive: true, color: "#0ff", controls: "arrows" },
  ],
  bullets: [], // { x, y, vx, vy, bounces, ownerIdx, ttl }
  roundsWonP1: 0,
  roundsWonP2: 0,
  roundEndTimer: 0, // ms hasta regenerar el laberinto tras una muerte
  running: false,
  keys: {}, // buffer de teclas presionadas
};
```

## Game loop

Frecuencia: `requestAnimationFrame` continuo. Cada frame calcula `dt` en ms y llama:

1. **Input** — lee `state.keys` (actualizado por listeners `keydown`/`keyup`); resuelve intención de cada tanque (rotar, avanzar/retroceder, disparar).
2. **Update** — en orden:
   - Para cada tanque vivo: aplica rotación, calcula posición tentativa, verifica colisión AABB contra muros del grid, aplica movimiento válido.
   - Decrementa `cooldown` de disparo.
   - Si el jugador pulsó disparar y `cooldown === 0`, crea proyectil en la boca del cañón y resetea cooldown a 500ms.
   - Para cada proyectil: avanza `x += vx*dt`, `y += vy*dt`; detecta colisión con muros (rebote o destrucción según tipo); detecta colisión con tanques (mata al tanque); decrementa `ttl`; elimina si supera 3 rebotes o `ttl <= 0`.
   - Si algún tanque murió: `phase = "round-end"`, incrementa `roundsWon` del otro, arranca `roundEndTimer = 1500ms`.
   - Si `phase === "round-end"` y `roundEndTimer <= 0`: si algún `roundsWon >= 5`, `phase = "match-end"` y llama `endGame()`. Si no, regenera `maze`, respawn tanques en esquinas, `phase = "playing"`.
3. **Render** — limpia canvas, dibuja grilla de fondo, dibuja muros (destructibles en gris, indestructibles en blanco), dibuja tanques (rectángulo rotado + cañón lineal), dibuja proyectiles (círculo pequeño + estela), dibuja HUD superior con marcador de rondas.

## Input handling

| Tecla     | Acción                |
| --------- | --------------------- |
| `W` / `S` | J1 avanza / retrocede |
| `A` / `D` | J1 rota izq / der     |
| `Space`   | J1 dispara            |
| `↑` / `↓` | J2 avanza / retrocede |
| `←` / `→` | J2 rota izq / der     |
| `Enter`   | J2 dispara            |

- Los inputs se leen del buffer `state.keys` en cada tick (no del evento directo). Esto permite que el mismo `keydown` sostenido siga moviendo el tanque frame a frame.
- `event.preventDefault()` en `Space`, flechas y `Enter` para evitar scroll de la página.

## Sistema de colisiones

- **Tanque vs muro:** AABB del tanque (`36×36 px` centrado en la posición) contra los rectángulos de las celdas ocupadas por muros. Si hay colisión en la posición tentativa, se rechaza el movimiento en el eje correspondiente (probar X e Y por separado para permitir deslizamiento paralelo a la pared).
- **Proyectil vs muro:**
  - **Indestructible (borde):** rebote — invertir `vx` si la colisión es vertical, `vy` si es horizontal; `bounces++`.
  - **Destructible (interior):** eliminar la celda del `maze` (celda = 0) y eliminar el proyectil. No rebota.
- **Proyectil vs tanque:** distancia < 20px al centro del tanque → matar tanque (`alive = false`), eliminar proyectil. Aplica también contra el tanque propietario del proyectil (fuego amigo por rebote propio).
- **Proyectil expira:** cuando `bounces > 3` o `ttl <= 0` (default `ttl = 5000ms`).

## Sistema de scoring

- **Durante la partida:** solo se contabilizan rondas (`roundsWonP1`, `roundsWonP2`). No hay puntos por muros destruidos ni por movimientos.
- **Al terminar el match:** el score que se reporta al leaderboard es `state.roundsWonP1` (0–5).
- **Sin multiplicadores ni combos.** El match es de suma cero — la victoria de J1 en una ronda no depende de nada más que de sobrevivir.

## Condiciones de game-over

- **Fin de ronda (no dispara `onGameOver`):** un tanque muere → el otro suma 1 ronda → tras 1500ms de pausa, regenera laberinto y respawnea ambos tanques.
- **Fin de match (dispara `onGameOver`):** `roundsWonP1 === 5` o `roundsWonP2 === 5` → `phase = "match-end"` → llama `endGame()`.

## Assets requeridos

- **Sprites:** **ninguno** — solo formas geométricas (rectángulos rotados para tanques, líneas para cañones, círculos para proyectiles, rectángulos rellenos para muros).
- **Sonidos:** **ninguno en scope** — para no bloquear la integración con autoplay policies. Se puede agregar en un spec futuro (disparo, explosión, rebote).
- **Fuentes:** ninguna adicional — usa la tipografía monoespaciada global del proyecto.

Consecuencia: `public/duelo-tanques/` contendrá **únicamente** `game.js`. Sin subdirectorio de assets.

## Integración con Arcade Vault

Pseudocódigo del cierre de match que dispara el modal:

```js
function endGame() {
  state.running = false;
  state.phase = "match-end";
  const finalScore = state.roundsWonP1;
  if (typeof window.onGameOver === "function") {
    window.onGameOver(finalScore);
  }
}
```

Este callback es el único puente entre `game.js` (vanilla) y el wrapper React. No debe haber otras dependencias globales.

## Generación de laberinto

Función `generateMaze()` llamada al inicio del match y entre rondas:

1. Rellena bordes (`row === 0 || row === ROWS-1 || col === 0 || col === COLS-1`) con `1` (indestructible).
2. Deja las celdas de spawn libres (`(1,1)`, `(1,2)`, `(2,1)` para J1; simétrico en la esquina opuesta para J2).
3. Para cada celda interior restante, con probabilidad 0.25 asigna `2` (destructible).
4. **Validación de conectividad:** BFS desde el spawn de J1 hasta el spawn de J2 tratando `2` como pasable. Si no hay camino, borrar un muro destructible al azar y reintentar (máx 20 intentos; en la práctica basta con 1-2).
