-- Tabla games
create table games (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

-- Seed Asteroids
insert into games (slug, name, description) values
  ('rocas', 'Rocas', 'Destruye asteroides y sobrevive el mayor tiempo posible.');

-- Tabla scores
create table scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  player_name text not null,
  score       integer not null check (score >= 0),
  created_at  timestamptz default now()
);

-- RLS games: lectura pública
alter table games enable row level security;
create policy "games_read_public" on games for select using (true);

-- RLS scores: lectura pública, inserción pública
alter table scores enable row level security;
create policy "scores_read_public"   on scores for select using (true);
create policy "scores_insert_public" on scores for insert with check (true);
