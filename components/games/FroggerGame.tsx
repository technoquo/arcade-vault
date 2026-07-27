"use client";

import { useEffect, useRef } from "react";

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number;
  width: number;
  type: "car" | "truck" | "log" | "turtle";
  submerged?: boolean;
}

interface Lane {
  row: number;
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

export interface FroggerGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

function spreadEntities(
  count: number,
  type: Entity["type"],
  width: number,
  startOffset = 0
): Entity[] {
  const step = COLS / count;
  const out: Entity[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      col: (startOffset + i * step) % COLS,
      width,
      type,
      ...(type === "turtle" ? { submerged: false } : {}),
    });
  }
  return out;
}

function buildLanes(level: number): Lane[] {
  const scale = Math.pow(1.15, Math.max(0, level - 1));

  const roadPresets: Array<{
    row: number;
    baseSpeed: number;
    dir: 1 | -1;
    type: Entity["type"];
    width: number;
    count: number;
    offset: number;
  }> = [
    { row: 12, baseSpeed: 1.5, dir: 1, type: "car", width: 1, count: 3, offset: 0 },
    { row: 11, baseSpeed: 2.2, dir: -1, type: "truck", width: 3, count: 2, offset: 2 },
    { row: 10, baseSpeed: 2.6, dir: 1, type: "car", width: 1, count: 3, offset: 1 },
    { row: 9, baseSpeed: 3.4, dir: -1, type: "car", width: 1, count: 4, offset: 0.5 },
    { row: 8, baseSpeed: 2.0, dir: 1, type: "truck", width: 2, count: 2, offset: 3 },
  ];

  const riverPresets: Array<{
    row: number;
    baseSpeed: number;
    dir: 1 | -1;
    type: Entity["type"];
    width: number;
    count: number;
    offset: number;
  }> = [
    { row: 6, baseSpeed: 1.2, dir: 1, type: "log", width: 3, count: 2, offset: 0 },
    { row: 5, baseSpeed: 1.6, dir: -1, type: "turtle", width: 2, count: 3, offset: 1 },
    { row: 4, baseSpeed: 1.0, dir: 1, type: "log", width: 4, count: 2, offset: 3 },
    { row: 3, baseSpeed: 2.0, dir: -1, type: "turtle", width: 3, count: 2, offset: 0 },
    { row: 2, baseSpeed: 2.4, dir: 1, type: "log", width: 2, count: 3, offset: 2 },
    { row: 1, baseSpeed: 1.8, dir: -1, type: "log", width: 3, count: 2, offset: 1 },
  ];

  const build = (preset: (typeof roadPresets)[number]): Lane => ({
    row: preset.row,
    speed: preset.baseSpeed * scale,
    dir: preset.dir,
    entities: spreadEntities(preset.count, preset.type, preset.width, preset.offset),
  });

  return [...roadPresets.map(build), ...riverPresets.map(build)];
}

const INITIAL_ROUND_MS = 15000;
const JUMP_MS = 120;
const TURTLE_VISIBLE_MS = 3000;
const TURTLE_SUBMERGED_MS = 1500;

function centerCol(): number {
  return Math.floor(COLS / 2);
}

function newFrog(): Frog {
  const c = centerCol();
  return { col: c, row: ROW_START, animating: false, animT: 0, targetCol: c, targetRow: ROW_START };
}

function roundTimeForLevel(level: number): number {
  return Math.max(6000, INITIAL_ROUND_MS - (level - 1) * 1000);
}

function drawEntity(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number) {
  const w = e.width * CELL;
  const h = CELL;
  if (e.type === "car") {
    ctx.fillStyle = "#e34e58";
    ctx.fillRect(x + 3, y + 6, w - 6, h - 12);
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x + 10, y + h - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + w - 10, y + h - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === "truck") {
    ctx.fillStyle = "#6a6f7a";
    ctx.fillRect(x + 2, y + 4, w - 4, h - 8);
    ctx.fillStyle = "#3a3f4a";
    ctx.fillRect(x + w - CELL + 2, y + 4, CELL - 6, h - 8);
  } else if (e.type === "log") {
    ctx.fillStyle = "#7a4a1a";
    ctx.fillRect(x + 2, y + 4, w - 4, h - 8);
    ctx.fillStyle = "#5a3612";
    for (let i = 1; i < e.width; i++) {
      ctx.fillRect(x + i * CELL - 1, y + 4, 2, h - 8);
    }
  } else if (e.type === "turtle") {
    if (e.submerged) {
      ctx.strokeStyle = "rgba(90, 190, 110, 0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < e.width; i++) {
        ctx.beginPath();
        ctx.arc(x + i * CELL + CELL / 2, y + CELL / 2, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#4ea34e";
      for (let i = 0; i < e.width; i++) {
        ctx.beginPath();
        ctx.arc(x + i * CELL + CELL / 2, y + CELL / 2, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#2a7a35";
      for (let i = 0; i < e.width; i++) {
        ctx.beginPath();
        ctx.arc(x + i * CELL + CELL / 2, y + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawFrog(ctx: CanvasRenderingContext2D, x: number, y: number, jumping: boolean) {
  ctx.fillStyle = "#4ee358";
  ctx.beginPath();
  ctx.ellipse(x + CELL / 2, y + CELL / 2, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + CELL / 2 - 5, y + CELL / 2 - 6, 3, 0, Math.PI * 2);
  ctx.arc(x + CELL / 2 + 5, y + CELL / 2 - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x + CELL / 2 - 5, y + CELL / 2 - 6, 1.5, 0, Math.PI * 2);
  ctx.arc(x + CELL / 2 + 5, y + CELL / 2 - 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
  if (jumping) {
    ctx.strokeStyle = "#4ee358";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + CELL - 6);
    ctx.lineTo(x + 2, y + CELL - 2);
    ctx.moveTo(x + CELL - 6, y + CELL - 6);
    ctx.lineTo(x + CELL - 2, y + CELL - 2);
    ctx.stroke();
  }
}

const GOAL_COLS = [1, 4, 7, 10, 13];

export default function FroggerGame(props: FroggerGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateScale = () => {
      const scale = Math.min(container.clientWidth / CANVAS_W, container.clientHeight / CANVAS_H);
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
      canvas.style.marginLeft = `${(container.clientWidth - CANVAS_W * scale) / 2}px`;
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lanes = buildLanes(1);
    const frog = newFrog();
    const goalsFilled: boolean[] = [false, false, false, false, false];
    let score = 0;
    const lives = 3;
    const level = 1;
    let roundTimer = roundTimeForLevel(1);
    let farthestRow = ROW_START;
    let pendingDir: Direction | null = null;
    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;
    let turtlePhase = 0;
    let running = true;
    let rafId = 0;
    let lastTime = performance.now();

    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          pendingDir = "up";
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          pendingDir = "down";
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          pendingDir = "left";
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          pendingDir = "right";
          e.preventDefault();
          break;
      }
    };
    document.addEventListener("keydown", onKey);

    // Stubs — se completan en pasos 5, 6, 7.
    const checkRoadCollision = (): boolean => false;
    const getSupport = (): Entity | null => null;
    type GoalResult = "none" | "goal" | "die";
    const checkGoal = (): GoalResult => "none";
    const completeRound = () => {
      /* paso 6 */
    };
    const killFrog = () => {
      /* paso 7 */
    };

    const update = (dt: number) => {
      if (propsRef.current.paused) return;

      // Avanzar entidades
      for (const lane of lanes) {
        for (const e of lane.entities) {
          e.col += (lane.speed * lane.dir * dt) / 16;
          if (lane.dir === 1 && e.col >= COLS) e.col = -e.width;
          else if (lane.dir === -1 && e.col + e.width <= 0) e.col = COLS;
        }
      }

      // Ciclo de tortugas
      turtlePhase = (turtlePhase + dt) % (TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS);
      const submerged = turtlePhase >= TURTLE_VISIBLE_MS;
      for (const lane of lanes) {
        for (const e of lane.entities) {
          if (e.type === "turtle") e.submerged = submerged;
        }
      }

      // Input pendiente → iniciar salto
      if (!frog.animating && pendingDir) {
        let tc = frog.col;
        let tr = frog.row;
        if (pendingDir === "up") tr = Math.max(ROW_GOALS, frog.row - 1);
        else if (pendingDir === "down") tr = Math.min(ROW_START, frog.row + 1);
        else if (pendingDir === "left") tc = Math.max(0, frog.col - 1);
        else if (pendingDir === "right") tc = Math.min(COLS - 1, frog.col + 1);

        if (tc !== frog.col || tr !== frog.row) {
          frog.animating = true;
          frog.animT = 0;
          frog.targetCol = tc;
          frog.targetRow = tr;
        }
        pendingDir = null;
      }

      // Avanzar animación
      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= JUMP_MS) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;

          // Puntuación por celda nueva hacia arriba
          if (frog.row < farthestRow) {
            score += 10 * (farthestRow - frog.row);
            farthestRow = frog.row;
          }

          // Resolución de celda destino (stubs por ahora; pasos 5-7)
          const goal = checkGoal();
          if (goal === "die") killFrog();
          else if (goal === "goal") completeRound();
        }
      } else if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        // Rana en río: moverse con el soporte
        const support = getSupport();
        if (support) {
          const lane = lanes.find((l) => l.row === frog.row);
          if (lane) {
            const drift = (lane.speed * lane.dir * dt) / 16 / CELL;
            frog.col += drift;
            if (frog.col < 0 || frog.col > COLS - 1) killFrog();
          }
        }
        // Si no hay soporte, morir (stub — se implementa en paso 5)
      }

      // Colisión con carretera (stub)
      if (!frog.animating && frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision()) killFrog();
      }

      // Temporizador de ronda
      roundTimer -= dt;
      if (roundTimer <= 0) {
        roundTimer = roundTimeForLevel(level);
        killFrog();
      }

      // Callbacks
      if (score !== prevScore) {
        prevScore = score;
        propsRef.current.onScoreChange(score);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        propsRef.current.onLivesChange(lives);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        propsRef.current.onLevelChange(level);
      }
    };

    const draw = () => {
      // Fondo por zonas
      ctx.fillStyle = "#0a1a05";
      ctx.fillRect(0, ROW_GOALS * CELL, CANVAS_W, CELL);
      ctx.fillStyle = "#062240";
      ctx.fillRect(0, ROW_RIVER_TOP * CELL, CANVAS_W, (ROW_RIVER_BOT - ROW_RIVER_TOP + 1) * CELL);
      ctx.fillStyle = "#0a3a20";
      ctx.fillRect(0, ROW_SAFE_MID * CELL, CANVAS_W, CELL);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, ROW_ROAD_TOP * CELL, CANVAS_W, (ROW_ROAD_BOT - ROW_ROAD_TOP + 1) * CELL);
      ctx.fillStyle = "#0a3a20";
      ctx.fillRect(0, ROW_START * CELL, CANVAS_W, CELL);

      // Bocas destino
      for (let i = 0; i < 5; i++) {
        const cx = GOAL_COLS[i];
        ctx.fillStyle = "#052515";
        ctx.strokeStyle = "#c9a933";
        ctx.lineWidth = 2;
        ctx.fillRect(cx * CELL, ROW_GOALS * CELL + 6, CELL * 2, CELL - 12);
        ctx.strokeRect(cx * CELL, ROW_GOALS * CELL + 6, CELL * 2, CELL - 12);
        if (goalsFilled[i]) {
          ctx.fillStyle = "#2a6a35";
          ctx.beginPath();
          ctx.ellipse(cx * CELL + CELL, ROW_GOALS * CELL + CELL / 2, 14, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Entidades
      for (const lane of lanes) {
        for (const e of lane.entities) {
          const x = e.col * CELL;
          const y = lane.row * CELL;
          drawEntity(ctx, e, x, y);
        }
      }

      // Rana (con interpolación de salto)
      let fx = frog.col * CELL;
      let fy = frog.row * CELL;
      if (frog.animating) {
        const t = frog.animT / JUMP_MS;
        fx = frog.col * CELL + (frog.targetCol - frog.col) * CELL * t;
        fy = frog.row * CELL + (frog.targetRow - frog.row) * CELL * t;
      }
      drawFrog(ctx, fx, fy, frog.animating);

      // HUD interno
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${score}`, 8, 22);
      ctx.textAlign = "center";
      ctx.fillText(`LV ${level}`, CANVAS_W / 2, 22);
      for (let i = 0; i < lives; i++) {
        const cxx = CANVAS_W - 12 - i * 20;
        ctx.beginPath();
        ctx.fillStyle = "#4ee358";
        ctx.arc(cxx, 14, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Barra de tiempo (banda superior de 4 px)
      const timePct = Math.max(0, roundTimer / roundTimeForLevel(level));
      const barW = CANVAS_W * timePct;
      ctx.fillStyle = timePct > 0.5 ? "#4ee358" : timePct > 0.25 ? "#e8c94a" : "#e34e58";
      ctx.fillRect(0, 0, barW, 4);
    };

    // Silencio de lint: exponen dependencias que se cablearán en pasos 5-7.
    void lanes;
    void goalsFilled;
    void score;
    void lives;
    void level;
    void farthestRow;

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div ref={containerRef} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
      </div>
    </div>
  );
}

export type { Direction, Entity, Lane, Frog };
export {
  COLS,
  ROWS,
  CELL,
  CANVAS_W,
  CANVAS_H,
  ROW_GOALS,
  ROW_RIVER_TOP,
  ROW_RIVER_BOT,
  ROW_SAFE_MID,
  ROW_ROAD_TOP,
  ROW_ROAD_BOT,
  ROW_START,
};
