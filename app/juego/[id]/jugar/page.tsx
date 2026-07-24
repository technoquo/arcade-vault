"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { useUser } from "@/context/UserContext";
import AsteroidsGame from "@/components/AsteroidsGame";
import TetrisGame from "@/components/TetrisGame";
import ArkanoidGame from "@/components/ArkanoidGame";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  score: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function JugarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, saveScore } = useUser();

  const game = GAMES.find((g) => g.id === id);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const res = await fetch(`/api/scores?game_slug=${id}`);
      if (res.ok) setLeaderboard(await res.json());
    } finally {
      setLbLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (email) setName(email.split("@")[0].toUpperCase().slice(0, 10));
    });
  }, []);

  useEffect(() => {
    if (!game) router.replace("/");
  }, [game, router]);

  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220
    );
    return () => clearInterval(t);
  }, [over, paused]);

  useEffect(() => {
    if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
  }, [score]);

  const endGame = () => setOver(true);
  const restart = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_slug: id,
          player_name: name.trim(),
          score,
          ...(userId ? { user_id: userId } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Error al guardar el score.");
        return;
      }
      setSaved(true);
      await fetchLeaderboard();
    } catch {
      setSaveError("Error de red. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!game) return null;

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>FIN</button>
          <button className="btn ghost" onClick={() => router.push(`/juego/${id}`)}>SALIR</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
        <div className="crt">
          <div className="crt-screen">
            {id === "rocas" ? (
              <AsteroidsGame />
            ) : id === "tetris" ? (
              <TetrisGame onGameOver={(s) => { setScore(s); setOver(true); }} />
            ) : id === "arkanoid" ? (
              <ArkanoidGame onGameOver={(s) => { setScore(s); setOver(true); }} />
            ) : (
              <div className="game-arena">
                <div className="grid-floor" />
                <div className="enemy e1" />
                <div className="enemy e2" />
                <div className="enemy e3" />
                <div className="player-ship" />
              </div>
            )}

            {paused && (
              <div
                className="crt-content"
                style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
              >
                <div>
                  <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                    EN PAUSA
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      marginTop: 10,
                      letterSpacing: "0.16em",
                    }}
                  >
                    PULSA REANUDAR PARA CONTINUAR
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="crt-bottom">
            <span className="led">SEÑAL OK</span>
            <span>{game.title} · CRT-83 · 60 HZ</span>
            <span>CARGA · 1MB</span>
          </div>
        </div>

        {/* Leaderboard panel */}
        <div className="leaderboard" style={{ minWidth: 0 }}>
          <h3>TOP 12 — {game.title}</h3>

          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 70px 68px",
              gap: 6,
              padding: "7px 14px",
              borderBottom: "1px solid var(--line)",
              fontFamily: "var(--pixel)",
              fontSize: 8,
              letterSpacing: "0.12em",
              color: "var(--ink-faint)",
            }}
          >
            <span>RK</span>
            <span>JUGADOR</span>
            <span style={{ textAlign: "right" }}>PTS</span>
            <span style={{ textAlign: "right" }}>FECHA</span>
          </div>

          {lbLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 70px 68px",
                  gap: 6,
                  padding: "9px 14px",
                  borderBottom: "1px solid var(--line-2)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: 10,
                    background: "var(--line)",
                    borderRadius: 2,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    height: 10,
                    background: "var(--line)",
                    borderRadius: 2,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    height: 10,
                    background: "var(--line)",
                    borderRadius: 2,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    height: 10,
                    background: "var(--line)",
                    borderRadius: 2,
                  }}
                />
              </div>
            ))
          ) : leaderboard.length === 0 ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 70px 68px",
                  gap: 6,
                  padding: "9px 14px",
                  borderBottom: "1px solid var(--line-2)",
                  fontFamily: "var(--pixel)",
                  fontSize: 9,
                  color: "var(--ink-faint)",
                }}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>---</span>
                <span style={{ textAlign: "right" }}>---</span>
                <span style={{ textAlign: "right" }}>--/--/----</span>
              </div>
            ))
          ) : (
            <>
              {leaderboard.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const color = isTop3 ? "var(--yellow)" : "var(--cyan)";
                const shadow = isTop3
                  ? "0 0 6px rgba(245,255,0,0.5)"
                  : "0 0 6px rgba(0,245,255,0.4)";
                return (
                  <div
                    key={entry.rank}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr 70px 68px",
                      gap: 6,
                      padding: "9px 14px",
                      borderBottom: "1px solid var(--line-2)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--pixel)",
                        fontSize: 9,
                        color,
                        textShadow: shadow,
                      }}
                    >
                      {String(entry.rank).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.player_name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--pixel)",
                        fontSize: 9,
                        color,
                        textShadow: shadow,
                        textAlign: "right",
                      }}
                    >
                      {entry.score.toLocaleString("es-ES")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--ink-faint)",
                        textAlign: "right",
                      }}
                    >
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                );
              })}
              {/* Fill remaining slots up to 12 */}
              {Array.from({ length: Math.max(0, 12 - leaderboard.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 70px 68px",
                    gap: 6,
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--line-2)",
                    fontFamily: "var(--pixel)",
                    fontSize: 9,
                    color: "var(--ink-faint)",
                  }}
                >
                  <span>{String(leaderboard.length + i + 1).padStart(2, "0")}</span>
                  <span>---</span>
                  <span style={{ textAlign: "right" }}>---</span>
                  <span style={{ textAlign: "right" }}>--/--/----</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>

            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value.toUpperCase().slice(0, 10))
                    }
                    placeholder="TUS INICIALES"
                    disabled={saving}
                  />
                  <button
                    className="btn yellow"
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? <span className="spinner" /> : "GUARDAR"}
                  </button>
                </div>
                {saveError && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--magenta)",
                      letterSpacing: "0.08em",
                      marginTop: 6,
                    }}
                  >
                    ▲ {saveError}
                  </div>
                )}
              </>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}

            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
