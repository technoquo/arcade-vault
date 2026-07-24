---
name: add-game
description: Agrega un nuevo juego canvas a Arcade Vault — copia los assets, registra en lib/data.ts, hace el seed en Supabase, crea el componente React wrapper y conecta el callback de game-over.
disable-model-invocation: true
argument-hint: '<game-slug o nombre del juego>'
---

# /add-game — Integrador de juegos canvas

Este skill guía la incorporación de un juego vanilla-JS/canvas al proyecto Arcade Vault paso a paso, con pausas para revisión entre cada etapa. Al final del proceso el juego estará completamente jugable, conectado al leaderboard de Supabase y sin errores de TypeScript.

Argumento recibido: `$ARGUMENTS`

---

## Filosofía

Un juego mal integrado rompe el leaderboard silenciosamente. Por eso este flujo es **lento durante la recopilación de información** y **metódico durante la implementación**. No improvises datos que el usuario no haya confirmado. No avances al siguiente paso sin que el anterior esté completo y verificado.

---

## Fase 1 — Recopilación de contexto (automática, sin preguntas aún)

Antes de interactuar con el usuario, recopila el estado actual del proyecto:

1. Lee `CLAUDE.md` en la raíz del proyecto.
2. Lee `.claude/skills/spec/SKILL.md` y `.claude/skills/spec/template.md` — estos dos archivos definen el formato y las reglas que debes seguir para generar el archivo de spec en la Fase 2.5. Memoriza la estructura de secciones del template: Header, Scope, Data model, Implementation plan, Acceptance criteria, Decisions, Risks.
3. Lista `specs/` para determinar el próximo número secuencial de spec. Si el último archivo es `05-games-leaderboard.md`, el siguiente será `06-`.
4. Lista `references/started-games/` y muestra los juegos de referencia disponibles con su número de carpeta. Ejemplo de salida esperada:
   ```
   Juegos de referencia disponibles:
     02-asteroids/   → game.js, index.html
     03-tetris/      → game.js, index.html, style.css
     04-arkanoid/    → game.js, index.html, assets/
   ```
   Si existe un `CLAUDE.md` dentro de la carpeta del juego de referencia, anota que está disponible — lo leerás más adelante en la Fase 3.
5. Lista `components/` para conocer los componentes existentes y evitar colisiones de nombres.
6. Lee `lib/data.ts` para ver los juegos ya registrados y los valores válidos de `cat` y `color`.

Con ese contexto en mano, pasa a la Fase 2.

---

## Fase 2 — Preguntas (bloque único, espera respuesta antes de continuar)

Presenta las siguientes preguntas **todas juntas** en un solo mensaje. No hagas preguntas de una en una.

> Antes de empezar necesito algunos datos sobre el nuevo juego. Respóndelos todos en un solo bloque:
>
> 1. **Slug** — identificador URL del juego (minúsculas, sin espacios, guiones permitidos). Ejemplo: `duelo-pixel`. Debe ser único y coincidir exactamente con el slug que se insertará en la tabla `games` de Supabase.
>
> 2. **Título** — nombre para mostrar en la interfaz (EN MAYÚSCULAS). Ejemplo: `DUELO PIXEL`.
>
> 3. **Origen del game.js** — elige una opción:
>    - La ruta a la carpeta de referencia (ej: `references/started-games/03-tetris/`)
>    - Una ruta absoluta o relativa a un archivo `game.js` externo
>    - `"lo proporciono yo"` si vas a pegar el código manualmente
>
> 4. **Categoría** — elige una: `ARCADE` | `PUZZLE` | `SHOOTER` | `VERSUS`
>
> 5. **Color temático** — elige uno: `cyan` | `magenta` | `yellow` | `green`
>
> 6. **Descripción corta** — una línea, máx. 50 caracteres. Se muestra en la card del juego. Ejemplo: `"Rebota la pelota y destruye muros de neón."`
>
> 7. **Descripción larga** — 1–2 oraciones. Se muestra en la página de detalle del juego. Ejemplo: `"Piezas geométricas descienden desde la oscuridad. Rótalas y limpia líneas para sobrevivir."`

Espera la respuesta del usuario. No avances hasta tenerla completa. Si falta algún dato, pide solo el dato faltante.

Con las respuestas, construye internamente las siguientes variables que usarás en toda la Fase 3:

- `SLUG` — el slug confirmado (ej: `nuevo-juego`)
- `TITLE` — el título en mayúsculas (ej: `NUEVO JUEGO`)
- `COMPONENT_NAME` — versión PascalCase del slug sin guiones + `Game` (ej: slug `nuevo-juego` → `NuevoJuegoGame`)
- `CAT` — la categoría elegida
- `COLOR` — el color elegido
- `SHORT` — descripción corta
- `LONG` — descripción larga
- `SOURCE_PATH` — ruta al `game.js` de origen (o `null` si el usuario lo proveerá)

Muestra un resumen de confirmación antes de empezar la implementación:

```
Resumen del juego a integrar:
  Slug:        SLUG
  Título:      TITLE
  Componente:  COMPONENT_NAME
  Categoría:   CAT
  Color:       COLOR
  Origen:      SOURCE_PATH (o "proporcionado manualmente")

¿Procedo con la implementación? [s/N]
```

Espera confirmación explícita. Si el usuario pide ajustes, aplícalos y muestra el resumen actualizado.

---

## Fase 2.5 — Generar y confirmar el archivo de spec

**Objetivo:** dejar constancia formal de la integración antes de tocar código, siguiendo el mismo formato que el resto de specs del proyecto.

Usa como referencia el formato de `.claude/skills/spec/template.md` que leíste en la Fase 1. Genera el spec sección por sección siguiendo este orden y mostrando cada una al usuario para que la confirme antes de avanzar a la siguiente:

### Sección 1 — Header

```markdown
# SPEC NN — Integración de TITLE en Arcade Vault

> **Status:** Draft
> **Depends on:** 05-games-leaderboard
> **Date:** FECHA-HOY
> **Objective:** Integrar el juego TITLE (slug: `SLUG`) como página jugable en Arcade Vault con leaderboard Top 12 conectado a Supabase.
```

Sustituye `NN` por el número secuencial detectado en la Fase 1, `TITLE` y `SLUG` por los valores confirmados en la Fase 2, y `FECHA-HOY` por la fecha actual en formato `YYYY-MM-DD`.

### Sección 2 — Scope

**In** (lo que cubre esta integración):
- `public/SLUG/game.js` — archivo del juego copiado de la fuente indicada.
- `lib/data.ts` — nueva entrada en el array `GAMES[]`.
- Registro en tabla `games` de Supabase (slug: `SLUG`).
- `components/COMPONENT_NAME.tsx` — wrapper React con canvas escalable y callback `onGameOver`.
- `app/juego/[id]/jugar/page.tsx` — branch condicional que renderiza el nuevo componente.
- Conexión de `window.onGameOver` en `game.js` (si el juego no la tiene ya).

**Out of scope** — ajusta según el juego concreto, pero como mínimo incluye:
- Modificaciones a la lógica interna del juego (balanceo, mecánicas, nuevas features).
- Panel de administración para gestionar juegos desde la UI.
- Soporte táctil / controles móviles.
- Tests automatizados.
- Cover image CSS (`.cover-SLUG`) si no existe — se menciona como próximo paso pero no bloquea la integración.

### Sección 3 — Data model

Documenta las dos estructuras que cambian:

**Entrada en `lib/data.ts`:**
```ts
{
  id: "SLUG",
  title: "TITLE",
  short: "SHORT",
  long: "LONG",
  cat: "CAT",
  cover: "cover-SLUG",
  color: "COLOR",
  best: 10000,
  plays: "0",
}
```

**Fila en tabla `games` de Supabase:**
```sql
insert into games (slug, name, description)
values ('SLUG', 'TITLE', 'SHORT');
```

### Sección 4 — Implementation plan

Incluye exactamente los 8 pasos de la Fase 3 de este skill, adaptados al juego concreto. Cada paso menciona los archivos afectados y la verificación mínima.

### Sección 5 — Acceptance criteria

Lista boolean de verificación. Incluye como mínimo:

- `public/SLUG/game.js` existe y coincide con la fuente indicada.
- Navegar a `/juego/SLUG/jugar` carga la página sin errores en consola.
- El canvas muestra el juego en ejecución.
- Al terminar la partida aparece el modal con la puntuación obtenida.
- Guardar el score lo inserta en la tabla `scores` de Supabase y refresca el leaderboard.
- Un usuario no autenticado puede guardar un score introduciendo su nombre.
- El leaderboard es visible para cualquier visitante sin iniciar sesión.
- `tsc --noEmit` pasa sin errores.

### Sección 6 — Decisions

Documenta al menos estas decisiones estándar del patrón del proyecto:

- **Sí:** `game.js` sin modificaciones a la lógica + `<Script strategy="afterInteractive">`. El canvas debe existir en el DOM antes de que el script lo busque.
- **Sí:** Escalado CSS con `transform: scale()` + `ResizeObserver`. Mantiene las coordenadas internas intactas sin tocar el juego.
- **Sí:** `window.onGameOver(score)` como contrato entre `game.js` y React. Mínima superficie de integración.
- **Sí:** `user_id` nullable en scores. Permite partidas anónimas sin romper el leaderboard.
- **No:** Autenticación obligatoria para jugar o guardar scores.
- **No:** Modificaciones a la lógica de juego — fuera de scope de una integración.

Agrega decisiones adicionales específicas del juego si surgieron durante las preguntas de la Fase 2.

### Sección 7 — Risks (solo si aplica)

Incluye al menos:

| Riesgo | Mitigación |
|--------|-----------|
| `game.js` usa un `id` de canvas distinto a `"canvas"` | Verificar en el Paso 4 con lectura del código; ajustar el componente antes de crearlo. |
| El juego no expone ningún hook de game-over accesible desde fuera | Leer el código antes de implementar; añadir `window.onGameOver(score)` en el punto exacto de game-over con aprobación del usuario. |

---

### Flujo de confirmación del spec

Muestra cada sección al usuario y espera confirmación o ajustes antes de pasar a la siguiente. Cuando todas estén aprobadas:

1. Determina el nombre del archivo: `NN-SLUG-arcade-vault.md` (donde `NN` es el número secuencial).
2. Pregunta al usuario si el nombre propuesto es correcto antes de escribirlo.
3. Escribe el archivo en `specs/NN-SLUG-arcade-vault.md` con estado `Draft`.
4. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec está en `Draft`. Cámbialo a `Approved` cuando lo hayas revisado.
   - Siguiente paso: pregunta si procede con la implementación ahora o prefiere revisar el spec primero.
5. **Espera respuesta explícita antes de iniciar la Fase 3.** Si el usuario quiere revisar primero, detente aquí.

---

## Fase 3 — Implementación (8 pasos con pausas)

Implementa **un paso a la vez**. Al terminar cada paso muestra:
```
Paso N completado. ¿Revisas y me confirmas para continuar con el Paso N+1?
```
Espera confirmación antes de avanzar.

---

### Paso 1 — Copiar los assets del juego a `public/SLUG/`

**Objetivo:** dejar `game.js` (y otros assets) disponibles en la ruta estática que Next.js sirve.

1. Si `SOURCE_PATH` apunta a una carpeta de referencia, copia todos los archivos relevantes:
   - `game.js` → `public/SLUG/game.js` (obligatorio)
   - `style.css` → `public/SLUG/style.css` (si existe)
   - Cualquier subcarpeta de assets (imágenes, sonidos) → `public/SLUG/<subcarpeta>/`
   - NO copies `index.html`, `README.md` ni `CLAUDE.md` — son documentación de referencia, no assets del juego.
2. Si el usuario va a proporcionar el código manualmente, crea la carpeta `public/SLUG/` vacía y pide al usuario que coloque el `game.js` ahí antes de continuar.
3. Confirma que `public/SLUG/game.js` existe antes de marcar el paso como completado.

Archivos creados: `public/SLUG/game.js` (+ opcionales)

---

### Paso 2 — Registrar el juego en `lib/data.ts`

**Objetivo:** que el juego aparezca en la plataforma (catálogo, página de detalle, navegación).

Agrega una nueva entrada al array `GAMES` en `lib/data.ts`. Usa los valores confirmados en la Fase 2. El campo `cover` sigue el patrón `cover-SLUG` (con guiones). Los valores `best` y `plays` son placeholders de arranque.

Plantilla a insertar (posición: al final del array, antes del cierre `]`):

```ts
  {
    id: "SLUG",
    title: "TITLE",
    short: "SHORT",
    long: "LONG",
    cat: "CAT",
    cover: "cover-SLUG",
    color: "COLOR",
    best: 10000,
    plays: "0",
  },
```

Reemplaza `SLUG`, `TITLE`, `SHORT`, `LONG`, `CAT`, `COLOR` con los valores reales.

Archivo modificado: `lib/data.ts`

---

### Paso 3 — Registrar el juego en Supabase (tabla `games`)

**Objetivo:** que el leaderboard funcione — el API de scores busca el juego por slug en la tabla `games`.

Ejecuta el siguiente SQL usando la herramienta `mcp__supabase__execute_sql`:

```sql
insert into games (slug, name, description)
values (
  'SLUG',
  'TITLE',
  'SHORT'
)
on conflict (slug) do nothing;
```

Sustituye los literales con los valores reales. La cláusula `on conflict` evita error si el juego ya existía.

Verifica la inserción con:
```sql
select id, slug, name from games where slug = 'SLUG';
```

Si la fila no aparece, detente y diagnostica antes de continuar.

---

### Paso 4 — Analizar `game.js` para detectar dimensiones y punto de game-over

**Objetivo:** tener toda la información técnica necesaria para crear el componente correctamente.

1. Lee `public/SLUG/game.js` completo.
2. Si existe `references/started-games/<NN-SLUG>/CLAUDE.md`, léelo también — suele documentar la arquitectura.
3. Detecta las **dimensiones del canvas**:
   - Busca patrones como `const W = N`, `canvas.width = N`, `width={N}`, o el atributo `width` en el `<canvas>` del `index.html` original.
   - Si no puedes determinarlo con certeza, pregunta al usuario: "No pude detectar las dimensiones del canvas en game.js. ¿Son 800×600 u otras?"
4. Detecta el **punto de game-over**:
   - Busca `window.onGameOver(` — si ya existe, anota la línea y marca `GAMEOVER_ALREADY_WIRED = true`.
   - Si no existe, busca donde el juego termina. Patrones comunes: `state = 'gameover'`, `gameOver()`, `endGame()`, `lives <= 0`, `lives === 0`.
   - Anota la línea exacta donde se debe insertar `if (typeof window.onGameOver === 'function') window.onGameOver(score);`
5. Identifica el **id del canvas** que usa el juego: busca `getElementById(` o `querySelector(` para saber si usa `"canvas"`, `"board"`, u otro.
6. Guarda internamente: `CANVAS_W`, `CANVAS_H`, `CANVAS_ID`, `GAMEOVER_ALREADY_WIRED` (boolean), y si es false: la línea y contexto exactos donde insertar el callback.

Muestra el resumen del análisis antes de continuar:

```
Análisis de game.js:
  Dimensiones:       CANVAS_W × CANVAS_H px
  Canvas id:         CANVAS_ID
  window.onGameOver: [ya integrado | NO integrado — se insertará en línea N]
```

---

### Paso 5 — Crear el componente `components/COMPONENT_NAME.tsx`

**Objetivo:** envolver el canvas game en un componente React que acepta el callback `onGameOver`.

Crea `components/COMPONENT_NAME.tsx` con la siguiente plantilla. Sustituye `SLUG`, `COMPONENT_NAME`, `CANVAS_W`, `CANVAS_H` y `CANVAS_ID` con los valores detectados en el Paso 4:

```tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export default function COMPONENT_NAME({
  onGameOver,
}: {
  onGameOver?: (score: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateScale = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const scale = Math.min(containerW / CANVAS_W, containerH / CANVAS_H);
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
      canvas.style.marginLeft = `${(containerW - CANVAS_W * scale) / 2}px`;
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (onGameOver) {
      (window as any).onGameOver = onGameOver;
    }
    return () => {
      delete (window as any).onGameOver;
    };
  }, [onGameOver]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} id="CANVAS_ID" width={CANVAS_W} height={CANVAS_H} />
      <Script src="/SLUG/game.js" strategy="afterInteractive" />
    </div>
  );
}
```

Notas importantes:
- `CANVAS_W` y `CANVAS_H` deben ser números enteros en el JSX, no strings.
- El `id` del `<canvas>` debe coincidir exactamente con el que usa `game.js` (detectado en el Paso 4).
- El `useEffect` del `onGameOver` expone el callback como `window.onGameOver` para que `game.js` pueda llamarlo.

Archivo creado: `components/COMPONENT_NAME.tsx`

---

### Paso 6 — Conectar `window.onGameOver` en `game.js` (solo si NO está integrado)

**Si `GAMEOVER_ALREADY_WIRED` es `true`:** sáltate este paso completamente e indícalo al usuario.

**Si `GAMEOVER_ALREADY_WIRED` es `false`:**

1. Muestra el diff propuesto al usuario. Ejemplo:

```
En public/SLUG/game.js — contexto actual:

  if (lives <= 0) {
    state = "gameover";
  }

Cambio propuesto:

  if (lives <= 0) {
    state = "gameover";
    if (typeof window.onGameOver === 'function') window.onGameOver(score);
  }

¿Aplico este cambio? [s/N]
```

2. Espera confirmación explícita del usuario. **No modifiques `game.js` sin ella.**
3. Si el usuario aprueba, aplica el cambio en la línea indicada.
4. Si el usuario rechaza o pide ajustar la ubicación, muestra las alternativas y espera nueva confirmación.

La llamada a `window.onGameOver` debe ir en el mismo bloque donde se establece el estado de game-over, inmediatamente después. La variable pasada debe ser la puntuación final del jugador (`score`, `this.score`, o el nombre exacto que usa el juego).

Archivo modificado (condicionalmente): `public/SLUG/game.js`

---

### Paso 7 — Conectar el componente en `app/juego/[id]/jugar/page.tsx`

**Objetivo:** que la ruta de juego renderice el nuevo componente cuando `id === 'SLUG'`.

1. Agrega el import al inicio del archivo, junto a los imports existentes:

```tsx
import COMPONENT_NAME from "@/components/COMPONENT_NAME";
```

2. Localiza el bloque condicional que selecciona el componente a renderizar. Actualmente tiene esta forma:

```tsx
{id === "rocas" ? (
  <AsteroidsGame />
) : (
  <div className="game-arena">
    ...
  </div>
)}
```

3. Agrega el nuevo juego **antes** del bloque `else` final:

```tsx
{id === "rocas" ? (
  <AsteroidsGame />
) : id === "SLUG" ? (
  <COMPONENT_NAME onGameOver={(s) => { setScore(s); setOver(true); }} />
) : (
  <div className="game-arena">
    ...
  </div>
)}
```

Si ya hay más juegos en la cadena condicional, agrégalo antes del último bloque `: (`.

El callback `onGameOver` recibe la puntuación final (`s`) del juego: llama `setScore(s)` para mostrarla en el modal y `setOver(true)` para activarlo. El timer de puntuación falsa del `useEffect` se detiene automáticamente cuando `over` es `true`.

Archivo modificado: `app/juego/[id]/jugar/page.tsx`

---

### Paso 8 — Verificación TypeScript

**Objetivo:** garantizar que el proyecto compila sin errores.

Ejecuta:

```bash
npx tsc --noEmit
```

Si hay errores de tipo:
- Analiza cada error y corrígelo en el archivo correspondiente.
- Errores comunes en este flujo:
  - Prop `onGameOver` mal tipada — verifica que la interfaz del componente declare `onGameOver?: (score: number) => void`.
  - Import no resuelto — verifica que el nombre del componente en el import coincide con el nombre del archivo.
- Muestra los errores al usuario con contexto antes de corregirlos.
- Vuelve a ejecutar `tsc --noEmit` después de cada corrección hasta obtener salida limpia.

Salida esperada: ninguna línea de error. Si `npx tsc --noEmit` termina sin output, el proyecto está limpio.

---

## Cierre

Cuando todos los pasos estén completados, muestra el resumen final:

```
✅ Juego integrado correctamente.

Spec creado:
  specs/NN-SLUG-arcade-vault.md    (estado: Draft — cámbialo a Approved tras revisión)

Archivos creados:
  public/SLUG/game.js              (y otros assets si aplica)
  components/COMPONENT_NAME.tsx

Archivos modificados:
  lib/data.ts                      (nueva entrada en GAMES[])
  app/juego/[id]/jugar/page.tsx    (nuevo branch en el condicional)
  public/SLUG/game.js              (window.onGameOver — si fue necesario)

Supabase:
  games.slug = 'SLUG'              insertado

Próximos pasos sugeridos:
  1. Revisa specs/NN-SLUG-arcade-vault.md y cámbialo a Approved.
  2. Añade la imagen de cover (CSS class: cover-SLUG) en app/globals.css si no existe.
  3. Prueba la partida completa en /juego/SLUG/jugar y verifica que el modal
     de fin de partida aparece con la puntuación correcta.
  4. Verifica que guardar el score lo inserta en la DB y aparece en el leaderboard.
```

---

## Reglas duras

Las siguientes reglas se aplican durante toda la ejecución del skill.

1. **Nunca avances al siguiente paso sin confirmación explícita del usuario.** "Sí", "adelante", "ok", "go" o equivalentes son suficientes. Silencio o ambigüedad no lo son.

2. **No implementes nada antes de que el spec esté escrito y el usuario haya confirmado que procede.** El spec de la Fase 2.5 es obligatorio — no es opcional ni puede omitirse aunque el usuario quiera ir directo al código.

3. **Nunca modifiques `game.js` sin mostrar el diff y esperar aprobación.** El código del juego es responsabilidad del desarrollador — tú propones, el usuario aprueba.

4. **El slug en `lib/data.ts`, en la tabla `games` de Supabase y en la ruta `public/SLUG/` deben ser idénticos.** Una discrepancia hace que el leaderboard falle silenciosamente.

5. **No inventes dimensiones de canvas.** Si no puedes detectarlas en `game.js` o en el `index.html` de referencia, pregunta al usuario antes de escribir el componente.

6. **No registres el juego en Supabase si el Paso 1 falló.** Sin `game.js` en `public/SLUG/` el juego no es jugable — un registro huérfano en la DB causará errores en el leaderboard.

7. **Usa siempre `strategy="afterInteractive"` en el `<Script>`.** No uses `strategy="beforeInteractive"` ni `lazyOnload` — el canvas debe existir en el DOM antes de que `game.js` lo busque.

8. **El `id` del `<canvas>` en el componente debe coincidir con el que usa `game.js`.** Verifica esto en el Paso 4. El patrón del proyecto usa `id="canvas"`, pero algunos juegos usan otros ids (`"board"`, `"gameCanvas"`, etc.).

9. **`tsc --noEmit` debe pasar limpio antes de cerrar.** No declares el juego como integrado si hay errores de TypeScript pendientes.

10. **Si el usuario provee el `game.js` manualmente, espera a que confirme que lo colocó en `public/SLUG/game.js` antes de continuar con el Paso 4.** No asumas que ya está ahí.

11. **No modifiques ningún archivo fuera de la lista de archivos afectados de cada paso.** En particular, no toques `app/layout.tsx`, `middleware.ts`, ni ningún archivo de configuración de autenticación.
