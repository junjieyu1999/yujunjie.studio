-- =============================================
-- Yu JunJie Art — Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── ARTWORKS ────────────────────────────────
create table public.artworks (
  id            text primary key,            -- slug-style, e.g. "warm-light"
  title         text not null,
  year          text not null,
  medium        text not null,
  dimensions    text not null,
  status        text not null check (status in ('available', 'sold', 'in-progress')),
  theme         text not null check (theme in ('portrait', 'landscape')),
  description   text,
  inspiration   text,
  process       text,
  gradient_bg   text,                        -- CSS gradient string for placeholder
  image_url     text,                        -- Supabase Storage public URL (optional)
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

-- RLS: public read, authenticated write
alter table public.artworks enable row level security;

create policy "Anyone can read artworks"
  on public.artworks for select
  using (true);

create policy "Authenticated users can manage artworks"
  on public.artworks for all
  using (auth.role() = 'authenticated');

-- ── COMMISSIONS ─────────────────────────────
create table public.commissions (
  id            uuid primary key default uuid_generate_v4(),
  painting_type text,
  size          text,
  budget        text,
  theme         text,
  inspiration   text,
  client_name   text,
  client_email  text,
  ai_brief      text,                        -- AI-generated brief
  status        text default 'new' check (status in ('new', 'reviewed', 'accepted', 'declined')),
  created_at    timestamptz default now()
);

alter table public.commissions enable row level security;

create policy "Anyone can insert a commission"
  on public.commissions for insert
  with check (true);

create policy "Authenticated users can read commissions"
  on public.commissions for select
  using (auth.role() = 'authenticated');

-- ── CONTACTS ────────────────────────────────
create table public.contacts (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null,
  reason        text,
  message       text,
  status        text default 'unread' check (status in ('unread', 'read', 'replied')),
  created_at    timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Anyone can submit a contact"
  on public.contacts for insert
  with check (true);

create policy "Authenticated users can read contacts"
  on public.contacts for select
  using (auth.role() = 'authenticated');

-- ── SEED DATA ───────────────────────────────
insert into public.artworks (id, title, year, medium, dimensions, status, theme, description, inspiration, process, gradient_bg, sort_order)
values
  ('warm-light',      'Study in Warm Light',      '2024', 'Oil on canvas', '60×80cm',  'available',   'portrait',  'This piece began with a single observation: the way afternoon light catches the side of a face and dissolves into shadow. Not as a technical exercise, but as something that felt emotionally true.', 'Inspired by Singapore''s late afternoon light filtering through old shutters. There is something in that specific golden hour that feels both urgent and still — like a moment about to be lost.', 'Started with a burnt sienna ground. Built up shadows in transparent glazes before adding lighter passages in impasto. The highlight on the cheekbone was the very last mark — placed once and left untouched.', 'linear-gradient(145deg,#C4A87A 0%,#8B6842 60%,#5C3D1E 100%)', 1),
  ('horizon-dusk',    'Horizon at Dusk',           '2023', 'Oil on canvas', '90×60cm',  'sold',        'landscape', 'A seascape painted entirely from memory after a swim training session ended late. The water had gone almost completely still and the horizon line between sea and sky was barely discernible.', 'Eight years of early mornings at the pool and the sea gave me an intimacy with water in low light. This was the closest I have come to capturing it.', 'Painted wet-on-wet in a single session. Sky and water are the same grey-blue mixture, differentiated only by direction of brushstroke.', 'linear-gradient(160deg,#7A9EA8 0%,#3D6E7A 50%,#1E3F47 100%)', 2),
  ('portrait-7',      'Portrait No. 7',            '2024', 'Oil on linen',  '50×70cm',  'in-progress', 'portrait',  'Part of an ongoing portrait series. Each subject is someone whose face carries an interior life I find genuinely interesting. I ask them to hold no particular expression — just to be present.', 'Influenced by the quietness in Vilhelm Hammershøi''s figures. The subject does nothing, and yet the painting is full.', 'Currently in the blocking-in phase. The underpainting is in raw umber. Working towards a restricted palette — perhaps four colours total.', 'linear-gradient(135deg,#D4B896 0%,#A07850 55%,#6B4E2A 100%)', 3),
  ('morning-forest',  'Morning Forest',            '2023', 'Oil on canvas', '70×50cm',  'available',   'landscape', 'Painted during a residency near Bukit Timah. The forest light at 6am has a very particular quality — green filtered through green, everything slightly damp.', 'I went back to the same spot four mornings in a row before I understood what I was actually looking at. On the fifth morning I didn''t go — I painted from those four memories combined.', 'Thin transparent layers for the deep shadow areas, built up slowly over two weeks. The foreground foliage was added last using a palette knife.', 'linear-gradient(150deg,#9BB87A 0%,#5A7A42 55%,#2E4A1E 100%)', 4),
  ('golden-hour',     'Golden Hour Study',         '2024', 'Oil on board',  '40×40cm',  'available',   'landscape', 'A quick study — made in under two hours — of a courtyard bathed in late-day sun. Not everything has to be slow. Some paintings need to be made fast before the light changes.', 'The urgency of plein air painting: you cannot think too much. Speed strips away self-consciousness and sometimes that is when the most honest marks happen.', 'All done in one sitting with broad hog-hair brushes. No corrections. What you see is the first and only attempt.', 'linear-gradient(130deg,#E8C4A0 0%,#C47850 50%,#7A3E18 100%)', 5),
  ('interior-evening','Interior — Late Evening',   '2022', 'Oil on canvas', '55×75cm',  'sold',        'portrait',  'A figure in a room, lit by a single lamp to the right of frame. The rest of the painting is in deep shadow. This was about what is not shown as much as what is.', 'Painted during a period of thinking carefully about interiority — both of rooms and of people. The purple undertone in the shadows came from looking at Rembrandt for a long time.', 'The shadow areas were glazed many times over several weeks. The figure was the last element resolved — painting towards the person rather than from them.', 'linear-gradient(155deg,#B8A8C8 0%,#7A6888 55%,#3E2E48 100%)', 6);
