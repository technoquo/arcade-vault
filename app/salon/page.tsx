"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Game {
  id: string;
  slug: string;
  name: string;
}

interface ScoreEntry {
  rank: number;
  player_name: string;
  score: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function SalonPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [tab, setTab] = useState<string | null>(null);
  const [rows, setRows] = useState<ScoreEntry[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("games")
      .select("id, slug, name")
      .order("name")
      .then(({ data }) => {
        const list: Game[] = data ?? [];
        setGames(list);
        if (list.length > 0) setTab(list[0].slug);
        setLoadingGames(false);
      });
  }, []);

  useEffect(() => {
    if (!tab) return;
    setLoadingScores(true);
    fetch(`/api/scores?game_slug=${tab}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ScoreEntry[]) => setRows(data))
      .finally(() => setLoadingScores(false));
  }, [tab]);

  const currentGame = games.find((g) => g.slug === tab);
  const loading = loadingGames || loadingScores;

  const podium = rows.slice(0, 3);
  const hasPodium = podium.length >= 3;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      {loadingGames ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            fontFamily: "var(--pixel)",
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          CARGANDO…
        </div>
      ) : games.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            fontFamily: "var(--pixel)",
            fontSize: 10,
            color: "var(--magenta)",
          }}
        >
          NO HAY JUEGOS DISPONIBLES
        </div>
      ) : (
        <>
          <div className="hall-tabs">
            {games.map((g) => (
              <button
                key={g.slug}
                className={"chip" + (tab === g.slug ? " active" : "")}
                onClick={() => setTab(g.slug)}
              >
                {g.name.toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                fontFamily: "var(--pixel)",
                fontSize: 10,
                color: "var(--ink-faint)",
              }}
            >
              <span className="spinner" />
            </div>
          ) : rows.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                fontFamily: "var(--pixel)",
                fontSize: 10,
                color: "var(--ink-faint)",
                letterSpacing: "0.14em",
              }}
            >
              AÚN NO HAY SCORES PARA {currentGame?.name.toUpperCase()}.<br />
              <span
                style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 10, display: "block" }}
              >
                ¡SÉ EL PRIMERO EN ENTRAR AL SALÓN!
              </span>
            </div>
          ) : (
            <>
              {hasPodium && (
                <div className="podium">
                  {/* Silver — 2nd */}
                  <div className="podium-slot silver">
                    <div className="rank-num">02</div>
                    <div className="name">{podium[1].player_name}</div>
                    <div className="score">{podium[1].score.toLocaleString("es-ES")}</div>
                    <div className="date">{formatDate(podium[1].created_at)}</div>
                  </div>

                  {/* Gold — 1st */}
                  <div className="podium-slot gold">
                    <div
                      className="pixel"
                      style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}
                    >
                      CAMPEÓN
                    </div>
                    <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                      01
                    </div>
                    <div className="name">{podium[0].player_name}</div>
                    <div className="score" style={{ fontSize: 20 }}>
                      {podium[0].score.toLocaleString("es-ES")}
                    </div>
                    <div className="date">{formatDate(podium[0].created_at)}</div>
                  </div>

                  {/* Bronze — 3rd */}
                  <div className="podium-slot bronze">
                    <div className="rank-num">03</div>
                    <div className="name">{podium[2].player_name}</div>
                    <div className="score">{podium[2].score.toLocaleString("es-ES")}</div>
                    <div className="date">{formatDate(podium[2].created_at)}</div>
                  </div>
                </div>
              )}

              <div className="hall-table">
                <div className="th">
                  <div>RANGO</div>
                  <div>JUGADOR</div>
                  <div>PUNTUACIÓN</div>
                  <div>FECHA</div>
                </div>

                {rows.map((r, i) => (
                  <div
                    key={r.rank}
                    className={
                      "tr" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
                    }
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                    <div className="pl">{r.player_name}</div>
                    <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                    <div className="dt">{formatDate(r.created_at)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/juegos">
          <button className="btn lg">IR A JUGAR</button>
        </Link>
      </div>
    </div>
  );
}
