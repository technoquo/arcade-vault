"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export default function TetrisGame({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let styleEl: HTMLStyleElement | null = null;

    fetch("/tetris/style.css")
      .then((r) => r.text())
      .then((css) => {
        // Strip rules that pollute the Arcade Vault global layout
        const safe = css
          .replace(/\*\s*,\s*\*::before\s*,\s*\*::after\s*\{[\s\S]*?\}/g, "")
          .replace(/body(?:\.[a-z-]+)?\s*\{[\s\S]*?\}/g, "");

        styleEl = document.createElement("style");
        styleEl.textContent = safe;
        document.head.appendChild(styleEl);
      });

    return () => {
      if (styleEl && document.head.contains(styleEl)) document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const GAME_W = 480;
    const GAME_H = 670;

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
        background: "#0f0f17",
      }}
    >
      <div ref={wrapperRef} className="wrapper">
        <div className="top-bar">
          <h1 className="game-title">TETRIS</h1>
          <label className="theme-switch" htmlFor="theme-toggle">
            <span className="theme-switch-label">LIGHT</span>
            <input type="checkbox" id="theme-toggle" />
            <span className="slider"></span>
          </label>
        </div>

        <div className="game-container">
          <canvas id="board" width={300} height={600} />

          <aside className="panel">
            <div className="panel-section">
              <span className="label">SCORE</span>
              <span className="value" id="score">
                0
              </span>
            </div>
            <div className="panel-section">
              <span className="label">LINES</span>
              <span className="value" id="lines">
                0
              </span>
            </div>
            <div className="panel-section">
              <span className="label">LEVEL</span>
              <span className="value" id="level">
                1
              </span>
            </div>
            <div className="panel-section">
              <span className="label">COMBO</span>
              <span className="value" id="combo">
                0
              </span>
            </div>

            <div className="panel-section">
              <span className="label">NEXT</span>
              <canvas id="next-canvas" width={120} height={120} />
            </div>

            <div className="panel-section controls">
              <span className="label">CONTROLS</span>
              <ul>
                <li>
                  <kbd>←</kbd>
                  <kbd>→</kbd> mover
                </li>
                <li>
                  <kbd>↑</kbd> / <kbd>X</kbd> rotar
                </li>
                <li>
                  <kbd>↓</kbd> bajar
                </li>
                <li>
                  <kbd>Space</kbd> caída
                </li>
                <li>
                  <kbd>P</kbd> pausa
                </li>
              </ul>
            </div>

            <div className="panel-section" id="skin-selector">
              <span className="label">SKIN</span>
              <div className="skin-buttons">
                <button className="skin-btn" data-skin="retro">
                  Retro
                </button>
                <button className="skin-btn" data-skin="neon">
                  Neon
                </button>
                <button className="skin-btn" data-skin="pastel">
                  Pastel
                </button>
                <button className="skin-btn" data-skin="pixel">
                  Pixel
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div id="overlay" className="overlay hidden">
          {/* Pantalla de inicio */}
          <div id="start-screen" className="overlay-box">
            <p id="overlay-title">TETRIS</p>
            <p className="start-hint">Presiona ESPACIO para jugar</p>
            <div id="start-records" className="records-section"></div>
            <button id="reset-records-start" className="btn-reset">
              Resetear records
            </button>
          </div>

          {/* Pantalla de pausa */}
          <div id="pause-screen" className="overlay-box hidden">
            <p className="pause-title">PAUSA</p>
            <div className="pause-menu">
              <button id="resume-btn" className="menu-btn">
                ▶ Reanudar
              </button>
              <button id="restart-pause-btn" className="menu-btn">
                ↺ Reiniciar
              </button>
              <button id="controls-toggle-btn" className="menu-btn menu-btn--secondary">
                ☰ Ver controles
              </button>
              <div id="controls-list" className="controls-list hidden">
                <ul>
                  <li>
                    <kbd>←</kbd>
                    <kbd>→</kbd> mover
                  </li>
                  <li>
                    <kbd>↑</kbd> / <kbd>X</kbd> rotar
                  </li>
                  <li>
                    <kbd>↓</kbd> bajar
                  </li>
                  <li>
                    <kbd>Space</kbd> caída rápida
                  </li>
                  <li>
                    <kbd>P</kbd> / <kbd>Esc</kbd> pausa
                  </li>
                </ul>
              </div>
              <div className="start-level-row">
                <label className="start-level-label" htmlFor="start-level-select">
                  NIVEL INICIAL
                </label>
                <select id="start-level-select" className="start-level-select">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pantalla de game over */}
          <div id="gameover-screen" className="overlay-box hidden">
            <p className="gameover-title">GAME OVER</p>
            <p id="gameover-score"></p>
            <div id="record-save-section" className="hidden">
              <p className="new-record-label">NUEVO RECORD</p>
              <input
                type="text"
                id="player-name"
                maxLength={12}
                placeholder="Tu nombre"
                autoComplete="off"
                spellCheck={false}
              />
              <button id="save-record-btn" className="btn-primary">
                Guardar
              </button>
            </div>
            <div id="gameover-records" className="records-section"></div>
            <div className="overlay-buttons">
              <button id="restart-btn">Reiniciar</button>
              <button id="reset-records-gameover" className="btn-reset">
                Resetear records
              </button>
            </div>
          </div>
        </div>
      </div>

      <Script src="/tetris/game.js" strategy="afterInteractive" />
    </div>
  );
}
