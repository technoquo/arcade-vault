"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const CANVAS_W = 560;
const CANVAS_H = 560;

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
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} id="canvas" width={CANVAS_W} height={CANVAS_H} />
      <Script src="/snake/snake-assets/sprites.js" strategy="afterInteractive" />
      <Script src="/snake/game.js" strategy="afterInteractive" />
    </div>
  );
}
