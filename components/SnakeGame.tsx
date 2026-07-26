"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const CANVAS_W = 560;
const CANVAS_H = 560;

const SKIN_BTNS = [
  { key: "clasico", label: "Clásico" },
  { key: "retro", label: "Retro" },
  { key: "neon", label: "Neon" },
] as const;

export default function SnakeGame({
  onGameOver,
  resetKey,
}: {
  onGameOver?: (score: number) => void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (onGameOver) {
      (window as unknown as Record<string, unknown>).onGameOver = onGameOver;
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).onGameOver;
    };
  }, [onGameOver]);

  useEffect(() => {
    if (!resetKey) return;
    (window as unknown as { snakeReset?: () => void }).snakeReset?.();
  }, [resetKey]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: "10px",
      }}
    >
      {/* Selector de skin */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(0,245,255,0.18)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--pixel, monospace)",
            fontSize: "9px",
            letterSpacing: "0.16em",
            color: "var(--ink-faint, #4a4f70)",
          }}
        >
          SKIN
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {SKIN_BTNS.map(({ key, label }) => (
            <button
              key={key}
              className="snake-skin-btn"
              data-skin={key}
              style={{
                padding: "4px 10px",
                fontFamily: "var(--pixel, monospace)",
                fontSize: "8px",
                letterSpacing: "0.12em",
                background: "transparent",
                border: "1px solid rgba(0,245,255,0.3)",
                color: "var(--ink-dim, #8a8fb5)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas del juego */}
      <div ref={containerRef} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <canvas ref={canvasRef} id="canvas" width={CANVAS_W} height={CANVAS_H} />
        <Script src="/snake/snake-assets/sprites.js" strategy="afterInteractive" />
        <Script src="/snake/game.js" strategy="afterInteractive" />
      </div>
    </div>
  );
}
