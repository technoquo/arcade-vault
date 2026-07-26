# SPEC 10 — Controles Táctiles en Móvil

> **Status:** Draft
> **Depends on:** 09-mobile-responsive-ui
> **Date:** 2026-07-26
> **Objective:** Agregar botones táctiles on-screen para los cuatro juegos en móvil (≤ 639 px),
> permitiendo jugar sin teclado físico dispatching synthetic `KeyboardEvent` sobre `document`.

---

## Scope

**In:**

- `components/TouchControls.tsx` — nuevo componente que renderiza los botones táctiles según el `gameId`.
- `app/juego/[id]/jugar/page.tsx` — importar y montar `<TouchControls gameId={id} />` debajo de `.player-layout`.
- `app/globals.css` — estilos `.touch-controls` y variantes por juego; visibles solo en `max-width: 639px`.

**Out of scope:**

- Soporte de gestos swipe — solo botones.
- Controles táctiles en pantallas ≥ 640 px.
- Controles de pausa / restart / salir táctiles — ya existen botones en el HUD.
- Cambios a los archivos `public/*/game.js`.
- Vibración háptica.

---

## Mapeo de teclas por juego

| Juego     | Evento escucha en   | Usa `e.key` / `e.code`                     | Tipo de input          |
| --------- | ------------------- | ------------------------------------------ | ---------------------- |
| Tetris    | `document keydown`  | `e.code` (`ArrowLeft/Right/Up/Down/Space`) | one-shot por tap       |
| Snake     | `document keydown`  | `e.key` (`ArrowUp/Down/Left/Right`)        | one-shot por tap       |
| Asteroids | `window keydown/up` | `e.code` (`ArrowLeft/Right/Up/Space`)      | held (keydown + keyup) |
| Arkanoid  | `window keydown/up` | `e.key` (`ArrowLeft/Right`, `' '`)         | held (keydown + keyup) |

Todos los eventos se dispatchen en `document` (burbujea hasta `window`), con `{ key, code, bubbles: true }`.

## Layout de botones por juego

**Tetris** — D-pad compacto:

```
      [  ↑  ]
[  ←  ] [↓] [  →  ]
```

- ↑ = Rotate (`ArrowUp / code: ArrowUp`)
- ↓ = Soft Drop (`ArrowDown / code: ArrowDown`)
- ← → = Mover pieza

**Snake** — D-pad completo:

```
   [  ↑  ]
[←]       [→]
   [  ↓  ]
```

**Asteroids** — Fila horizontal:

```
[  ←  ] [  ↑ Empuje  ] [  →  ] [  🔥 DISPARAR  ]
```

- ← → = Rotar nave
- ↑ = Thrust (held)
- DISPARAR = Space (one-shot)

**Arkanoid** — Tres botones:

```
[  ←  ] [  LANZAR  ] [  →  ]
```

- ← → = Mover paleta (held)
- LANZAR = Space / `' '` (one-shot)

---

## Implementation plan

1. **Crear `components/TouchControls.tsx`**

   Componente client con props `{ gameId: string }`. Internamente:
   - Función `fireKey(key: string, code: string, type: 'down' | 'up')` que hace
     `document.dispatchEvent(new KeyboardEvent('keydown' | 'keyup', { key, code, bubbles: true }))`.
   - Función `tapKey(key, code)` para botones one-shot: dispara solo `keydown`.
   - Función `holdHandlers(key, code)` para botones held: devuelve
     `{ onPointerDown, onPointerUp, onPointerLeave, onPointerCancel }` que dispatchen `keydown` / `keyup`.
   - `switch (gameId)` que renderiza el layout correcto (Tetris / Snake / Asteroids / Arkanoid).
   - Clase contenedora `touch-controls` + clase específica `tc-tetris | tc-snake | tc-asteroids | tc-arkanoid`.
   - Si `gameId` no tiene layout conocido, no renderiza nada.

2. **Montar en `app/juego/[id]/jugar/page.tsx`**

   Importar `TouchControls` y añadirlo debajo de `<div className="player-layout">`:

   ```tsx
   <TouchControls gameId={id} />
   ```

3. **Estilos en `app/globals.css`**

   - `.touch-controls`: `display: none` por defecto.
   - `@media (max-width: 639px) { .touch-controls { display: flex; ... } }` — visible solo en móvil.
   - Botones con `min-width: 56px; min-height: 56px` (área táctil cómoda), fondo semitransparente estilo retro, `touch-action: manipulation` para evitar el doble-tap zoom.
   - Variantes de layout (D-pad, fila, etc.) via clases específicas.

4. **Verificación TypeScript**

   `npx tsc --noEmit` sin errores.

---

## Acceptance criteria

- [ ] En 375 px, los botones táctiles aparecen debajo del canvas para los 4 juegos.
- [ ] En desktop (≥ 640 px) los botones no se ven.
- [ ] **Tetris**: ← → mueven la pieza; ↑ rota; ↓ hace soft drop.
- [ ] **Snake**: ↑ ↓ ← → cambian la dirección de la serpiente.
- [ ] **Asteroids**: ← → rotan la nave; ↑ activa el empuje mientras se mantiene presionado; DISPARAR lanza una bala.
- [ ] **Arkanoid**: ← → mueven la paleta mientras se mantiene presionado; LANZAR suelta la bola.
- [ ] Los botones tienen área táctil ≥ 56 × 56 px.
- [ ] `touch-action: manipulation` en todos los botones (sin delay de 300 ms).
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** Un solo componente `TouchControls` con switch por `gameId`. Evita duplicar lógica de dispatch.
- **Sí:** Dispatch en `document` (burbujea a `window`). Alcanza todos los listeners de los cuatro juegos sin modificar `game.js`.
- **Sí:** `pointerdown` / `pointerup` en lugar de `touchstart` / `touchend`. Unifica mouse y touch, funciona en todos los navegadores modernos.
- **Sí:** `touch-action: manipulation` en cada botón — elimina el delay de 300 ms del doble-tap sin bloquear scroll de la página.
- **No:** Swipe gestures — añaden complejidad de detección de dirección y conflictan con el scroll de la página.
- **No:** Modificar `game.js` — todos los juegos ya escuchan eventos de teclado nativos; dispatch sintético es suficiente.

---

## Risks

| Riesgo                                                                                | Mitigación                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| El evento sintético no llega al listener del juego (contexto diferente)               | Todos los juegos están en el mismo documento (sin iframes); verificar con `bubbles: true`                               |
| Arkanoid: la paleta no se mueve suavemente si el polling ocurre entre keydown y keyup | El evento `keydown` setea `keys[e.key] = true`, el `keyup` lo resetea — el polling lee el estado correcto en cada frame |
| Tetris: el hard drop con Space puede saltar si el botón queda enfocado                | Usar `onPointerDown` con `e.preventDefault()` en el botón para evitar que el foco dispare un Space nativo extra         |
