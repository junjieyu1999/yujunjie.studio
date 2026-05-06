# Yu JunJie — Art Portfolio

Next.js 14 + Supabase art gallery for oil paintings. Features:
- Gallery with filter (All / Portraits / Landscapes / Available / In Progress / Sold)
- Artwork detail pages
- AI-powered commission questionnaire (generates a creative brief via Claude)
- Contact / enquiry modal
- All artwork data stored in Supabase

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run the contents of `supabase/schema.sql` — this creates the tables and seeds sample artworks
3. Go to **Settings → API** and copy your project URL and anon key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Gallery page (server, fetches artworks)
│   ├── globals.css         # Design tokens & global styles
│   ├── art/[id]/
│   │   └── page.tsx        # Artwork detail page
│   └── api/
│       ├── artworks/       # GET list, GET single
│       ├── contacts/       # POST contact form
│       └── generate-brief/ # POST AI brief generation
├── components/
│   ├── ArtPage.tsx         # Client shell (modal state)
│   ├── Nav.tsx             # Navigation bar
│   ├── Gallery.tsx         # Filterable gallery grid
│   ├── ArtworkCard.tsx     # Individual artwork card
│   ├── ArtworkDetailPage.tsx
│   ├── ContactModal.tsx    # Contact/enquiry modal
│   └── CommissionQuestionnaire.tsx  # 6-step AI questionnaire
└── lib/
    ├── supabase.ts         # Supabase client
    └── types.ts            # TypeScript types
supabase/
└── schema.sql              # Tables + seed data — run in Supabase SQL Editor
```

---

## Adding Artworks

Artworks live in the `artworks` table in Supabase. Add new rows with:

| Column | Description |
|--------|-------------|
| `id` | URL slug, e.g. `autumn-study` |
| `title` | Painting title |
| `year` | Year as string |
| `medium` | e.g. `Oil on canvas` |
| `dimensions` | e.g. `60×80cm` |
| `status` | `available` / `sold` / `in-progress` |
| `theme` | `portrait` / `landscape` |
| `description` | About this piece |
| `inspiration` | Inspiration text |
| `process` | Process notes |
| `gradient_bg` | CSS gradient for placeholder (until you upload an image) |
| `image_url` | Public Supabase Storage URL (optional) |
| `sort_order` | Integer, lower = earlier in grid |

### Uploading images

1. Create a public bucket in Supabase Storage named `artworks`
2. Upload images (recommended: `.webp`, aspect ratio 3:4)
3. Copy the public URL and paste it into the `image_url` column

---

## Deploying to Vercel

1. Push your repo to GitHub
2. Import in Vercel
3. Add the three environment variables in Vercel's project settings
4. Deploy — ISR (60s revalidation) keeps the gallery up to date automatically
