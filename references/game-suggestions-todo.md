# Game Suggestions TODO — Arcade Vault

> Registro de juegos propuestos por el subagente `game-planner`. Editable a mano.
> Convención de estado en checkbox: `[ ]` pendiente · `[x]` cerrado (implementado o descartado).

## Aprobados (por implementar)

- [ ] `duelo-tanques` — VERSUS · magenta · "Dos tanques, un laberinto, un solo superviviente." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Aporta apuntado 2D + proyectiles con rebote + terreno destructible; mecánica VERSUS distinta al reflejo 1D de `duelo-pixel` (linaje Combat / Tank Wars). Score: rondas ganadas por J1 (0–5).
- [ ] `laberinto-plasma` — ARCADE · cyan · "Guía la esfera por corredores giratorios." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Aporta entorno mutable (laberinto con paredes rotativas); mecánica de terreno dinámico ausente (`gloton` es estático, `ranaria` previsible).
- [ ] `pinbol-cromo` — ARCADE · magenta · "Dos flippers, mil rebotes, cero perdón." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Pinball clásico con física de rebotes bajo gravedad realista + input de 2 botones (izq/der); esquema de control y sub-género ausentes.
- [ ] `topo-neon` — ARCADE · yellow · "Golpea topos antes de que se escondan." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Whack-a-mole aporta puntería reactiva sobre grilla estática temporalizada; `rocas` es apuntado 360°, `invasores` filas descendentes.
- [ ] `centipix` — ARCADE · cyan · "Fragmenta al ciempiés antes de que te alcance." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Enemigo con estructura de segmentos que se fragmenta al ser golpeado (linaje Centipede); mecánica de división viva ausente.
- [ ] `paraboom` — ARCADE · magenta · "Atrapa paracaidistas antes de que aterricen." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Cañón antiaéreo con apuntado angular y proyectiles balísticos parabólicos; balística ausente en catálogo (linaje Paratrooper).
- [ ] `enlace-tres` — PUZZLE · cyan · "Alinea tres gemas del mismo color y cadena combos." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Match-3 con swap + cascadas (linaje Bejeweled/Candy Crush); sub-género PUZZLE ausente, muy distinto del stack de `caida`. Score: gemas × 10 × multiplicador de cascada.
- [ ] `caja-carga` — PUZZLE · yellow · "Empuja cajas hasta las marcas del almacén." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Sokoban (empuje lógico irreversible); puzzle lógico-espacial de un solo verbo ausente. Score: 10000 − movimientos×5 − segundos×2.
- [ ] `flujo-cable` — PUZZLE · cyan · "Conecta pares de terminales sin cruzar cables." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Path-finding / flow-connect (linaje Flow Free / Numberlink); trazado continuo con no-cruce + cobertura total. Score: niveles×500 + segundos restantes×10.
- [ ] `caja-fisica` — PUZZLE · magenta · "Dibuja formas y deja que la gravedad haga el resto." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Physics-puzzle sandbox (linaje Crayon Physics / Armadillo Run); simulación física continua y creatividad de solución, opuesto al puzzle discreto de `caida`. Score: 10000 − formas×300 − segundos×20.
- [ ] `mente-maestra` — PUZZLE · yellow · "Adivina el código secreto en 10 intentos." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Lógica deductiva / code-breaking (linaje Mastermind); puzzle deductivo puro sin timer ni gravedad, razonamiento bayesiano. Score: rondas×1000 + intentos no usados×100.
- [ ] `caza-vertical` — SHOOTER · cyan · "Sube en tu nave y arrasa oleadas del cielo." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Shmup vertical con scroll continuo + patrones curvos + power-ups + jefes; diferente de `invasores` (formación estática) y `rocas` (arena toroidal sin scroll).
- [ ] `enjambre-horizontal` — SHOOTER · magenta · "Vuela lateral esquivando terreno vivo." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Shmup horizontal (linaje R-Type/Gradius) con terreno navegable y orbe compañero; perspectiva lateral ausente en el catálogo.
- [ ] `doble-palanca` — SHOOTER · magenta · "Movés con una mano, disparás con la otra." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Twin-stick top-down con disociación movimiento/apunte en 8 direcciones; esquema de input dual ausente (`invasores` tiene 1 eje, `rocas` acopla rotación+empuje).
- [ ] `patos-cromados` — SHOOTER · yellow · "Apuntá el retículo y derribá antes que escapen." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Gallery/rail shooter (linaje Duck Hunt) con retículo + hitscan; sin nave del jugador, apunte fino sobre trayectorias móviles predefinidas.
- [ ] `torreta-orbital` — SHOOTER · cyan · "Interceptá misiles antes del impacto en tu base." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Turret defense predictivo (linaje Missile Command); único shooter donde se dispara hacia dónde llegarán los objetivos (mecánica predictiva) desde base fija.
- [ ] `puno-neon` — VERSUS · magenta · "Boxeo de silueta a puñetazos y esquivas." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Fighting/boxing local (linaje Punch-Out / Karate Champ); cuerpo a cuerpo con temporización y stamina, ausente entre los VERSUS actuales. Score: rondas×1000 + HP restante J1.
- [ ] `disco-hielo` — VERSUS · cyan · "Air hockey de neón: mete gol al rival." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Air-hockey con dos mazos deslizantes en 2D + disco con física de rebote; distinto de `duelo-pixel` (paletas 1D fijas). Score: goles J1 − goles CPU (match a 7).
- [ ] `sumo-orbita` — VERSUS · yellow · "Empuja al rival fuera del ring circular." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Sumo/push-off arena; combate por desplazamiento físico (inercia + ángulo de impacto), sin proyectiles ni golpes discretos. Score: rondas×100 + margen vida (best-of-5).
- [ ] `pistola-alba` — VERSUS · green · "Duelo del Oeste: dispará cuando suene." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Western showdown / reaction duel; reflejo puro con ventana de tiempo y castigo por anticipar (evento único, no loop continuo). Score: rondas×1000 + (7000 − ms reacción J1).
- [ ] `taco-billar` — VERSUS · green · "Apuntá, medí fuerza, embocá primero." · Propuesto 2026-07-26 · Aprobado 2026-07-26 · **Razón:** Flick/aim con física (billar 8-ball); único VERSUS por turnos con precisión y planificación multi-cuerpo, opuesto a los tres VERSUS en tiempo real. Score: bolas embocadas J1 × 500 + bonus victoria.

## Propuestos (esperando decisión)

- [ ] `zona-neon` — VERSUS · yellow · "Pinta más territorio que tu rival en 60s." · Propuesto 2026-07-26 · **Razón:** Aporta VERSUS por dominio territorial + reloj (estrategia sobre reflejos), diferenciándose de `duelo-pixel` (paleta reactiva) y `duelo-tanques` (apuntado ofensivo). Score: % de celdas pintadas por J1 (0–100).

## Descartados

- [x] `escalador-neon` — ARCADE · magenta · "Sube andamios esquivando barriles rodantes." · Propuesto 2026-07-26 · Descartado 2026-07-26 · **Razón:** Llenaba gap de plataformas fijas + salto + gravedad (linaje Donkey Kong), aportando verticalidad ausente en el catálogo.
- [x] `salta-cactus` — ARCADE · yellow · "Corre sin fin y salta obstáculos infinitos." · Propuesto 2026-07-26 · Descartado 2026-07-26 · **Razón:** Introducía scroll horizontal infinito + reflejos puros (endless runner), mecánica arcade emblemática ausente en el catálogo.
- [x] `torre-bloques` — ARCADE · cyan · "Apila bloques en movimiento sin errar." · Propuesto 2026-07-26 · Descartado 2026-07-26 · **Razón:** Timing puro de un botón + precisión acumulativa; único juego con progresión vertical infinita del catálogo.

## Implementados

- [x] `tetris` — PUZZLE · green · Spec 06 · Componente `TetrisGame`
- [x] `arkanoid` — ARCADE · magenta · Spec 07 · Componente `ArkanoidGame`
- [x] `snake` — ARCADE · green · Spec 08 · Componente `SnakeGame`
- [x] `rocas` — SHOOTER · yellow · Spec 05 · Componente `AsteroidsGame`
