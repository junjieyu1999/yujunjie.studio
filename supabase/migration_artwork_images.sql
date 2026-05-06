-- =============================================
-- Migration: artwork_images table
-- Run this in Supabase SQL Editor
-- Adds support for multiple images per artwork
-- =============================================

create table if not exists public.artwork_images (
  id          uuid        primary key default uuid_generate_v4(),
  artwork_id  text        not null references public.artworks(id) on delete cascade,
  url         text        not null,
  filename    text        not null,
  caption     text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists artwork_images_artwork_idx on public.artwork_images (artwork_id, sort_order);

alter table public.artwork_images enable row level security;

create policy "Public can read artwork images"
  on public.artwork_images for select
  using (true);

create policy "Authenticated users can manage artwork images"
  on public.artwork_images for all
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────
-- HOW THIS WORKS:
--
-- Each artwork can have up to N images in artwork_images.
-- The sort_order column controls which thumbnail appears first.
-- sort_order = 0 is treated as the "hero" / main image.
--
-- The artworks.image_url column still exists as the primary/cover
-- image shown on the gallery grid cards. When you upload the first
-- image for an artwork, image_url is updated automatically.
-- ─────────────────────────────────────────────────────────────────
