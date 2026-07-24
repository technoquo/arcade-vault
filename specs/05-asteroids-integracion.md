# SPEC 05 — Asteroids: Integración en Arcade Vault

> **Status:** Aprobado
> **Depends on:** 04-supabase-auth
> **Date:** 2026-07-24
> **Objective:** Integrar el juego Asteroids existente en Arcade Vault como
> página `/juegos/asteroids`, cargando el canvas vanilla JS desde `public/`
> con escalado CSS y el Nav de la plataforma visible.

---

## Scope

**In:**

- `public/asteroids/game.js` — Copiar `game.js` del juego de referencia sin modificaciones.
- `public/asteroids/favicon.svg` — Copiar el favicon del juego (por si se referencia internamente).
- `app/juegos/asteroids/page.tsx` — Página del juego: metadata, link "← Juegos" y componente canvas.
- `components/AsteroidsGame.tsx` — Client Component que monta el `<canvas>` y carga `game.js`
  vía `next/script`. Aplica escalado CSS con `transform: scale()` para adaptar 800×600
  a la pantalla disponible sin tocar la lógica del juego.

**Out of scope:**

- Modificar `game.js` (la lógica del juego se usa tal cual).
- Guardar scores en Supabase (spec futuro).
- Leaderboard (spec futuro).
- Protección de ruta por autenticación (cualquiera puede jugar).
- Soporte táctil / mobile controls.
- Tests automatizados.

---

## Implementation plan

1. **Copiar assets del juego** — Copiar `references/started-games/02-asteroids/game.js`
   a `public/asteroids/game.js` y `favicon.svg` a `public/asteroids/favicon.svg`.
   Verificación: los archivos existen en `public/asteroids/`.

2. **`components/AsteroidsGame.tsx`** — Client Component (`"use client"`) que:
   - Renderiza un `<div>` contenedor con posición relativa y `overflow: hidden`.
   - Dentro coloca `<canvas id="canvas" width={800} height={600}>`.
   - Usa `useEffect` + `ResizeObserver` sobre el contenedor para calcular el factor
     de escala (`Math.min(containerW / 800, containerH / 600)`) y aplicar
     `canvas.style.transform = \`scale(\${scale})\``con`transform-origin: top left`.
   - Carga `game.js` con `<Script src="/asteroids/game.js" strategy="afterInteractive">`.
   - En el cleanup del `useEffect`, desconecta el `ResizeObserver`.
     Verificación: el canvas se muestra centrado y escala al redimensionar la ventana.

3. **`app/juegos/asteroids/page.tsx`** — Server Component que:
   - Exporta `metadata`: `title: "Asteroids | Arcade Vault"`,
     `description: "Destruye asteroides y sobrevive el mayor tiempo posible."`.
   - Renderiza un link `← Juegos` que apunta a `/juegos`, visible siempre en la
     parte superior de la página.
   - Renderiza `<AsteroidsGame />` ocupando el alto restante del viewport.
     Verificación: la página carga en `/juegos/asteroids` con el Nav de la plataforma,
     el link de retorno y el canvas funcional.

4. **Verificación de tipos** — `tsc --noEmit` sin errores.

---

## Acceptance criteria

- [ ] `public/asteroids/game.js` existe y es idéntico al original de referencia.
- [ ] Navegar a `/juegos/asteroids` carga la página sin errores en consola.
- [ ] El Nav de la plataforma es visible en la parte superior.
- [ ] El link "← Juegos" está visible y redirige a `/juegos`.
- [ ] El canvas muestra el juego en ejecución (asteroides moviéndose, nave en el centro).
- [ ] Los controles de teclado (flechas + espacio) funcionan correctamente.
- [ ] En una ventana más pequeña que 800px, el canvas escala hacia abajo sin desbordarse.
- [ ] El `<title>` de la página es "Asteroids | Arcade Vault".
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** `public/asteroids/game.js` sin modificaciones + `<Script strategy="afterInteractive">`.
  El juego accede a `document.getElementById("canvas")` al cargar; `afterInteractive`
  garantiza que el DOM ya existe. Evita cualquier refactoring del juego.

- **Sí:** Escalado CSS con `transform: scale()` en lugar de redimensionar el canvas.
  Mantiene todas las coordenadas internas intactas (W=800, H=600) y no toca `game.js`.

- **Sí:** `ResizeObserver` en el componente React para recalcular el factor de escala
  dinámicamente al redimensionar la ventana.

- **Sí:** Link estático "← Juegos" siempre visible en lugar de UI extra en Game Over.
  El overlay de Game Over del propio juego es suficiente; añadir lógica cross-boundary
  entre canvas y React queda fuera del scope.

- **No:** Conversión a TypeScript ni refactoring de `game.js`. El juego funciona;
  la conversión se haría solo si se necesita integración profunda (scores, eventos).

- **No:** Pantalla completa sin Nav. Se mantiene la coherencia visual de la plataforma.

- **No:** Login requerido para jugar. El juego es accesible para todos;
  la integración de scores (que sí requerirá sesión) es un spec futuro.

- **No:** Soporte táctil. El juego usa teclado; controles móviles son un spec separado.

---

## Risks

| Riesgo                                                                                                                                                                                                                   | Mitigación                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game.js` llama a `document.getElementById("canvas")` al cargar. Si el script se ejecuta antes de que el canvas exista en el DOM, el juego no arranca.                                                                   | `strategy="afterInteractive"` en `<Script>` garantiza ejecución post-hidratación. Verificar en consola que no hay `null` reference al cargar.             |
| El juego añade listeners a `window` (`keydown`, `keyup`) y lanza un loop `requestAnimationFrame` que nunca se cancela. Si el componente se desmonta (navegación SPA), los listeners y el loop quedan activos en memoria. | Aceptado en este spec: el scope es solo integración. La limpieza del loop y listeners se aborda si se detectan problemas reales o en el spec de scores.   |
| `game.js` usa variables de módulo globales (`score`, `lives`, etc.). En navegación SPA, el script no se re-ejecuta al volver a la página, por lo que `initGame()` no se llama de nuevo.                                  | Aceptado en este spec. Si se convierte en problema real, se añade una llamada explícita a `initGame()` desde el componente React vía `window.initGame()`. |
