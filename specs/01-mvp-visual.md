# SPEC 01 — MVP Visual de Arcade Vault

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-07-23
> **Objective:** Implementar las 5 pantallas del MVP de Arcade Vault como rutas Next.js 15 con datos mock, animación simulada en el reproductor y auth por localStorage.

---

## Scope

**In:**

- `app/page.tsx` — Biblioteca: hero con flicker, buscador, chips de categoría, grid de GameCards con efecto tilt.
- `app/juego/[id]/page.tsx` — Detalle: cover, tags, descripción, estadísticas, leaderboard lateral con scores seeded.
- `app/juego/[id]/jugar/page.tsx` — Reproductor: HUD (score, vidas, nivel, jugador), CRT con enemigos CSS animados y setInterval de puntuación simulada, modal de Game Over con guardado de score en localStorage.
- `app/auth/page.tsx` — Auth: tabs Iniciar Sesión / Crear Cuenta, formulario, jugar como invitado, botones sociales (sin backend real).
- `app/salon/page.tsx` — Salón de la Fama: podio top-3, tabla completa, tabs por juego, fila del usuario logueado.
- `components/Nav.tsx` — barra de navegación con logo, links, contador de créditos, botón de auth, menú hamburguesa móvil.
- `lib/data.ts` — los 8 juegos hardcodeados, array CATS, función `seededScores`, tipos TypeScript.
- Auth mock por localStorage (`av_user`, `av_scores`) con contexto de React para compartir el usuario entre rutas.
- Estilos: clases propias del template en `app/globals.css` (ya parcialmente migradas); Tailwind para el resto.

**Out of scope (para specs futuros):**

- Implementación de cualquier juego real.
- Backend de auth (NextAuth, Supabase, etc.).
- API de scores real — todos los datos son mock o localStorage.
- Multiplayer o rankings globales en tiempo real.
- Versión mobile nativa.
- Tests automatizados.

---

## Data model

```ts
// lib/data.ts

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;       // clase CSS del cover-bg, e.g. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;       // string formateado, e.g. "12.4K"
}

export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;        // "DD/MM/YYYY"
}

export interface SavedScore {
  game: string;        // Game.id
  score: number;
  name: string;
  at: number;          // Date.now()
}

export interface AuthUser {
  name: string;        // máx 10 caracteres, mayúsculas
}
```

**localStorage keys:**
- `av_user` — `AuthUser | null` — sesión activa.
- `av_scores` — `SavedScore[]` — historial de scores del jugador.

**Contexto React:**
- `UserContext` en `context/UserContext.tsx` — provee `user: AuthUser | null`,
  `login(u: AuthUser)`, `signOut()`, `saveScore(e: SavedScore)`.
  Se inicializa leyendo localStorage en el cliente (`"use client"`).
  Se monta en `app/layout.tsx` envolviendo `{children}`.

---

## Implementation plan

1. **`lib/data.ts`** — Crear el archivo con los tipos TypeScript, los 8 juegos (GAMES),
   CATS, y la función `seededScores`. Verificación: `tsc --noEmit` sin errores.

2. **`UserContext`** — Crear `context/UserContext.tsx` (`"use client"`) con el contexto,
   provider y hook `useUser()`. Leer/escribir `av_user` y `av_scores` en localStorage.
   Envolver `{children}` en `app/layout.tsx` con `<UserProvider>`.
   Verificación: el layout compila sin errores de tipo.

3. **`components/Nav.tsx`** — Componente `"use client"` con logo, links (`/`, `/salon`),
   contador de créditos, botón auth (`/auth` o sign-out), hamburguesa + panel móvil.
   Usar `usePathname()` de Next.js para el estado activo. Montarlo en `app/layout.tsx`.
   Verificación: nav visible en todas las rutas, link activo resaltado.

4. **`app/page.tsx`** — Biblioteca: hero con flicker, buscador, chips de categoría,
   grid de GameCards con efecto tilt. Filtrado por `q` y `cat` con `useMemo`.
   Cards navegan a `/juego/[id]`. Reemplaza el boilerplate actual.
   Verificación: grid muestra 8 juegos; búsqueda y filtros funcionan.

5. **`app/auth/page.tsx`** — Pantalla Auth: tabs Iniciar Sesión / Crear Cuenta,
   campos usuario/email/contraseña, submit llama `login()` del contexto y redirige
   a `/` con `router.push`. Botón "Jugar como invitado" hace `login(null)` y redirige.
   Botones sociales sin acción real. Verificación: tras submit, `av_user` aparece en
   localStorage y el Nav muestra el nombre del usuario.

6. **`app/salon/page.tsx`** — Salón de la Fama: tabs por juego (chips), podio top-3
   (oro/plata/bronce), tabla completa con `seededScores`. Si hay usuario logueado,
   mostrar su fila resaltada en amarillo al final.
   Verificación: cambiar de tab actualiza el podio y la tabla.

7. **`app/juego/[id]/page.tsx`** — Detalle: lee `params.id`, encuentra el juego en GAMES,
   muestra cover, tags, descripción larga, stat-strip, leaderboard lateral con
   `seededScores`. Botón "JUGAR AHORA" navega a `/juego/[id]/jugar`.
   Si `id` no existe, redirige a `/`.
   Verificación: cada card de la Biblioteca abre su detalle correcto.

8. **`app/juego/[id]/jugar/page.tsx`** — Reproductor: HUD con score/vidas/nivel/jugador,
   `setInterval` de puntuación simulada (pausa/reanuda con el estado `paused`),
   enemigos CSS animados + player-ship dentro del CRT, overlay de pausa.
   Modal Game Over con input de nombre, botón guardar score (`saveScore()` del contexto),
   confirmación "PUNTUACIÓN GUARDADA_", botones reiniciar / volver al vault.
   Verificación: pausa detiene el contador; modal aparece al pulsar FIN; score se
   guarda en `av_scores` en localStorage.

9. **`app/globals.css`** — Revisar que todos los selectores usados en los componentes
   nuevos estén presentes (`.av-nav`, `.av-grid`, `.card`, `.crt`, `.podium`, etc.).
   Añadir los que falten portando desde `references/templates/styles.css`.
   Verificación: ningún selector produce un estilo roto visible en el navegador.

---

## Acceptance criteria

- [ ] La Biblioteca carga en `/` y muestra los 8 juegos sin errores en consola.
- [ ] El buscador filtra las cards en tiempo real por nombre.
- [ ] Los chips de categoría filtran correctamente; "TODOS" muestra los 8 juegos.
- [ ] Al filtrar sin resultados, aparece el mensaje "NO HAY RESULTADOS".
- [ ] Hacer click en una card navega a `/juego/[id]` con los datos del juego correcto.
- [ ] La página de Detalle muestra el leaderboard de 10 scores generados por `seededScores`.
- [ ] El botón "JUGAR AHORA" en Detalle navega a `/juego/[id]/jugar`.
- [ ] En el Reproductor, la puntuación sube automáticamente sin intervención del usuario.
- [ ] El botón PAUSA detiene el contador; REANUDAR lo reanuda.
- [ ] El botón FIN muestra el modal de Game Over con la puntuación acumulada.
- [ ] Guardar score en el modal escribe la entrada en `av_scores` en localStorage.
- [ ] El botón "JUGAR DE NUEVO" en el modal reinicia score/vidas/nivel a sus valores iniciales.
- [ ] `/auth` muestra el tab "CREAR CUENTA" al pulsarlo, con el campo email visible.
- [ ] Hacer submit en Auth guarda `av_user` en localStorage y redirige a `/`.
- [ ] El Nav muestra el nombre del usuario tras el login; pulsarlo hace sign-out.
- [ ] Sign-out elimina `av_user` de localStorage y el Nav vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon` muestra el podio correcto al cambiar de tab entre los 8 juegos.
- [ ] Si hay usuario logueado, la tabla del Salón muestra su fila resaltada en amarillo.
- [ ] El Nav resalta el link activo según la ruta actual.
- [ ] El menú hamburguesa funciona en viewport < 768px.
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** Rutas Next.js App Router (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/auth`, `/salon`)
  en lugar del hash-router del template. Encaja con la arquitectura del proyecto y habilita
  prefetch y SSR sin trabajo extra.

- **No:** SPA de una sola página imitando el hash-router del template. Más fiel al prototipo
  pero pierde las ventajas del App Router y no escala hacia funcionalidad real.

- **Sí:** Estilos propios del template en `app/globals.css` (ya parcialmente migrados) +
  Tailwind para lo demás. Máxima fidelidad visual sin reescribir el CSS desde cero.

- **No:** Reescribir todo en Tailwind v4. Más limpio a largo plazo pero lento y con riesgo
  de deriva visual respecto al diseño de referencia.

- **Sí:** Animación simulada en el Reproductor (enemigos CSS + `setInterval` de puntuación).
  El MVP se siente funcional aunque no haya lógica de juego real.

- **No:** Placeholder estático "JUEGO EN CONSTRUCCIÓN". Más honesto pero sin impacto visual.

- **Sí:** Auth mock con localStorage (`av_user`). La sesión persiste entre recargas y el MVP
  se comporta como una app real sin necesidad de backend.

- **No:** Auth solo visual sin lógica de estado. Insuficiente para demostrar el flujo completo.

- **Sí:** Datos hardcodeados en `lib/data.ts`. Simple y suficiente para un MVP visual.

- **No:** Ruta de API Next.js `/api/games`. Complejidad extra sin beneficio visual en este punto.

- **Sí:** `UserContext` en `context/UserContext.tsx` para compartir el usuario entre todas las rutas.
  Evita prop-drilling a través del Nav, Reproductor y Salón.

---

## Risks

| Riesgo | Mitigación |
|--------|------------|
| `globals.css` incompleto — faltan selectores usados por los nuevos componentes | El paso 9 del plan cubre la revisión y el portado desde `references/templates/styles.css` antes de considerar la spec implementada. |
| `localStorage` no disponible en SSR — Next.js ejecuta componentes en servidor y `window` no existe | Todos los accesos a localStorage se hacen dentro de `useEffect` o en componentes `"use client"` inicializados en el cliente. |
| `useUser()` llamado fuera del `UserProvider` — error silencioso en rutas sin el contexto | `useUser()` lanza un error explícito si `context === undefined`, visible en desarrollo. |
| Hidratación incorrecta — el Nav renderiza diferente en servidor (sin usuario) y cliente (con usuario de localStorage) | El estado inicial del usuario siempre es `null` en el servidor; el cliente lo actualiza en `useEffect` para evitar mismatch. |

---

## What is **not** in this spec

- Implementación de cualquier juego real.
- Backend de auth (NextAuth, Supabase, etc.).
- API de scores real.
- Multiplayer o rankings globales en tiempo real.
- Versión mobile nativa.
- Tests automatizados.
