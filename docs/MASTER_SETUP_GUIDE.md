# CutFlow Master Setup & Promo Video Guide

This guide is your single source of truth. It contains the **5-minute Cloud Setup Checklist** (Supabase, Discord, Vercel), **Discord Webhook instructions**, **Patreon/PayPal steps**, and a **complete script/visual guide** for filming your product demo video.

---

## ⚡ Part 1: The 5-Minute Cloud Setup (Supabase, Discord, Vercel)

Follow these steps in order. All platforms are **100% free** and require zero code writing or server maintenance.

### 1. Supabase Setup (Database) — 2 Mins
Supabase will hold your licenses securely.
1. Go to [supabase.com](https://supabase.com) and click **Start your project** (Sign up for a free account).
2. Click **New Project** and name it `cutflow-licensing`. Set a secure database password (write it down!).
3. Choose the region closest to you and click **Create New Project**.
4. Once the project dashboard loads, click **SQL Editor** on the left menu (it looks like a `>_` terminal icon).
5. Click **New Query**, paste the SQL block below, and click **Run**:
   ```sql
   -- Drop the table if it already exists to allow clean re-runs
   DROP TABLE IF EXISTS licenses;

   CREATE TABLE licenses (
     id           TEXT PRIMARY KEY,
     email        TEXT NOT NULL,
     tier         TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'studio'
     hardware_ids TEXT,                          -- Device IDs (fingerprints)
     source       TEXT NOT NULL,                 -- 'paypal', 'patreon', 'dev'
     subscription_id TEXT,
     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     expires_at   TIMESTAMP,
     revoked      BOOLEAN DEFAULT FALSE
   );

   -- Enable Row Level Security (RLS) to prevent unauthorized public access
   ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

   -- Explicitly deny all public API access (Vercel will bypass this securely using the service_role key)
   CREATE POLICY "Deny all public access" ON licenses FOR ALL TO public USING (false);
   ```
6. Click the **Project Settings** (gear icon) on the left sidebar -> Go to **API**.
7. Copy your **Project URL** and the **anon public API key** (you will paste these into Vercel).

---

### 2. Discord Webhook Setup — 1 Min
This pings your Discord when sales happen. You do **not** need a bot.
1. Open your Discord server on your computer.
2. Hover over the text channel where you want sales updates (e.g., `#sales-logs`) and click the **Gear Icon** (Edit Channel).
3. Click **Integrations** on the left menu.
4. Click **Webhooks** -> **Create Webhook** (or **New Webhook**).
5. Name it `CutFlow Store Bot` and choose an icon if you wish.
6. Click **Copy Webhook URL**. (Keep this on your clipboard!).

---

### 3. Vercel Setup (Serverless Webhook Listener) — 2 Mins
Vercel runs the serverless function that catches PayPal payments and saves them to Supabase.
1. Go to [vercel.com](https://vercel.com) and sign up for a free Hobby account using your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your `OpenCut` repository from your GitHub account.
4. Expand the **Environment Variables** section. Add the following keys:
   - `SUPABASE_URL` = *(Your Project URL from Supabase)*
   - `SUPABASE_KEY` = *(Your Service Role/Anon key from Supabase)*
   - `DISCORD_WEBHOOK_URL` = *(The Discord Webhook URL you copied in Step 2)*
5. Click **Deploy**. Vercel will build your server in under a minute and give you a public URL like `https://cutflow-license.vercel.app`.

---

## 💸 Part 2: Patreon & PayPal Business Setup

### 1. PayPal Business Setup
Ensure customers see **"CUTFLOW"** on their bank statements.
1. Log into your Business PayPal at `TLG3DLLC@GMAIL.COM`.
2. Go to **Account Settings** -> **Business Information**.
3. Click **Update** next to your Business Profile.
4. Find **Credit Card Statement Name** (Doing Business As / DBA) and change it to `CUTFLOW`. Save changes.
5. Set up your PayPal webhook subscription:
   - Go to [developer.paypal.com](https://developer.paypal.com/) and create a live app called `CutFlow`.
   - Copy the Client ID & Secret.
   - Go to your Webhooks section in the PayPal Developer dashboard, click **Add Webhook**, paste your Vercel URL (`https://your-app.vercel.app/api/paypal`), and check `Payment capture completed` and `Billing subscription created`.

### 2. Patreon Integration
1. Log into Patreon using `TLG3D.LABS@GMAIL.COM`.
2. Go to your Creator Page -> **Tiers** -> Create a **$9.99/mo** membership tier named `CutFlow Pro`.
3. Go to [patreon.com/portal](https://www.patreon.com/portal) (Developer Portal) and click **Create Client**.
4. Set the Redirect URI to your Vercel callback URL: `https://your-app.vercel.app/auth/patreon/callback`.
5. Under Webhooks, add your Vercel webhook URL: `https://your-app.vercel.app/api/patreon` and check `members:pledge:create`, `members:pledge:update`, and `members:pledge:delete`.

---

## 🎥 Part 3: Video Demo Production & Script Guide
Use this script and checklist to film a high-converting, professional promo video. Show off the UI, the speed, and the intelligence of the system.

### Visual Requirements (What to show on screen)
*   **Aesthetic Look:** Show the **TLG3D Industrial Theme** as the default. The charcoal background, neon swirl green accents, and golden highlights look premium and clean.
*   **The Transition:** Trigger a theme change in the video (e.g., to *Midnight Ocean*) to demonstrate the **sideways rolling fade transition** you requested.
*   **Basic vs. Advanced Toggle:** Show the top-right toggle switch. Flip it to hide the timeline entirely (Basic Mode, perfect for fast AI vibe-editing) and flip it back to show all track lanes (Advanced Mode).

---

### Promo Video Script (Approx. 60 Seconds)

| Time | Visual on Screen | What You Say (Voiceover / On-Camera) |
|---|---|---|
| **0:00 - 0:10** | *Close-up of the sleek, dark industrial CAD UI.* | "This is CutFlow—the first AI-native video editor designed to work at the speed of thought. No clutter, no complex nesting. Just raw performance." |
| **0:10 - 0:20** | *User types a prompt in the Vibe Edit Console:* `"Make the intro energetic, add lo-fi bg music, and add vintage color grading."` | "With the **Vibe Edit Console**, you don't hunt through menus. You tell the Director Agent the mood you want, and the AI builds your timeline." |
| **0:20 - 0:30** | *Show the Basic vs. Advanced toggle. Toggle it to "Basic" to show the prompt console, then toggle to "Advanced" to reveal the color-coded timelines sliding in.* | "Simplify your workspace with our **Basic/Advanced Toggle**. Keep it clean for rapid drafting, or open up the multi-track timeline for absolute surgical control." |
| **0:30 - 0:42** | *Show a theme change. A sideways rolling fade sweeps across the screen, switching from "TLG3D Industrial" to "Midnight Ocean".* | "Customize your environment. With built-in themes like Midnight Ocean, Nordic Studio, and the signature TLG3D Industrial look, CutFlow is built to be comfortable during long rendering sessions." |
| **0:42 - 0:52** | *Show the teleprompter screen in action. Text scrolls smoothly, syncing with the speaker's voice.* | "CutFlow also features a voice-synchronized teleprompter, automatic B-roll fetching, and smart jump-cuts. Everything you need to go from script to export in minutes." |
| **0:52 - 1:00** | *Call to action: Show logo and checkout buttons.* | "CutFlow is free to try, and Pro is just $9.99. Download it today and start editing at the speed of your imagination." |

---

*This master guide was generated for SerThrocken / The Looking Glass 3D LLC.*
