import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Game {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

const COVER_CLASS: Record<string, string> = {
  arkanoid: "cover-bricks",
  rocas: "cover-rocas",
  snake: "cover-snake",
  tetris: "cover-tetro",
};

export default async function Juegos() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, slug, name, description")
    .order("name");

  const list: Game[] = games ?? [];

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          ELIGE TU JUEGO Y COMPITE <span className="blink">_</span>
        </div>
      </section>

      <div className="av-grid">
        {list.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 80,
              color: "var(--ink-faint)",
            }}
          >
            <div
              className="pixel"
              style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}
            >
              NO HAY JUEGOS DISPONIBLES
            </div>
            <div>Vuelve pronto.</div>
          </div>
        )}

        {list.map((game) => (
          <div key={game.id} className="card">
            <div className="cover">
              <div className={`cover-bg ${COVER_CLASS[game.slug] ?? "cover-invaders"}`} />
              <div className="label">SHOOTER</div>
            </div>
            <div className="meta">
              <div className="title">{game.name.toUpperCase()}</div>
              <div className="desc">{game.description}</div>
              <div className="row">
                <div style={{ flex: 1 }} />
                <Link href={`/juego/${game.slug}/jugar`}>
                  <button className="btn yellow">JUGAR</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
