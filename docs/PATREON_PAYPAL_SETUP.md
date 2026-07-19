# CutFlow — Patreon & PayPal Integration Walkthrough

This is your step-by-step guide to connecting your existing payment accounts to CutFlow for monetization, subscription management, and automated license handling.

> **Your accounts:**
> - PayPal Business: `TLG3DLLC@GMAIL.COM` (DBA: "CUTFLOW")
> - Patreon: `TLG3D.LABS@GMAIL.COM`

---

## Phase 1: PayPal Business Setup

### Step 1: Change Your DBA Name to "CutFlow"

This makes it so customers see **"CUTFLOW"** on their bank/card statement instead of "TLG3D LLC".

1. Log into [paypal.com](https://www.paypal.com) with `TLG3DLLC@GMAIL.COM`
2. Go to **Settings** → **Business Profile** → **Business Information**
3. Find **"Credit Card Statement Name"** (also called DBA / Doing Business As)
4. Change it to: **CUTFLOW**
5. Save

### Step 2: Create a PayPal Developer App

1. Go to [developer.paypal.com](https://developer.paypal.com/)
2. Log in with your business email
3. Navigate to **Apps & Credentials**
4. Click **"Create App"**
   - App Name: `CutFlow`
   - App Type: `Merchant`
5. You will receive:
   - **Client ID** (public — safe to use in frontend checkout buttons)
   - **Secret Key** (private — ONLY on your backend server, NEVER in app code)

### Step 3: Create Subscription Plans

Using the PayPal REST API or the Dashboard:

1. Go to **Dashboard → Billing → Subscription Plans**
2. Create two plans:

| Plan Name | Price | Billing Cycle | Plan ID (you'll get this) |
|---|---|---|---|
| CutFlow Pro Monthly | $9.99 | Monthly | `P-XXXXXXXXXXXXXX` |
| CutFlow Studio Lifetime | $199.99 | One-time | `P-YYYYYYYYYYYYYY` |

3. Note down both **Plan IDs** — you'll need them for the checkout integration.

### Step 4: Set Up IPN (Instant Payment Notification)

This is how PayPal tells your server when someone pays, cancels, or gets a refund.

1. Go to [ipnpb.paypal.com](https://www.paypal.com/cgi-bin/customerprofileweb?cmd=_profile-ipn-notify)
2. Click **"Choose IPN Settings"**
3. Set the Notification URL to your backend:
   ```
   https://api.cutflow.dev/webhooks/paypal
   ```
   *(Replace with your actual server URL when you deploy)*
4. Enable **"Receive IPN messages"**

### Step 5: Integrate PayPal Buttons in CutFlow

In your web app or desktop checkout screen, use PayPal's JavaScript SDK:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&vault=true&intent=subscription"></script>
<script>
  paypal.Buttons({
    style: { shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' },
    createSubscription: function(data, actions) {
      return actions.subscription.create({
        plan_id: 'P-XXXXXXXXXXXXXX' // Your Pro Monthly Plan ID
      });
    },
    onApprove: function(data, actions) {
      // Send data.subscriptionID to your server
      fetch('/api/activate-license', {
        method: 'POST',
        body: JSON.stringify({
          subscription_id: data.subscriptionID,
          hardware_id: getDeviceHardwareId(),
        })
      });
    }
  }).render('#paypal-button-container');
</script>
```

---

## Phase 2: Patreon Setup

### Step 1: Create a Patreon Developer Client

1. Go to [patreon.com/portal](https://www.patreon.com/portal)
2. Log in with `TLG3D.LABS@GMAIL.COM`
3. Click **"Create Client"**
   - Client Name: `CutFlow`
   - Description: `AI Video Production Studio by The Looking Glass 3D`
   - Redirect URI: `https://api.cutflow.dev/auth/patreon/callback`
     *(For local development, also add: `http://localhost:3000/auth/patreon/callback`)*
4. You will receive:
   - **Client ID**
   - **Client Secret**

### Step 2: Create Your Pro Tier on Patreon

1. Go to your Patreon page settings
2. Create a membership tier:
   - **Title:** CutFlow Pro
   - **Price:** $9.99/month
   - **Description:** "Unlock the full CutFlow AI Director Agent, Auto B-Roll, Smart Jump-Cut, Semantic Search, and 40+ cloud LLM providers."
3. Note the **Tier ID** from the API (you'll need this to verify memberships)

### Step 3: Implement OAuth2 "Log in with Patreon"

When a user clicks "Log in with Patreon" in CutFlow:

```
Step 1: Redirect to Patreon authorization:
  https://www.patreon.com/oauth2/authorize
    ?response_type=code
    &client_id=YOUR_PATREON_CLIENT_ID
    &redirect_uri=https://api.cutflow.dev/auth/patreon/callback
    &scope=identity+identity[email]+memberships

Step 2: Exchange the authorization code for an access token:
  POST https://www.patreon.com/api/oauth2/token
  Body: {
    code: <authorization_code>,
    grant_type: "authorization_code",
    client_id: YOUR_CLIENT_ID,
    client_secret: YOUR_CLIENT_SECRET,
    redirect_uri: "https://api.cutflow.dev/auth/patreon/callback"
  }

Step 3: Check membership status:
  GET https://www.patreon.com/api/oauth2/v2/identity
    ?include=memberships.currently_entitled_tiers
    &fields[member]=patron_status,currently_entitled_amount_cents
  Authorization: Bearer <access_token>

Step 4: If the user has an active membership at the $9.99 tier, activate Pro.
```

### Step 4: Set Up Patreon Webhooks

1. In the Patreon Developer Portal, go to your Client → **Webhooks**
2. Add a webhook for these events:
   - `members:pledge:create` — User subscribes → activate Pro license
   - `members:pledge:update` — User changes tier → update license
   - `members:pledge:delete` — User cancels → revoke Pro license
3. Set the webhook URL:
   ```
   https://api.cutflow.dev/webhooks/patreon
   ```

---

## Phase 3: License Server Backend

You need a small backend server to manage license keys. This can be deployed on:
- **Vercel** (free tier works for this)
- **Railway** or **Render** (cheap, easy)
- **Your own VPS** (most control)

### Recommended Stack
- **Runtime:** Node.js (Bun) or Rust (Axum)
- **Database:** SQLite (Turso) or PostgreSQL (Supabase free tier)
- **Hosting:** Vercel Edge Functions or Railway

### Database Schema

```sql
CREATE TABLE licenses (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  tier         TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'studio'
  hardware_ids TEXT,                          -- JSON array of up to 3 device IDs
  source       TEXT NOT NULL,                 -- 'paypal', 'patreon', 'dev'
  subscription_id TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMP,
  revoked      BOOLEAN DEFAULT FALSE
);

CREATE TABLE trial_devices (
  hardware_id  TEXT PRIMARY KEY,
  trial_start  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trial_used   BOOLEAN DEFAULT FALSE
);
```

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/validate` | POST | CutFlow sends `{ license_key, hardware_id }` → server responds with `{ status: "active", tier: "pro" }` or `{ status: "revoked" }` |
| `/api/trial/check` | POST | CutFlow sends `{ hardware_id }` → server checks if trial is available or already used |
| `/api/trial/start` | POST | Starts the 7-day trial for a hardware ID |
| `/webhooks/paypal` | POST | Receives PayPal IPN notifications |
| `/webhooks/patreon` | POST | Receives Patreon webhook events |
| `/auth/patreon/callback` | GET | OAuth2 callback for Patreon login |

### Revocation Flow

```
User cancels Patreon subscription
  → Patreon sends `members:pledge:delete` webhook to your server
  → Server marks license as `revoked = TRUE`
  → Next time user opens CutFlow, the app calls `/api/validate`
  → Server returns `{ status: "revoked" }`
  → CutFlow downgrades to Free tier
```

---

## Phase 4: What You Need to Deploy

Here's your minimal checklist to go live:

### You Already Have ✅
- [x] PayPal Business account (`TLG3DLLC@GMAIL.COM`)
- [x] Patreon account (`TLG3D.LABS@GMAIL.COM`)
- [x] CutFlow app with Hardware ID fingerprinting (`security.rs`)
- [x] CutFlow app with Dev Backdoor encryption (`security.rs`)
- [x] 7-day trial logic tied to device ID (`security.rs`)

### You Still Need To Set Up 🔲
- [ ] Register a PayPal Developer App and get Client ID + Secret
- [ ] Create PayPal subscription plans (Pro + Studio)
- [ ] Register a Patreon Developer Client and get Client ID + Secret
- [ ] Create the $9.99/mo Pro tier on your Patreon page
- [ ] Deploy a license server (Vercel / Railway / Render)
- [ ] Set up the SQLite/PostgreSQL database with the schema above
- [ ] Point PayPal IPN and Patreon webhooks to your server URL
- [ ] (Optional) Register a domain like `api.cutflow.dev` for the backend

### Environment Variables for the License Server
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PATREON_CLIENT_ID=your_patreon_client_id
PATREON_CLIENT_SECRET=your_patreon_client_secret
DATABASE_URL=your_database_connection_string
JWT_SECRET=a_random_32_character_string
```

---

## Security Notes

> [!CAUTION]
> **NEVER** put your PayPal Secret, Patreon Client Secret, or JWT Secret in the CutFlow application code. These should ONLY exist on your backend license server.

> [!TIP]
> Your personal information (name, address) is protected by the PayPal Business account. Customers will only see "CUTFLOW" on their bank statements. Your Patreon page can display whatever branding you want.

> [!IMPORTANT]
> The Dev Backdoor (`TLG3D` / unlock code) is SHA-256 hashed and XOR-obfuscated in the compiled Rust binary. It cannot be extracted by decompiling or memory scanning under normal circumstances.

---

*Guide written for CutFlow by SerThrocken — The Looking Glass 3D (TLG3D LLC)*
