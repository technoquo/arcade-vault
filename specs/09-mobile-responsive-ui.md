# SPEC 09 — UI Responsive Mobile

> **Status:** Aprobado
> **Depends on:** 01-mvp-visual, 02-home-landing
> **Date:** 2026-07-26
> **Objective:** Adaptar todas las páginas de Arcade Vault para que sean usables en móvil
> (≤640 px) con nav tipo drawer, catálogo en 2 columnas y leaderboard debajo del canvas.

---

## Scope

**In:**

- `components/NavClient.tsx` — botón hamburger + drawer lateral full-screen en móvil; en desktop sin cambios.
- `app/page.tsx` — hero y secciones de la landing apiladas en móvil.
- `app/juegos/page.tsx` — grid de cards pasa a 2 columnas en móvil.
- `app/juego/[id]/page.tsx` — layout de detalle apilado en móvil.
- `app/juego/[id]/jugar/page.tsx` — canvas ocupa el ancho completo; leaderboard siempre debajo del canvas en móvil.
- `app/salon/page.tsx` — podio y tabla apilados en móvil.
- `app/about/page.tsx` — formulario de contacto y secciones apiladas en móvil.
- `app/auth/page.tsx` — formulario centrado y padding ajustado en móvil.
- `app/globals.css` — variables o utilidades globales que hagan falta.

**Out of scope:**

- Controles táctiles dentro de los juegos canvas — eso va en el spec siguiente (10).
- Soporte táctil de Arkanoid — diferido a un spec posterior.
- Cambios a la lógica de juego, puntuación o leaderboard.
- Animaciones avanzadas del drawer (spring physics, etc.).
- Tests automatizados.
- Cambios al backend / API routes.

---

## Implementation plan

1. **Hamburger + drawer en `NavClient.tsx`**
   Agregar estado `drawerOpen: boolean`. En móvil (< 640 px) mostrar botón hamburger que
   al presionarse renderiza un overlay full-screen con los links de nav verticales y un
   botón de cierre (×). En desktop los links siguen en línea horizontal sin cambios.
   Verificación: en viewport 375 px el drawer abre y cierra; en 1024 px no aparece el botón.

2. **Landing `app/page.tsx`**
   Aplicar clases responsive de Tailwind a hero, grilla de features y cualquier sección
   horizontal: `flex-col` en móvil, layout original en `sm:`. Ajustar tamaños de fuente
   y padding en móvil.
   Verificación: la landing no tiene scroll horizontal en 375 px.

3. **Catálogo `app/juegos/page.tsx`**
   Cambiar el grid de cards a `grid-cols-2 sm:grid-cols-3` (o el valor actual en desktop).
   Ajustar padding interno de las cards para que el texto no se corte.
   Verificación: se ven 2 columnas en 375 px; el layout desktop no cambia.

4. **Detalle del juego `app/juego/[id]/page.tsx`**
   Apilar imagen/cover y descripción en `flex-col` en móvil. Ajustar botón "Jugar" para
   que sea full-width en móvil.
   Verificación: la página no tiene overflow horizontal en 375 px.

5. **Pantalla de juego `app/juego/[id]/jugar/page.tsx`**
   En móvil: canvas ocupa `w-full`; leaderboard se mueve debajo del canvas (`flex-col`).
   En desktop: layout actual (canvas izquierda, leaderboard derecha) sin cambios.
   Verificación: en 375 px el canvas es full-width y el leaderboard aparece debajo.

6. **Salón de la Fama `app/salon/page.tsx`**
   Apilar podio y tabla en `flex-col` en móvil. Tabla con scroll horizontal si la fila
   no cabe.
   Verificación: la página es usable en 375 px sin scroll horizontal involuntario.

7. **About `app/about/page.tsx`**
   Apilar columnas de contenido y formulario de contacto en `flex-col` en móvil.
   Verificación: el formulario es usable en 375 px.

8. **Auth `app/auth/page.tsx`**
   Ajustar padding y ancho máximo del formulario para móvil.
   Verificación: el formulario no se corta en 375 px.

9. **Verificación TypeScript**
   `npx tsc --noEmit` debe pasar sin errores.
   Verificación: salida limpia.

---

## Acceptance criteria

- [ ] En viewport 375 px, el botón hamburger es visible en la nav y los links de desktop no lo son.
- [ ] El drawer abre al tocar el hamburger y cierra al tocar × o un link del menú.
- [ ] La landing (`/`) no tiene scroll horizontal en 375 px.
- [ ] El catálogo (`/juegos`) muestra exactamente 2 columnas de cards en 375 px.
- [ ] La página de detalle (`/juego/[id]`) no tiene overflow horizontal en 375 px.
- [ ] En la pantalla de juego (`/juego/[id]/jugar`) en 375 px: el canvas ocupa el ancho completo.
- [ ] En la pantalla de juego en 375 px: el leaderboard aparece debajo del canvas, no al lado.
- [ ] El Salón de la Fama (`/salon`) es usable en 375 px sin scroll horizontal involuntario.
- [ ] La página About (`/about`) y el formulario de contacto son usables en 375 px.
- [ ] La página Auth (`/auth`) muestra el formulario sin cortes en 375 px.
- [ ] En desktop (≥ 640 px) ninguno de los layouts actuales cambia visualmente.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Sí:** Breakpoint único en 640 px (Tailwind `sm`). Evita manejar múltiples breakpoints intermedios para una plataforma de juegos donde el caso de uso principal es desktop o móvil, no tablet.
- **Sí:** Drawer lateral full-screen en lugar de dropdown debajo de la nav. Más fácil de tocar en móvil y no compite con el contenido de la página.
- **Sí:** 2 columnas en el catálogo móvil. Las cards son visuales y se leen bien a mitad de ancho; 1 columna desperdiciaría espacio y requeriría más scroll.
- **Sí:** Leaderboard siempre debajo del canvas en móvil (no oculto). El usuario lo ve sin acción extra; ocultar requeriría un botón adicional y estado extra.
- **No:** Controles táctiles dentro de los juegos — van en spec 10.
- **No:** Soporte táctil de Arkanoid — diferido por complejidad de la paleta horizontal.
- **No:** Animaciones avanzadas del drawer (spring, gestures de swipe para cerrar) — complejidad no justificada para esta plataforma.
- **No:** Breakpoints adicionales para tablet — el layout desktop funciona bien desde 640 px.

---

## Risks

| Riesgo                                                                                                             | Mitigación                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El canvas de los juegos desborda en móvil aunque el wrapper sea `w-full` (el canvas tiene dimensiones fijas en px) | El escalado CSS con `transform: scale()` + `ResizeObserver` ya existe en cada componente; verificar que el wrapper no tenga `overflow: hidden` que corte el canvas escalado. |
| El drawer bloquea el scroll de la página cuando está abierto                                                       | Agregar `overflow-hidden` al `<body>` mientras el drawer está abierto; removerlo al cerrar.                                                                                  |
| Cambios responsive en `jugar/page.tsx` rompen el layout desktop existente                                          | Usar exclusivamente clases `sm:` de Tailwind — el layout base (sin prefijo) es móvil y `sm:` restaura el desktop. Verificar en 1024 px tras cada cambio.                     |
