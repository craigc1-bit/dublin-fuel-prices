# Dublin Fuel Prices

A Dublin fuel price app where **users submit up-to-date prices with photo confirmation** (Waze-style). Community-reported prices override the sample data and are shown with a “User reported” badge and optional photo.

## Features

- **Browse** stations and prices (Dublin only for now).
- **Report price** – Tap “Report price” on any station, enter prices (€/L), and **attach a photo of the pump or price board** so others can verify. Reports are stored and shown as the latest price for that station.
- **Demo mode** – Without Supabase, reports are saved in the browser (localStorage). Photos are not persisted in demo mode.
- **Supabase (optional)** – Add your project and env vars to enable photo upload and sync across devices.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Supabase setup (for photo confirmation and sync)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run:

```sql
-- Table for user-submitted price reports
create table if not exists price_reports (
  id uuid primary key default gen_random_uuid(),
  station_id text not null,
  petrol numeric,
  diesel numeric,
  premium_petrol numeric,
  premium_diesel numeric,
  photo_url text,
  reported_at timestamptz not null default now()
);

-- Optional: allow anonymous read/insert so the app works without auth
alter table price_reports enable row level security;

create policy "Allow anonymous read"
  on price_reports for select
  using (true);

create policy "Allow anonymous insert"
  on price_reports for insert
  with check (true);
```

3. In **Storage**, create a bucket named **`price-confirmation-photos`**, set it to **Public** (so the app can show image URLs), and add a policy that allows anonymous uploads, e.g.:

   - Policy: “Allow anonymous uploads” – `INSERT` for `authenticated` or `anon` if you want no sign-in.

   In the Supabase dashboard: Storage → New bucket → name `price-confirmation-photos`, Public ON. Then add policy: “Allow public upload” with `INSERT` for role `anon` (or `authenticated` if you add auth later).

4. In the project **Settings → API**, copy the **Project URL** and **anon public** key. In the app root create `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart `npm run dev`. Reporting will use Supabase; photos will be stored and shown on cards.

## Build

```bash
npm run build
npm run preview   # optional: preview production build
```

## Data source

- **Stations** – The list of Dublin stations is static sample data in `src/data/dublinStations.ts`. You can replace it with an API or expand by county.
- **Prices** – Shown from the latest **user report** per station (if any), otherwise from the sample data. Ireland has no official fuel-price API; sites like [Pumps.ie](https://pumps.ie) and [PetrolPrices.ie](https://petrolprices.ie) are crowdsourced and have no public API.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Supabase** (optional): PostgreSQL for reports, Storage for confirmation photos
