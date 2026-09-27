# Vibe Translator — Cloudflare Worker SaaS Proxy

This serverless backend powers Vibe Translator SaaS. It ensures:
1. **Zero Key Exposure**: Your master Gemini API key and prompt instructions never leak to client code or network inspections.
2. **Quota Enforcement**: Enforces **5 Free Translations / Day** per user.
3. **Pro Subscriptions**: Provides unlimited translation access for Pro members with active license keys.

---

## 🚀 Quick Deployment (Takes 2 Minutes)

### Step 1: Install Wrangler & Log in to Cloudflare
In your terminal, navigate to the `backend` folder:
```bash
cd D:\vibe-translator\backend
npx wrangler login
```

### Step 2: Set your Master Gemini API Key Secret
Store your Gemini API key securely in Cloudflare:
```bash
npx wrangler secret put GEMINI_API_KEY
```
*(When prompted, paste your Google AI Studio Gemini API key)*

### Step 3: Deploy to Cloudflare Edge
```bash
npx wrangler deploy
```
Wrangler will output your live API endpoint, for example:
```
https://vibe-translator-api.<your-subdomain>.workers.dev
```

### Step 4: Connect to Extension
Open `D:\vibe-translator\config.js` and paste your worker URL:
```javascript
const CONFIG_UPGRADE_URL = 'https://buy.stripe.com/your_live_stripe_link';
const CONFIG_BACKEND_URL = 'https://vibe-translator-api.<your-subdomain>.workers.dev';
const CONFIG_API_KEY = ''; // Leave blank when using the Cloudflare Worker
```

Then rebuild the extension:
```bash
npm run build
```

---

## 💳 Monitizing with Stripe / Gumroad

1. Create a Payment Link or Subscription Product in [Stripe](https://stripe.com) or [Gumroad](https://gumroad.com) for **$2.99/mo** (or ₹199/mo).
2. Set `CONFIG_UPGRADE_URL` in `config.js` to this checkout link.
3. When users reach their 5 free translations per day, the extension automatically presents the upgrade paywall and directs them to your checkout link.
4. When purchased, users can activate their license key in the popup to immediately unlock unlimited translations.
