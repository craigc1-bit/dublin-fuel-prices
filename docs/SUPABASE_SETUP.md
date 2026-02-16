# Supabase setup for Dublin Fuel Prices

Do these in order. You need a Supabase project already (your URL is like `https://xxxx.supabase.co`).

---

## Part 1: Create the `price_reports` table

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project (the one whose URL you put in Vercel).

2. In the **left sidebar**, click **SQL Editor**.

3. Click **New query** (or the + tab) so you have an empty SQL box.

4. **Copy and paste** this whole block into the editor:

```sql
create table if not exists public.price_reports (
  id uuid primary key default gen_random_uuid(),
  station_id text not null,
  petrol numeric,
  diesel numeric,
  premium_petrol numeric,
  premium_diesel numeric,
  photo_url text,
  reported_at timestamptz default now()
);

alter table public.price_reports enable row level security;

create policy "Allow anon insert"
  on public.price_reports for insert
  to anon with check (true);

create policy "Allow anon select"
  on public.price_reports for select
  to anon using (true);
```

5. Click **Run** (or press Ctrl+Enter / Cmd+Enter).

6. You should see a green success message. If you get an error that the policy already exists, that’s fine — it means the table or policies were created before.

---

## Part 2: Create the storage bucket for photos

1. In the **left sidebar**, click **Storage**.

2. Click the green **New bucket** button.

3. Fill in:
   - **Name:** `price-confirmation-photos` (exactly that).
   - **Public bucket:** turn this **ON** (so the app can show photo URLs).
   - Leave other options as default.

4. Click **Create bucket**.

5. **Add policies** so the app can upload and read:
   - Click the bucket name **price-confirmation-photos**.
   - Open the **Policies** tab (or “New policy”).
   - Click **New policy** → **For full customization** (or “Create policy from scratch”).
   - **Policy 1 – allow uploads:**
     - Name: `Allow anon upload`
     - Allowed operation: **INSERT**
     - Target roles: **anon**
     - Policy definition: `true` (or “Allow all” for insert).
     - Save.
   - **Policy 2 – allow reads:**
     - New policy again.
     - Name: `Allow public read`
     - Allowed operation: **SELECT**
     - Target roles: **anon** (or “public” if that’s the option)
     - Policy definition: `true`
     - Save.

   If your dashboard uses “Policy templates,” you can instead choose “Allow public read access” and “Allow uploads” for anon and apply them to this bucket.

---

## Part 3: Push the code and redeploy on Vercel

This makes the live app use Vercel’s Supabase env vars instead of only the `.env` file.

1. **Open a terminal** in your project folder (e.g. `dublin-fuel-prices`).

2. **Stage and commit:**
   ```bash
   git add vite.config.ts docs/
   git commit -m "Use Vercel env vars for Supabase; add setup doc"
   ```

3. **Push to GitHub:**
   ```bash
   git push
   ```

4. **Vercel** will deploy automatically. Wait 1–2 minutes.

5. **Check the deployment:**
   - Go to [vercel.com](https://vercel.com) → your **dublin-fuel-prices** project → **Deployments**.
   - Wait until the latest deployment shows **Ready** (green).

6. **Test the live app:**
   - Open your live URL (e.g. `https://dublin-fuel-prices.vercel.app`).
   - The orange “Demo mode” banner should be **gone** (if it’s still there, do a hard refresh: Ctrl+Shift+R or Cmd+Shift+R).
   - Submit a report with a photo. It should save to Supabase and show “Photo confirmed.”
   - In Supabase: **Table Editor** → **price_reports** to see new rows; **Storage** → **price-confirmation-photos** to see uploaded images.

---

## Quick checklist

- [ ] Part 1: SQL run in Supabase → `price_reports` table exists.
- [ ] Part 2: Bucket `price-confirmation-photos` created and public, with insert + select policies.
- [ ] Part 3: Code pushed, Vercel redeployed, live site shows no demo banner and uploads to Supabase.
