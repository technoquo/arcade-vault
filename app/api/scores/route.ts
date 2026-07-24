import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ScorePayload {
  game_slug: string;
  player_name: string;
  score: number;
  user_id?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game_slug = searchParams.get("game_slug");

  if (!game_slug?.trim()) {
    return NextResponse.json({ error: "game_slug requerido." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("slug", game_slug)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Juego no encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", game.id)
    .order("score", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: "Error al obtener scores." }, { status: 500 });
  }

  const entries = (data ?? []).map((row, index) => ({
    rank: index + 1,
    player_name: row.player_name,
    score: row.score,
    created_at: row.created_at,
  }));

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body: ScorePayload = await request.json();
  const { game_slug, player_name, score, user_id } = body;

  if (!game_slug?.trim() || !player_name?.trim() || score === undefined || score === null) {
    return NextResponse.json(
      { error: "game_slug, player_name y score son requeridos." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("slug", game_slug)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Juego no encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("scores")
    .insert({
      game_id: game.id,
      player_name: player_name.trim(),
      score,
      user_id: user_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al guardar el score." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
