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
│   ├── postcards/          # Public snail mail page
│   ├── admin/              # Private admin (login + Overview / Artworks / Snail mail)
│   └── api/
│       ├── artworks/       # GET list, GET single
│       ├── admin/          # Admin-only API (snail mail) — requires login
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
    ├── supabase.ts         # Supabase client (browser-safe)
    ├── supabaseAdmin.ts    # Server-only service-role client
    ├── adminAuth.ts        # requireAdmin() gate for API routes
    ├── mail.ts             # Snail mail types + helpers + Google Form URL
    └── types.ts            # TypeScript types
supabase/
├── schema.sql              # Tables + seed data — run in Supabase SQL Editor
└── migration_snail_mail.sql  # Snail mail tables (run once, after schema.sql)
```

---

## Admin (`/admin`) and Snail mail

`/admin` is one private screen with three tabs: **Overview** (artwork pipeline and postcard pipeline side by side), **Artworks** and **Snail mail**.

### One-time setup
1. In the Supabase **SQL Editor**, run `supabase/migration_snail_mail.sql`. It is safe to re-run. The snail mail tables hold subscribers' home addresses, so they are locked down: no public or logged-in access, only the server can read them.
2. **Authentication -> Users -> Add user**: create your admin login (email + password, tick *Auto Confirm User*).
3. **Authentication -> Sign In / Providers**: turn **off** "Allow new users to sign up".
4. Set `ADMIN_EMAILS` (your email, as in step 2) in `.env.local` **and** in Vercel's environment variables, then redeploy. Without it the admin refuses every request, including artwork edits.

### Recommended hardening (optional, one line of SQL)
The original `schema.sql` lets *any* logged-in Supabase user write to the `artworks` table directly. That is why step 3 above (turn off sign-ups) matters. The site itself only reads artworks with the public key and writes through the protected admin API, so you can safely close that door too. Run this in the SQL Editor:

```sql
drop policy if exists "Authenticated users can manage artworks" on public.artworks;
```

### How the postcard business runs
- **Subscribers**: when someone fills in the Google Form, add them under *Snail mail -> Subscribers*. Only *Active* subscribers get a postcard.
- **Monthly issues**: create one per month (city, linked artwork, what goes on the card, cost per postcard). Tick *Show on the public Postcards page* to publish the city, month and artwork on `/postcards` (highlights, story and costs stay private).
- **Shipments**: open an issue and click *Generate shipments*. Each active subscriber gets a row with the price and costs copied in (Singapore uses the local postage, anywhere else the overseas postage). Mark them printed / mailed one by one or all at once, and use *Copy addresses to mail* for labels.
- **Money**: revenue counts for mailed/delivered postcards, costs for mailed/delivered/returned ones. Totals appear per issue and on the Overview.

### Public page (`/postcards`)
Explains the monthly postcard and links to the sign-up Google Form. The form URL lives in `src/lib/mail.ts` (`POSTCARD_FORM_URL`). The page refreshes every 60 seconds.

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
3. Add the environment variables from `.env.local.example` in Vercel's project settings (including `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS`)
4. Deploy — ISR (60s revalidation) keeps the gallery up to date automatically
