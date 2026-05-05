export type ArtworkStatus = 'available' | 'sold' | 'in-progress';
export type ArtworkTheme = 'portrait' | 'landscape';

export interface Artwork {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  status: ArtworkStatus;
  theme: ArtworkTheme;
  description: string | null;
  inspiration: string | null;
  process: string | null;
  gradient_bg: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export type FilterValue = 'all' | ArtworkStatus | ArtworkTheme;

export interface Commission {
  id: string;
  painting_type: string | null;
  size: string | null;
  budget: string | null;
  theme: string | null;
  inspiration: string | null;
  client_name: string | null;
  client_email: string | null;
  ai_brief: string | null;
  status: 'new' | 'reviewed' | 'accepted' | 'declined';
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  message: string | null;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}

export interface QuestionnaireData {
  type?: string;
  size?: string;
  budget?: string;
  theme?: string;
  insp?: string;
  name?: string;
  email?: string;
}
