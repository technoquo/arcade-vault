"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const SKINS = [
  { key: "clasico", label: "Clásico" },
  { key: "retro", label: "Retro" },
  { key: "neon", label: "Neon" },
] as const;

type SkinKey = (typeof SKINS)[number]["key"];

export default function AsteroidsGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateScale = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const scale = Math.min(containerW / 800, containerH / 600);
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
      canvas.style.marginLeft = `${(containerW - 800 * scale) / 2}px`;
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, []);

  function handleSkinChange(skin: SkinKey) {
    localStorage.setItem("rocas-skin", skin);
    // Notificar al game.js para que actualice los colores sin recargar
    document.dispatchEvent(new CustomEvent("skinchange", { detail: skin }));

    // Marcar el botón activo visualmente
    document.querySelectorAll<HTMLButtonElement>(".rocas-skin-btn").forEach((btn) => {
      btn.style.opacity = btn.dataset.skin === skin ? "1" : "0.45";
      btn.style.borderColor = btn.dataset.skin === skin ? "#fff" : "rgba(255,255,255,0.25)";
    });
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} id="canvas" width={800} height={600} />

      {/* Selector de skin — superpuesto en la esquina inferior derecha del canvas */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "monospace",
            userSelect: "none",
          }}
        >
          SKIN
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {SKINS.map(({ key, label }) => (
            <button
              key={key}
              className="rocas-skin-btn"
              data-skin={key}
              onClick={() => handleSkinChange(key)}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 600,
                letterSpacing: "0.05em",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "3px",
                cursor: "pointer",
                opacity: 0.45,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Script
        src="/asteroids/game.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Marcar el botón que corresponde a la skin actual guardada
          const saved = (localStorage.getItem("rocas-skin") || "clasico") as SkinKey;
          document.querySelectorAll<HTMLButtonElement>(".rocas-skin-btn").forEach((btn) => {
            btn.style.opacity = btn.dataset.skin === saved ? "1" : "0.45";
            btn.style.borderColor = btn.dataset.skin === saved ? "#fff" : "rgba(255,255,255,0.25)";
          });
        }}
      />
    </div>
  );
}
