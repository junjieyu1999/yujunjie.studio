import { supabase } from '@/lib/supabase';
import type { Artwork } from '@/lib/types';
import { notFound } from 'next/navigation';
import ArtworkDetailPage from '@/components/ArtworkDetailPage';

export const revalidate = 60;

interface Props {
  params: { id: string };
}

async function getArtwork(id: string): Promise<Artwork | null> {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateStaticParams() {
  const { data } = await supabase.from('artworks').select('id');
  return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
}

export default async function DetailPage({ params }: Props) {
  const artwork = await getArtwork(params.id);
  if (!artwork) notFound();
  return <ArtworkDetailPage artwork={artwork} />;
}
