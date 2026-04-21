-- coworkersfun v2 schema
-- Run this once in Supabase SQL editor after creating the project.

create table if not exists cards (
  id            text primary key,
  rarity        text not null check (rarity in ('R','SR','SSR')),
  type          text not null check (type in ('roast','angel')),
  role          text not null check (role in ('leader','coworker')),
  name          text not null,
  quote         text not null,
  "desc"        text not null,
  emoji         text,
  destined_tags text[],
  destined_roll numeric,
  likes_count   integer not null default 0,
  dreads_count  integer not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists idx_cards_rarity on cards(rarity);
create index if not exists idx_cards_likes  on cards(likes_count desc);
create index if not exists idx_cards_dreads on cards(dreads_count desc);

-- Atomic vote increment: call via PostgREST RPC from API
create or replace function increment_vote(card_id text, kind text)
returns table(likes_count integer, dreads_count integer)
language plpgsql
as $$
begin
  if kind = 'like' then
    update cards set likes_count = cards.likes_count + 1 where id = card_id;
  elsif kind = 'dread' then
    update cards set dreads_count = cards.dreads_count + 1 where id = card_id;
  else
    raise exception 'invalid kind: %', kind;
  end if;
  return query select c.likes_count, c.dreads_count from cards c where c.id = card_id;
end;
$$;
