-- =============================================
-- Yu JunJie Art — Storage Setup
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================

-- Create the artworks storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

-- ── Storage Policies ──────────────────────────────────────────────

-- Anyone can view/download images (needed for <Image> tags to work)
create policy "Public can read artwork images"
  on storage.objects for select
  using (bucket_id = 'artworks');

-- Only authenticated users (you, logged into Supabase) can upload
create policy "Authenticated users can upload artwork images"
  on storage.objects for insert
  with check (
    bucket_id = 'artworks'
    and auth.role() = 'authenticated'
  );

-- Only authenticated users can update images
create policy "Authenticated users can update artwork images"
  on storage.objects for update
  using (
    bucket_id = 'artworks'
    and auth.role() = 'authenticated'
  );

-- Only authenticated users can delete images
create policy "Authenticated users can delete artwork images"
  on storage.objects for delete
  using (
    bucket_id = 'artworks'
    and auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────────────────────────────
-- HOW TO UPLOAD AN IMAGE MANUALLY (from Supabase dashboard):
--
--   1. Go to Storage → artworks bucket
--   2. Click "Upload file"
--   3. Upload your .jpg or .webp (recommended: 3:4 ratio, max 5MB)
--   4. Click the file → copy the public URL
--   5. Paste the URL into the artworks table → image_url column
--
-- HOW TO UPLOAD VIA THE API (from your app):
--
--   const formData = new FormData();
--   formData.append('file', file);           // File object from <input>
--   formData.append('artworkId', 'warm-light'); // your artwork's id
--
--   const res = await fetch('/api/artworks/upload', {
--     method: 'POST',
--     body: formData,
--   });
--   const { publicUrl } = await res.json();
--   // image_url is now automatically updated on the artwork row
--
-- HOW TO UPDATE OTHER ARTWORK FIELDS via the API:
--
--   await fetch('/api/artworks/upload', {
--     method: 'PATCH',
--     headers: { 'Content-Type': 'application/json' },
--     body: JSON.stringify({
--       id: 'warm-light',
--       fields: { status: 'sold', title: 'Study in Warm Light II' }
--     }),
--   });
--
-- HOW TO DELETE AN IMAGE via the API:
--
--   await fetch('/api/artworks/upload', {
--     method: 'DELETE',
--     headers: { 'Content-Type': 'application/json' },
--     body: JSON.stringify({
--       artworkId: 'warm-light',
--       filename: 'warm-light__1234567890.jpg',
--     }),
--   });
-- ─────────────────────────────────────────────────────────────────
