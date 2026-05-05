// app/page.tsx — server component that fetches artworks, then renders client shell

import { supabase } from '@/lib/supabase';
import type { Artwork } from '@/lib/types';
import ArtPage from '@/components/ArtPage';

export const revalidate = 60; // ISR: revalidate every 60s

async function getArtworks(): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Supabase error:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function GalleryPage() {
  const artworks = await getArtworks();
  return <ArtPage artworks={artworks} />;
}
