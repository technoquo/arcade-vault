# SPEC 02 — Home Page (Landing)

> **Status:** Aprobado
> **Depends on:** 01-mvp-visual
> **Date:** 2026-07-23
> **Objective:** Implementar la página de inicio (landing) de Arcade Vault en `/`,
> reubicar la Biblioteca a `/juegos`, y actualizar el Nav para reflejar la nueva estructura de rutas.

---

## Scope

**In:**

- `app/page.tsx` — Reemplazada por la nueva Home (landing page) con 7 secciones:
  Hero, ¿Por qué Arcade Vault?, Juegos disponibles ahora, Stats, Actividad en vivo,
  Precios y CTA final.
- `app/juegos/page.tsx` — Nueva ruta que contiene el contenido actual de `app/page.tsx`
  (la Biblioteca: hero con flicker, buscador, chips de categoría, grid de GameCards).
- `components/Nav.tsx` — Actualizar links: "Inicio" → `/`, "Biblioteca" → `/juegos`.
- `app/globals.css` — Portar los selectores del Home desde `references/home-about/styles.css`
  que aún no existan (`.home-hero`, `.home-silos`, `.silo`, `.mini-card`, `.mini-rail`,
  `.home-stats`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, etc.).
- Componentes internos de la página (no exportados): `FloatingSilhouettes`, `MiniCard`,
  `FeatureIcon`, `useReveal` — definidos dentro de `app/page.tsx`.
- Datos mock de "Actividad en vivo" como constantes locales en `app/page.tsx`.

**Out of scope:**

- Página `/about` — referencia existe pero queda para un spec futuro.
- Backend real para scores o actividad en vivo.
- Animaciones de scroll más allá del `IntersectionObserver` ya presente en la referencia.
- Tests automatizados.
- Cualquier cambio a `/juego/[id]` o `/juego/[id]/jugar`.

---

## Data model

No se introducen nuevos tipos ni estructuras de datos.

- La sección "Juegos disponibles ahora" consume el array `GAMES` existente de `lib/data.ts`
  (sin cambios).
- La sección "Actividad en vivo" usa dos constantes locales en `app/page.tsx`:
  `RECENT_SCORES` y `TOP_PLAYERS`, tipadas inline con interfaces anónimas.

---

## Implementation plan

1. **`app/juegos/page.tsx`** — Crear el archivo moviendo el contenido actual de `app/page.tsx`
   (la Biblioteca) sin cambios funcionales. Actualizar los imports si usan rutas relativas.
   Verificación: `/juegos` muestra la Biblioteca idéntica a como estaba en `/`.

2. **`app/page.tsx`** — Reemplazar con la nueva Home. Incluye los componentes internos
   `FloatingSilhouettes`, `FeatureIcon`, `MiniCard`, `useReveal`, las constantes
   `RECENT_SCORES` y `TOP_PLAYERS`, y las 7 secciones de la referencia portadas a TSX.
   Los links de navegación usan `<Link>` de Next.js apuntando a `/juegos` y `/auth`.
   Verificación: `/` muestra la landing con las 7 secciones sin errores en consola.

3. **`components/Nav.tsx`** — Cambiar el link "Biblioteca" de `href="/"` a `href="/juegos"`.
   Añadir link "Inicio" apuntando a `/` si no existe. Actualizar la lógica `isActive`
   para que Biblioteca se active también en `/juegos/...` (detail y jugar).
   Verificación: el link activo es correcto en `/`, `/juegos`, `/juego/[id]` y `/salon`.

4. **`app/globals.css`** — Portar desde `references/home-about/styles.css` todos los
   selectores del Home que aún no existan: `.home-hero`, `.home-hero-inner`, `.hero-eyebrow`,
   `.home-title`, `.home-ctas`, `.hero-scroll`, `.home-silos`, `.silo`, `.s1`–`.s8`,
   `.home-section`, `.section-head`, `.kicker`, `.section-rule`, `.feature-grid`,
   `.feature-card`, `.ft-icon`, `.ft-title`, `.ft-desc`, `.mini-rail`, `.mini-card`,
   `.mini-cover`, `.cover-bg`, `.mini-meta`, `.home-stats`, `.stats-inner`, `.stat-block`,
   `.activity-grid`, `.activity-card`, `.ticker`, `.tick-row`, `.top-list`, `.top-row`,
   `.pricing-grid`, `.price-card`, `.pricing-faq`, `.home-final`, `.reveal`, `.reveal.in`.
   Verificación: ninguna sección aparece sin estilo visible en el navegador.

5. **`tsc --noEmit`** — Confirmar que no hay errores de tipo tras todos los cambios.

---

## Acceptance criteria

- [ ] `/` muestra la landing page con las 7 secciones (Hero, ¿Por qué?, Juegos, Stats,
      Actividad, Precios, CTA final).
- [ ] `/juegos` muestra la Biblioteca idéntica a como estaba antes en `/`.
- [ ] Los links internos del Home ("EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →",
      "INSERTAR MONEDA →") navegan a `/juegos`.
- [ ] Los links "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [ ] La mini-rail de juegos muestra los primeros 6 items de `GAMES` con su cover y categoría.
- [ ] Las secciones `.reveal` se animan al hacer scroll y entrar en viewport.
- [ ] Las 8 siluetas flotantes (`FloatingSilhouettes`) son visibles en el Hero.
- [ ] La sección "Actividad en vivo" muestra los 7 scores de `RECENT_SCORES` y
      los 5 jugadores de `TOP_PLAYERS` con sus datos hardcodeados.
- [ ] El Nav muestra "Inicio" activo al estar en `/` y "Biblioteca" activo al estar en
      `/juegos` o `/juego/[id]`.
- [ ] El link "VER SALÓN →" en actividad navega a `/salon`.
- [ ] `/juego/[id]` y `/juego/[id]/jugar` siguen funcionando sin cambios.
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** Home en `/` y Biblioteca en `/juegos`. La landing page es el punto de entrada
  natural para usuarios nuevos; la Biblioteca queda en una ruta semánticamente correcta.

- **No:** Home en `/home` con Biblioteca en `/`. Habría que gestionar una redirección
  desde `/` y la landing nunca sería la raíz real.

- **Sí:** Datos de "Actividad en vivo" como constantes locales hardcodeadas en `app/page.tsx`.
  Suficiente para el MVP; no requiere backend ni localStorage.

- **No:** Leer actividad desde `av_scores` en localStorage. Más dinámico pero añade
  complejidad y dependencia del estado del cliente sin beneficio visual real en esta etapa.

- **Sí:** Componentes internos (`FloatingSilhouettes`, `MiniCard`, `FeatureIcon`, `useReveal`)
  definidos dentro de `app/page.tsx` sin exportar. Son específicos de esta página y no
  se reutilizan en ningún otro lugar.

- **No:** Extraerlos a `components/`. Complejidad extra sin beneficio hasta que otro
  componente los necesite.

---

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Links hardcodeados a `/` en componentes existentes (Nav, GameDetail, Auth) apuntan ahora a la landing en lugar de la Biblioteca | Revisar todos los `href="/"` y `router.push("/")` en los componentes del spec 01 y corregirlos a `/juegos` en el paso 3. |
| Selectores CSS del Home ya existen en `globals.css` con estilos distintos o parciales | Antes de añadir, buscar cada selector con grep; actualizar en lugar de duplicar. |
