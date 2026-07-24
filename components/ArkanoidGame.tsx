"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function ArkanoidGame({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [spritesheetReady, setSpritesheetReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const GAME_W = 800;
    const GAME_H = 600;

    const updateScale = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const scale = Math.min(containerW / GAME_W, containerH / GAME_H);
      wrapper.style.position = "absolute";
      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.transformOrigin = "top left";
      wrapper.style.left = `${(containerW - GAME_W * scale) / 2}px`;
      wrapper.style.top = `${(containerH - GAME_H * scale) / 2}px`;
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
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <div ref={wrapperRef} style={{ width: 800, height: 600 }}>
        <canvas id="gameCanvas" width={800} height={600} />
      </div>

      <Script
        src="/arkanoid/assets/spritesheet.js"
        strategy="afterInteractive"
        onReady={() => setSpritesheetReady(true)}
      />
      {spritesheetReady && <Script src="/arkanoid/game.js" strategy="afterInteractive" />}
    </div>
  );
}
