# CONCEPT — DUELO DE TANQUES (game-jam)

> **Status:** Propuesto
> **Date:** 2026-07-26
> **Tema:** Duelo local 1v1 en laberinto con proyectiles rebotables (linaje Atari Combat / Tank Wars).
> **Slug:** `duelo-tanques`

---

## Pitch

Dos tanques encerrados en un laberinto de neón. El primero que impacte 5 veces al rival — o que sobreviva a sus propios rebotes — se corona.

## Mecánica core

- **Verbo principal:** conducir + rotar + disparar. En cada tick el jugador decide si avanza, rota, o suelta un proyectil.
- **Objetivo:** meter 5 impactos al tanque enemigo (best-of-9 estructural: primer jugador a 5 gana).
- **Fail condition:** ser impactado por un proyectil (del rival **o** por uno propio que rebotó). La ronda cierra al primer impacto letal.

## Look & feel

- **Paleta:** fondo negro con grilla apenas insinuada (líneas cyan al 10% de opacidad). Muros indestructibles en blanco puro (bordes de arena). Muros destructibles en gris azulado, con flash magenta al ser destruidos. Tanque J1 magenta, tanque J2 cyan, proyectiles amarillos con estela corta.
- **Referencias visuales:** _Combat_ (Atari 2600, 1977) para la disposición del duelo; _Tank_ (arcade Kee Games, 1974) para el minimalismo geométrico; los brutalist arcade cabinets de los 80 para el HUD.
- **Tipografía / HUD:** monoespaciada retro (heredada del stack de Arcade Vault). HUD superior con el marcador de rondas de cada jugador en su color respectivo (`P1: ★★☆☆☆   P2: ★★★☆☆`).

## Referencias inspiradoras

- **Combat (Atari 2600, 1977)** — linaje mecánico directo: tanques + proyectiles + arena con obstáculos.
- **Tank Wars / Wii Play Tanks (2006)** — refinamiento moderno del rebote y la construcción de laberintos como pieza clave de la estrategia.
- **BZFlag** — cultura del duelo táctico donde el rebote inteligente vale más que el reflejo bruto.

## Público objetivo

Jugadores que buscan un VERSUS local pensado, no reactivo. Alguien que disfruta calcular ángulos y anticipar rebotes más que apretar botones rápido. Complementa a `duelo-pixel` (que es puro reflejo) y llena el gap de VERSUS táctico.

## Hook narrativo

Dos pilotos anónimos, dos torretas idénticas, un campo de escombros que se reconfigura entre rondas. Ningún tanque abandona el campo con vida — solo uno lo abandona con el trofeo.

## Score model

**Ecuación:** `score = state.roundsWonP1` — número entero de rondas ganadas por J1 al terminar el match.

- **Rango:** `0` (J2 barrió 5-0) a `5` (J1 barrió 5-0).
- **Mínimo esperado en un match reñido:** 4 (J1 perdió 5-4).
- **Score máximo posible:** 5.

Nota: el leaderboard registra la performance de J1. J2 es el "oponente" desde la óptica del score, aunque ambos jugadores comparten el teclado.
