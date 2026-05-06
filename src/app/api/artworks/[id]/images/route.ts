// GET  /api/artworks/[id]/images  — fetch all images for one artwork
// DELETE /api/artworks/[id]/images — remove one image by its uuid

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('artwork_images')
    .select('*')
    .eq('artwork_id', params.id)
    .order('sort_order', { ascending: true });

  if (error) {
    // Return empty array rather than 500 — table may not exist yet
    console.error('artwork_images fetch error:', error.message);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId, filename } = await req.json();

    if (!imageId || !filename) {
      return NextResponse.json({ error: 'imageId and filename required' }, { status: 400 });
    }

    // Remove from Storage
    await supabaseAdmin.storage.from('artworks').remove([filename]);

    // Remove from artwork_images table
    const { error } = await supabaseAdmin
      .from('artwork_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If this was the primary image, clear artworks.image_url
    // and promote the next image if one exists
    const { data: remaining } = await supabaseAdmin
      .from('artwork_images')
      .select('url')
      .eq('artwork_id', params.id)
      .order('sort_order', { ascending: true })
      .limit(1);

    await supabaseAdmin
      .from('artworks')
      .update({ image_url: remaining?.[0]?.url ?? null })
      .eq('id', params.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE image error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
