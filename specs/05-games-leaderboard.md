# SPEC 05 — Games Table & Leaderboard

> **Status:** Aprobado
> **Depends on:** 04-supabase-auth
> **Date:** 2026-07-24
> **Objective:** Implementar las tablas `games` y `scores` en Supabase, la página
> `/juegos` como catálogo de juegos, y un leaderboard Top 12 por juego integrado
> en la pantalla de Asteroids que guarda scores al detectar el evento game over.

---

## Scope

**In:**

- `supabase/migrations/20260724_games_and_scores.sql` — Crear tablas `games` y
  `scores`, RLS policies y seed del juego Asteroids (slug: `rocas`).
- `app/juegos/page.tsx` — Página pública con el catálogo de juegos; muestra una
  card por juego con nombre, descripción y botón "Jugar".
- `app/api/scores/route.ts` — Route Handler con dos métodos:
  - `GET ?game_slug=rocas` → devuelve los Top 12 scores de ese juego.
  - `POST` → inserta un score con `{ game_slug, player_name, score, user_id? }`.
- `app/juego/rocas/jugar/page.tsx` (o el archivo que contiene el canvas de
  Asteroids) — Añadir el panel de leaderboard Top 12 junto al canvas y el
  formulario de nombre de jugador que aparece al detectar el evento game over.

**Out of scope:**

- Panel de administración para crear/editar juegos desde la UI.
- Autenticación obligatoria para jugar o enviar scores.
- Validación o moderación de player_names (palabras ofensivas, duplicados).
- Leaderboard global (multi-juego).
- Paginación del leaderboard (más allá del Top 12).
- Protección contra scores fraudulentos (cheating, manipulación del cliente).
- Tests automatizados.
- Cualquier juego distinto de Asteroids (Rocas).

---

## Data model

### Tabla `games`

```sql
create table games (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);
```

**Seed inicial:**

```sql
insert into games (slug, name, description) values
  ('rocas', 'Rocas', 'Destruye asteroides y sobrevive el mayor tiempo posible.');
```

### Tabla `scores`

```sql
create table scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null, -- nullable
  player_name text not null,
  score       integer not null check (score >= 0),
  created_at  timestamptz default now()
);
```

### RLS Policies

```sql
-- games: lectura pública, sin escritura desde el cliente
alter table games enable row level security;
create policy "games_read_public" on games for select using (true);

-- scores: lectura pública, inserción pública (anon y autenticados)
alter table scores enable row level security;
create policy "scores_read_public"   on scores for select using (true);
create policy "scores_insert_public" on scores for insert with check (true);
```

### Request/Response de la API

```ts
// POST /api/scores — body
interface ScorePayload {
  game_slug: string;
  player_name: string;
  score: number;
  user_id?: string; // UUID del usuario autenticado, opcional
}

// GET /api/scores?game_slug=rocas — response item
interface ScoreEntry {
  rank: number;
  player_name: string;
  score: number;
  created_at: string; // ISO 8601
}
```

---

## Implementation plan

1. **Migración Supabase** — Aplicar `supabase/migrations/20260724_games_and_scores.sql`
   con las tablas `games` y `scores`, las RLS policies y el seed de Asteroids.
   Verificación: las tablas aparecen en el dashboard de Supabase y `select * from games`
   devuelve la fila de Rocas.

2. **`app/api/scores/route.ts`** — Implementar el Route Handler:
   - `GET ?game_slug=rocas`: busca el `id` del juego por slug, consulta los Top 12
     scores ordenados por `score DESC`, devuelve el array con rank inyectado.
   - `POST`: valida que `game_slug`, `player_name` y `score` existan y no estén
     vacíos; inserta en `scores`; devuelve `201` con el registro creado.
   - En error de validación: `400`. En error de Supabase: `500`.
     Verificación: `GET /api/scores?game_slug=rocas` devuelve array vacío `[]` sin errores.

3. **`app/juegos/page.tsx`** — Crear la página del catálogo:
   - Server Component que lee todos los juegos de Supabase con `createClient()` del server.
   - Renderiza una card por juego: nombre, descripción, botón "Jugar" → `/juego/[slug]/jugar`.
   - Si no hay juegos: mostrar estado vacío.
     Verificación: `/juegos` muestra la card de Rocas con el botón "Jugar".

4. **Panel de leaderboard en la página del juego** — En `app/juego/rocas/jugar/page.tsx`
   (o el componente que contiene el canvas):
   - Añadir un panel lateral con el leaderboard Top 12. Columnas: RANGO, JUGADOR,
     PUNTUACIÓN, FECHA (estética arcade pixel-art, paleta cyan/amarillo/gris, Top 3 en amarillo).
   - Cargar los scores con `fetch GET /api/scores?game_slug=rocas` al montar el componente.
     Verificación: el panel se renderiza junto al canvas con los 12 slots (vacíos al inicio).

5. **Formulario de score al game over** — En el mismo componente del juego:
   - Detectar el evento game over existente y mostrar un overlay/modal con:
     - Input `player_name` (pre-rellenado con el prefijo del email si hay sesión activa).
     - Puntuación obtenida en la partida.
     - Botón "Guardar score".
   - Al confirmar: `POST /api/scores` con `{ game_slug: "rocas", player_name, score, user_id? }`.
   - En éxito: cerrar el overlay y refrescar el leaderboard.
   - En error: mostrar mensaje inline sin cerrar el modal.
     Verificación: terminar una partida muestra el overlay; guardar el score lo inserta
     en la DB y aparece en el leaderboard.

6. **`tsc --noEmit`** — Confirmar que no hay errores de tipo.
   Verificación: 0 errores.

---

## Acceptance criteria

- [ ] Las tablas `games` y `scores` existen en Supabase con las columnas definidas.
- [ ] `select * from games` devuelve exactamente una fila: Rocas (slug: `rocas`).
- [ ] `GET /api/scores?game_slug=rocas` devuelve un array JSON con hasta 12 entradas,
      ordenadas de mayor a menor score, con el campo `rank` inyectado (1–12).
- [ ] `POST /api/scores` con body válido inserta el registro y devuelve `201`.
- [ ] `POST /api/scores` con `player_name` o `score` ausentes devuelve `400`.
- [ ] `/juegos` muestra la card de Rocas con nombre, descripción y botón "Jugar".
- [ ] El botón "Jugar" en la card de Rocas navega a `/juego/rocas/jugar`.
- [ ] El panel de leaderboard es visible junto al canvas de Asteroids al cargar la página.
- [ ] El panel muestra las columnas RANGO, JUGADOR, PUNTUACIÓN y FECHA con estética arcade.
- [ ] Los puestos #01, #02 y #03 se muestran en amarillo; el resto en cyan.
- [ ] Al terminar la partida se muestra un overlay con el input de nombre y la puntuación obtenida.
- [ ] Si el usuario está autenticado, el input de nombre se pre-rellena con el prefijo de su email.
- [ ] Guardar el score lo inserta en la DB y refresca el panel de leaderboard sin recargar la página.
- [ ] Un usuario no autenticado puede guardar un score introduciendo su nombre manualmente.
- [ ] El leaderboard es visible para cualquier visitante sin necesidad de iniciar sesión.
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** Un solo spec para games table y leaderboard. Las dos features están
  acopladas (scores referencian games) y el catálogo es mínimo (un juego, seed manual);
  no justifica dos specs separados.

- **Sí:** `user_id` nullable en `scores`. Permite que cualquier visitante
  compita sin autenticación, manteniendo la opción de vincular scores a usuarios
  en el futuro cuando se implemente el perfil.

- **Sí:** `player_name` como campo propio en `scores` (no derivado de `auth.users`).
  Permite nombres de jugador personalizados independientes del email, y soporta
  jugadores anónimos sin inconsistencias.

- **Sí:** RLS con inserción pública en `scores`. La tabla no contiene datos
  sensibles; el riesgo de scores fraudulentos se acepta para el MVP.

- **Sí:** Route Handler `app/api/scores/route.ts` para GET y POST. El GET desde
  Server Component también sería válido, pero centralizarlo en la API facilita
  el refresco del leaderboard desde el cliente tras guardar el score.

- **Sí:** Top 12 (no Top 10). Decisión explícita del usuario; se refleja tanto
  en la query como en el diseño del panel.

- **No:** Autenticación obligatoria para jugar o enviar scores. El usuario
  confirmó que quiere acceso abierto en esta etapa.

- **No:** Panel de admin para gestionar juegos. Los juegos se añaden vía seed
  en la migración; un CRUD admin es un spec futuro independiente.

- **No:** Leaderboard global multi-juego. Fuera de scope; se evalúa cuando
  haya más de un juego en la plataforma.

- **No:** Protección anti-cheating. Aceptado como riesgo del MVP; se aborda
  si se detecta abuso en producción.

---

## Risks

| Riesgo                                                                                                                                                  | Mitigación                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El evento game over de Asteroids puede estar encapsulado en un canvas o loop de juego sin un hook React claro, dificultando la integración del overlay. | Leer el código del juego antes de implementar el paso 5; si el event no es accesible directamente, añadir un callback `onGameOver(score)` en el componente padre. |
| RLS de inserción pública permite que cualquiera envíe scores arbitrarios desde fuera de la UI.                                                          | El `check (score >= 0)` en la tabla rechaza negativos. Scores extremos se aceptan como riesgo MVP; si hay abuso, se añade validación de rango en la API.          |
| El slug `rocas` está hardcodeado en el Route Handler y en el componente del juego. Si el slug cambia en la DB, rompe la integración.                    | El slug se obtiene siempre de la tabla `games`; documentar que `rocas` es el identificador canónico y no debe modificarse sin actualizar ambos lados.             |
| El panel de leaderboard añade una petición de red al cargar la página del juego, aumentando el tiempo hasta interactividad.                             | Usar `loading` skeleton durante la carga; si el fetch falla, mostrar el panel vacío sin bloquear el juego.                                                        |
