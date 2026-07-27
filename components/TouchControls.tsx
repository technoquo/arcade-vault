"use client";

function fireKey(key: string, code: string, type: "down" | "up") {
  document.dispatchEvent(new KeyboardEvent(`key${type}`, { key, code, bubbles: true }));
}

function tapKey(key: string, code: string) {
  return (e: React.PointerEvent) => {
    e.preventDefault();
    fireKey(key, code, "down");
  };
}

function holdHandlers(key: string, code: string) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      fireKey(key, code, "down");
    },
    onPointerUp: () => fireKey(key, code, "up"),
    onPointerLeave: () => fireKey(key, code, "up"),
    onPointerCancel: () => fireKey(key, code, "up"),
  };
}

export default function TouchControls({ gameId }: { gameId: string }) {
  if (gameId === "tetris") {
    return (
      <div className="touch-controls tc-tetris">
        <div className="tc-dpad">
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowUp", "ArrowUp")}>
            ↑
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowLeft", "ArrowLeft")}>
            ←
          </button>
          <button className="tc-btn" onPointerDown={tapKey("ArrowDown", "ArrowDown")}>
            ↓
          </button>
          <button className="tc-btn" onPointerDown={tapKey("ArrowRight", "ArrowRight")}>
            →
          </button>
        </div>
      </div>
    );
  }

  if (gameId === "snake") {
    return (
      <div className="touch-controls tc-snake">
        <div className="tc-dpad tc-dpad--3row">
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowUp", "ArrowUp")}>
            ↑
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowLeft", "ArrowLeft")}>
            ←
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowRight", "ArrowRight")}>
            →
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowDown", "ArrowDown")}>
            ↓
          </button>
          <span />
        </div>
      </div>
    );
  }

  if (gameId === "rocas") {
    return (
      <div className="touch-controls tc-asteroids">
        <button className="tc-btn" {...holdHandlers("ArrowLeft", "ArrowLeft")}>
          ←
        </button>
        <button className="tc-btn tc-btn--wide" {...holdHandlers("ArrowUp", "ArrowUp")}>
          ↑ EMPUJE
        </button>
        <button className="tc-btn" {...holdHandlers("ArrowRight", "ArrowRight")}>
          →
        </button>
        <button className="tc-btn tc-btn--fire" onPointerDown={tapKey(" ", "Space")}>
          DISPARAR
        </button>
      </div>
    );
  }

  if (gameId === "arkanoid") {
    return (
      <div className="touch-controls tc-arkanoid">
        <button className="tc-btn" {...holdHandlers("ArrowLeft", "ArrowLeft")}>
          ←
        </button>
        <button className="tc-btn tc-btn--wide" onPointerDown={tapKey(" ", "Space")}>
          LANZAR
        </button>
        <button className="tc-btn" {...holdHandlers("ArrowRight", "ArrowRight")}>
          →
        </button>
      </div>
    );
  }

  if (gameId === "frogger") {
    return (
      <div className="touch-controls tc-snake">
        <div className="tc-dpad tc-dpad--3row">
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowUp", "ArrowUp")}>
            ↑
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowLeft", "ArrowLeft")}>
            ←
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowRight", "ArrowRight")}>
            →
          </button>
          <span />
          <button className="tc-btn" onPointerDown={tapKey("ArrowDown", "ArrowDown")}>
            ↓
          </button>
          <span />
        </div>
      </div>
    );
  }

  return null;
}
