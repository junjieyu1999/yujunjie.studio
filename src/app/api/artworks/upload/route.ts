// src/app/api/artworks/upload/route.ts
//
// WHAT THIS DOES:
//   POST   /api/artworks/upload   — upload an image file to Supabase Storage
//                                   and optionally link it to an artwork row
//   PATCH  /api/artworks/upload   — update any field on an artwork (text or image_url)
//   DELETE /api/artworks/upload   — remove an image from Storage + clear image_url
//
// SUPABASE STORAGE SETUP (one-time, in your Supabase dashboard):
//   1. Go to Storage → New bucket
//   2. Name it "artworks", set it to PUBLIC
//   3. That's it — this route handles the rest

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Use the SERVICE ROLE key here (server-side only, never expose to browser) ──
// Add SUPABASE_SERVICE_ROLE_KEY to your .env.local
// Get it from: Supabase dashboard → Settings → API → service_role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────────────
// POST — Upload image to Storage + write to artwork_images
// ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get('file')      as File   | null;
    const artworkId = formData.get('artworkId') as string | null;
    const caption   = formData.get('caption')   as string | null;
    const sortOrderRaw = formData.get('sortOrder');
    // Prefer explicit sortOrder from slot (0/1/2), fall back to count
    const explicitSort = sortOrderRaw !== null ? Number(sortOrderRaw) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext      = file.name.split('.').pop() ?? 'jpg';
    const filename = artworkId
      ? `${artworkId}__slot${explicitSort ?? 0}__${Date.now()}.${ext}`
      : `upload__${Date.now()}.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('artworks')
      .upload(filename, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('artworks')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    if (artworkId) {
      // Determine sort_order — use explicit slot value or fall back to count
      let sortOrder = explicitSort;
      if (sortOrder === null) {
        const { count } = await supabaseAdmin
          .from('artwork_images')
          .select('*', { count: 'exact', head: true })
          .eq('artwork_id', artworkId);
        sortOrder = count ?? 0;
      }

      // Upsert: replace existing image at this sort_order slot if one exists
      const { data: existing } = await supabaseAdmin
        .from('artwork_images')
        .select('id, filename')
        .eq('artwork_id', artworkId)
        .eq('sort_order', sortOrder)
        .maybeSingle();

      if (existing) {
        // Remove old file from storage first
        await supabaseAdmin.storage.from('artworks').remove([existing.filename]);
        // Update the existing row
        await supabaseAdmin
          .from('artwork_images')
          .update({ url: publicUrl, filename, caption: caption ?? null })
          .eq('id', existing.id);
      } else {
        // Insert new row
        await supabaseAdmin.from('artwork_images').insert({
          artwork_id : artworkId,
          url        : publicUrl,
          filename,
          caption    : caption ?? null,
          sort_order : sortOrder,
        });
      }

      // slot 0 always drives artworks.image_url (gallery cover)
      if (sortOrder === 0) {
        await supabaseAdmin
          .from('artworks')
          .update({ image_url: publicUrl })
          .eq('id', artworkId);
      }
    }

    return NextResponse.json({ publicUrl, filename });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// PATCH — Update any artwork field(s)
//
// Body: { id: string, fields: Partial<Artwork> }
// Example: { id: "warm-light", fields: { status: "sold", title: "New Title" } }
// ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { id, fields } = await req.json();

    if (!id || !fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'id and fields are required' }, { status: 400 });
    }

    // Strip any fields that should not be updated via this route
    const PROTECTED = ['id', 'created_at'];
    PROTECTED.forEach((k) => delete fields[k]);

    const { data, error } = await supabaseAdmin
      .from('artworks')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ artwork: data });

  } catch (err) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// DELETE — Remove image from Storage + clear image_url
//
// Body: { artworkId: string, filename: string }
// ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { artworkId, filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    // Delete from Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('artworks')
      .remove([filename]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    // Clear image_url on the artwork row (if artworkId provided)
    if (artworkId) {
      await supabaseAdmin
        .from('artworks')
        .update({ image_url: null })
        .eq('id', artworkId);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
