---
name: spec-impl-game
description: Implementa una spec aprobada de juego siguiendo el flujo de /spec-impl y, al terminar, dispara skin-designer y mobile-porter en secuencia (nunca en paralelo) para el slug del juego.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementador de specs de juego con cierre automatizado

Este skill es una extensión de `/spec-impl` pensada específicamente para specs de **juegos nuevos de Arcade Vault**. Ejecuta el mismo flujo de implementación paso a paso y, al terminar, encadena dos subagentes que dejan al juego listo con skins y controles mobile.

Respondé siempre en español (el proyecto trabaja en español).

---

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Branch-creation config:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

---

## Filosofía

Un juego nuevo en Arcade Vault no está "terminado" cuando se cierra el plan de la spec. Faltan siempre dos pasos:

1. **Skins** — cada juego debe tener al menos `neon`, `retro` y `clasico` sobre el shell oscuro (`#0a0a0f`).
2. **Mobile** — cada juego debe tener `MobileGamepad` cableado en su play-page (spec `10-touch-controls.md`).

Este skill automatiza el cierre secuencial de esos dos pasos delegando en los subagentes especializados:

- `skin-designer` — un juego a la vez, agrega/completa las 3 skins estándar.
- `mobile-porter` — un juego a la vez, cabla `MobileGamepad` en la play-page.

**Ambos agentes se disparan en secuencia, nunca en paralelo**, y cada uno con confirmación explícita del usuario. El estado de la spec permanece en `Approved` durante todo el flujo — cambiarla a `Implementado` es una decisión humana que ocurre después de verificar los criterios de aceptación.

---

## Instructions

Seguí las cinco fases en orden estricto. **No avances a la siguiente si la anterior no cerró correctamente.**

Antes de arrancar, leé `.claude/skills/spec-impl/SKILL.md` con la herramienta Read: las Fases 1-4 de este skill son **exactamente esas mismas fases** y las vas a ejecutar por referencia.

---

### Fases 1-4 — Delegadas a `/spec-impl`

Ejecutá las Fases 1, 2, 3 y 4 **exactamente como están definidas en `.claude/skills/spec-impl/SKILL.md`**:

- **Fase 1** — Identificar la spec a partir de `$ARGUMENTS` (nombre completo, número o slug).
- **Fase 2** — Validar que el estado signifique `Approved` (en cualquier idioma). Si no lo es, detener y mostrar el mensaje de error estándar. No continuar.
- **Fase 3** — Derivar nombre de rama `spec-NN-slug`, respetar `AutoCreateBranch` (default `true`), crear/switch a la rama, y mostrar objetivo + alcance + plan + criterios de aceptación de la spec.
- **Fase 4** — Implementar el plan paso a paso con pausas entre cada paso para que el usuario revise el diff. Regla dura: implementar lo que la spec dice; ambigüedades se pausan y se preguntan; scope creep se rechaza.

**No repliques el texto de esas fases acá.** Seguilas del archivo fuente. Si el usuario detecta discrepancias, la fuente autoritativa es `.claude/skills/spec-impl/SKILL.md`.

Al terminar el último paso del plan, `/spec-impl` mostraría:

```
✅ All steps of the plan are implemented.

Next step: verify the spec's acceptance criteria one by one.
If they all pass, update the spec's state to "Implemented"...
```

**En este skill NO cerrás con ese mensaje.** En su lugar, pasás a la Fase 5.

---

### Fase 5 — Post-implementación: agentes en secuencia

Ahora ejecutás la parte nueva del skill.

#### 5.0 — Inferir el slug del juego

A partir del nombre del spec file y del contenido del objetivo/alcance, derivá el slug del juego. Como fuente canónica de slugs válidos, usá `lib/data.ts` (`GAMES[]`).

Ejemplos de mapeo típicos:

- `05-asteroids-integracion.md` → `rocas`
- `06-tetris-arcade-vault.md` → `tetris`
- `07-arkanoid-arcade-vault.md` → `arkanoid`
- `08-snake-arcade-vault.md` → `snake`
- `11-frogger-arcade-vault.md` → `frogger` (según lo que exista en `GAMES[]`)

Si el slug se puede inferir con certeza, mostralo. Si no se puede inferir (spec ambigua, más de un juego mencionado, no coincide con ningún slug de `GAMES[]`), listá los slugs válidos y pedile al usuario que confirme.

Mostrá al usuario:

```
✅ Spec implementada. Pasos del plan completos.

Juego detectado: <slug>
(Rama activa: spec-NN-slug)

A continuación voy a lanzar dos subagentes en secuencia (nunca en paralelo):
  1. skin-designer  → agrega/completa neon, retro, clasico
  2. mobile-porter  → cabla MobileGamepad en la play-page

Cada uno requiere tu confirmación antes de arrancar y cada uno correrá su propio flujo interactivo.
```

Esperá confirmación del slug si tuviste dudas. Si el usuario corrige el slug, usá el corregido de ahí en adelante.

#### 5A — Disparar `skin-designer`

Preguntá:

```
¿Procedo a lanzar skin-designer para <slug>?
  (sí / saltar / cancelar)
```

Reglas:

- **`sí`** → Invocá el agente `skin-designer` usando la herramienta Agent con `subagent_type: skin-designer`. El prompt debe contener:
  - Slug del juego objetivo (`<slug>`).
  - Contexto breve: "Este agente se invoca desde `/spec-impl-game` tras implementar la spec `NN-slug`. El juego está en la rama `spec-NN-slug` recién implementada. Es probable que el juego no tenga aún ninguna skin implementada, así que las 3 estándar (neon, retro, clasico) faltan todas — pero verificá con tu Fase 1 de auditoría."
  - Instrucción explícita: "Conducí tu propio flujo interactivo con el usuario (pedile skins a diseñar y restricciones estéticas). No asumas nada por defecto."
- **`saltar`** → Registrá `skin-designer: saltado` y pasá a Fase 5B sin lanzar el agente.
- **`cancelar`** → Registrá `skin-designer: cancelado`, no lances agentes, saltá directo a la Fase 5C con estado cancelado para ambos.

**Esperá a que el agente termine antes de continuar.** No paralelices. No inicies Fase 5B hasta que `skin-designer` haya cerrado (ya sea completando su Fase 6 o cancelando internamente).

#### 5B — Disparar `mobile-porter`

Una vez cerrada la Fase 5A (ejecutada o saltada), preguntá:

```
¿Procedo a lanzar mobile-porter para <slug>?
  (sí / saltar / cancelar)
```

Reglas:

- **`sí`** → Invocá el agente `mobile-porter` usando la herramienta Agent con `subagent_type: mobile-porter`. El prompt debe contener:
  - Slug del juego objetivo (`<slug>`).
  - Contexto breve: "Este agente se invoca desde `/spec-impl-game` tras implementar la spec `NN-slug` y (opcionalmente) tras skin-designer. El juego está en la rama `spec-NN-slug`. El objetivo es cablar `MobileGamepad` en `app/games/<slug>/play/page.tsx` siguiendo el patrón del spec 10."
  - Instrucción: "Conducí tu propio flujo (leé el spec 10, el componente reutilizable, la play-page de referencia y la del juego objetivo). No modifiques el componente canvas del juego."
- **`saltar`** o **`cancelar`** → Registrá el estado correspondiente y pasá a la Fase 5C.

**Esperá a que el agente termine antes de continuar.** No paralelices.

#### 5C — Cierre

Mostrá el resumen final:

```
✅ Flujo /spec-impl-game completado.

Spec:            specs/NN-slug.md
Estado spec:     Approved (sin cambios — actualizalo a "Implementado" manualmente cuando verifiques los criterios de aceptación)
Rama activa:    spec-NN-slug
Juego:           <slug>

Cierre secuencial de agentes:
  skin-designer:   [ejecutado / saltado / cancelado]
  mobile-porter:   [ejecutado / saltado / cancelado]

Próximos pasos sugeridos:
  1. Corré `npm run dev` y probá el juego en /games/<slug>/play (desktop y viewport 390 px).
  2. Verificá los criterios de aceptación de la spec uno por uno.
  3. Si todos pasan, cambiá el estado del spec a "Implementado" y hacé el commit final antes de mergear spec-NN-slug.
  4. Si algún agente quedó pendiente, podés volver a invocarlo manualmente:
     - `/agent skin-designer` con "trabajá <slug>"
     - `/agent mobile-porter` con "portá <slug> a mobile"
```

---

## Reglas duras (aplican durante toda la ejecución)

1. **Respondé en español.** El proyecto trabaja en español.
2. **Fases 1-4 son las de `spec-impl` — no las repliques ni las modifiques.** Si detectás desviación, la fuente autoritativa es `.claude/skills/spec-impl/SKILL.md`.
3. **Los dos agentes se lanzan en secuencia, nunca en paralelo.** No uses `Agent` con múltiples `subagent_type` en el mismo bloque.
4. **Cada agente requiere confirmación explícita del usuario antes de dispararse.** Silencio o ambigüedad no cuentan como `sí`.
5. **El estado de la spec permanece `Approved` durante todo el flujo.** Cambiarlo a `Implementado` es una decisión humana posterior a verificar criterios de aceptación.
6. **Nunca inventes el slug del juego.** Si no podés inferirlo de `lib/data.ts` con certeza, preguntá al usuario y validá contra `GAMES[]`.
7. **Nunca lances los agentes con un slug que no exista en `GAMES[]`.** Si el juego no está registrado todavía, avisá al usuario y sugerí correr `/add-game <slug>` antes.
8. **Si el usuario cancela en Fase 5A, no lances la Fase 5B automáticamente** — igual saltás al cierre (5C) mostrando ambos como cancelados salvo que el usuario diga explícitamente que quiere seguir con mobile-porter.
9. **Nunca modifiques el componente canvas del juego desde este skill.** La orquestación se hace en la play-page y en los archivos que cada agente delega.

---

## Resumen del comportamiento esperado

```
/spec-impl-game 11-frogger-arcade-vault

  Fases 1-4  →  Delegadas a spec-impl:
                 · Encuentra specs/11-frogger-arcade-vault.md
                 · Valida estado Approved
                 · Crea/switch a rama spec-11-frogger-arcade-vault
                 · Implementa paso a paso con pausas

  Fase 5.0   →  Infiere slug: `frogger`. Confirma con usuario.

  Fase 5A    →  Pregunta: "¿Lanzo skin-designer para frogger?"
                 · Si sí → Agent(subagent_type: skin-designer, prompt: "juego: frogger, ...")
                          Espera a que el agente termine.
                 · Si saltar/cancelar → pasa a 5B con estado registrado.

  Fase 5B    →  Pregunta: "¿Lanzo mobile-porter para frogger?"
                 · Si sí → Agent(subagent_type: mobile-porter, prompt: "juego: frogger, ...")
                          Espera a que el agente termine.
                 · Si saltar/cancelar → pasa a 5C con estado registrado.

  Fase 5C    →  Muestra resumen final. Recuerda verificar criterios y
                 cambiar estado a "Implementado" manualmente.
```

---

## Diferencias con `/spec-impl`

| Aspecto                          | `/spec-impl`                     | `/spec-impl-game`                                        |
| -------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Fases 1-4 (identificar → validar → rama → implementar) | Idénticas | Idénticas (delegadas por referencia) |
| Cierre tras último paso del plan | Recordar verificar criterios y cambiar estado | Sigue a Fase 5 (agentes en secuencia)     |
| Skin-designer                    | No lo invoca                     | Lo invoca con confirmación (Fase 5A)                     |
| Mobile-porter                    | No lo invoca                     | Lo invoca con confirmación (Fase 5B)                     |
| Uso recomendado                  | Cualquier spec                   | Specs de juegos nuevos de Arcade Vault                   |
