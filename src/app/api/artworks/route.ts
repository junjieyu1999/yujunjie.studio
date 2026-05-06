// GET /api/artworks  — list all artworks (with optional filter)
// POST /api/artworks — create a new artwork row
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter');

  let query = supabaseAdmin.from('artworks').select('*').order('sort_order', { ascending: true });
  if (filter && filter !== 'all') {
    if (filter === 'portrait' || filter === 'landscape') query = query.eq('theme', filter);
    else query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id || !body.title || !body.year || !body.medium || !body.dimensions) {
      return NextResponse.json({ error: 'id, title, year, medium and dimensions are required' }, { status: 400 });
    }

    // Sanitise id into a valid slug
    const slug = body.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { data, error } = await supabaseAdmin
      .from('artworks')
      .insert({
        id          : slug,
        title       : body.title,
        year        : body.year,
        medium      : body.medium,
        dimensions  : body.dimensions,
        status      : body.status      ?? 'available',
        theme       : body.theme       ?? 'portrait',
        description : body.description ?? null,
        inspiration : body.inspiration ?? null,
        process     : body.process     ?? null,
        gradient_bg : body.gradient_bg ?? null,
        sort_order  : Number(body.sort_order) || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ artwork: data });
  } catch (err) {
    console.error('POST artwork error:', err);
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
