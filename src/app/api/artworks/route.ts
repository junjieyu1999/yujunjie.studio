import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { FilterValue } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') as FilterValue | null;

  let query = supabase.from('artworks').select('*').order('sort_order', { ascending: true });

  if (filter && filter !== 'all') {
    // theme filter
    if (filter === 'portrait' || filter === 'landscape') {
      query = query.eq('theme', filter);
    } else {
      // status filter
      query = query.eq('status', filter);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
