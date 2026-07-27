"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function ArkanoidGame({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [spritesheetReady, setSpritesheetReady] = useState(false);
  const [activeSkin, setActiveSkin] = useState<string>("clasico");

  useEffect(() => {
    const saved = localStorage.getItem("arkanoid-skin");
    if (saved) setActiveSkin(saved);
  }, []);

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
      (window as unknown as Record<string, unknown>).onGameOver = onGameOver;
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).onGameOver;
    };
  }, [onGameOver]);

  function handleSkinChange(skin: string) {
    setActiveSkin(skin);
    const applySkin = (window as unknown as { arkanoidApplySkin?: (skin: string) => void })
      .arkanoidApplySkin;
    if (typeof applySkin === "function") {
      applySkin(skin);
    } else {
      // Si el juego no cargó todavía, guardamos en localStorage de todas formas
      localStorage.setItem("arkanoid-skin", skin);
    }
  }

  const skins = [
    { key: "clasico", label: "Clásico" },
    { key: "retro", label: "Retro" },
    { key: "neon", label: "Neon" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: "8px",
      }}
    >
      {/* Selector de skin */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            fontFamily: "var(--mono)",
            userSelect: "none",
          }}
        >
          SKIN
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {skins.map(({ key, label }) => (
            <button
              key={key}
              className="arkanoid-skin-btn"
              data-skin={key}
              onClick={() => handleSkinChange(key)}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                letterSpacing: "0.08em",
                fontFamily: "var(--mono)",
                background: activeSkin === key ? "var(--ink-faint)" : "transparent",
                color: activeSkin === key ? "var(--ink)" : "var(--ink-dim)",
                border:
                  activeSkin === key ? "1px solid var(--ink-dim)" : "1px solid var(--ink-faint)",
                borderRadius: "3px",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas del juego */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          flex: 1,
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
    </div>
  );
}
