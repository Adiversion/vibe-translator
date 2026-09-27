# Chrome Web Store Submission & Reviewer Kit — Vibe Translator v1.2.0

## 1. Short Description (max 132 chars)
```text
Translates Reddit posts & comments into authentic Indian regional dialects (Hindi, Tamil, Telugu & more) in casual English letters.
```
*(131 / 132 characters — WCAG AA & CWS length validated)*

---

## 2. Detailed Store Listing Description
```text
Translates Reddit posts and comments into authentic, casual Indian regional vernacular — written entirely in English/Latin letters (Hinglish, Tanglish, Telugu, Manglish, etc.).

No robotic, textbook translations. No formal literary phrases. Vibe Translator captures the actual tone, emotion, humor, and internet culture of social media conversations.

Supported Regional Vernaculars:
• Hindi (Hinglish)
• Tamil (Tanglish)
• Telugu (Casual Latin script)
• Malayalam (Manglish)
• Kannada (Casual Latin script)
• Bengali (Casual Latin script)
• Punjabi (Casual Latin script)
• Marathi (Casual Latin script)
• Gujarati (Casual Latin script)
• Odia (Casual Latin script)
• Casual Internet English (Indian Reddit/Twitter style)

Features:
• One-Click Translation: Adds a seamless "Translate Vibe" button directly beneath Reddit posts and comments.
• Script Purity: 100% Romanized/Latin alphabet output so you can read spontaneously without deciphering native alphabets.
• Tone & Emotional Fidelity: Preserves sarcasm, excitement, venting, memes, and cultural slang faithfully.
• Toggle Anytime: Switch between original text and translated text with a single click.
• 5 Free Daily Translations: Free daily trial quota resets automatically every midnight.
• Pro Subscription Available: Upgrade anytime for unlimited, high-priority translations.
• Privacy-First Architecture: Zero browsing history tracking. Zero advertising trackers. Minimal permissions.

How It Works:
1. Install Vibe Translator and open the extension popup.
2. Select your default target dialect (e.g. Hindi, Tamil, Telugu).
3. Browse Reddit and click "Translate Vibe" on any post or comment to read it in your dialect.
```

---

## 3. Single Purpose Statement (for CWS Reviewer)
```text
Translates Reddit posts and comments into regional Indian slang and vernacular written in Latin (English) characters.
```

---

## 4. Permission Justifications (Copy into CWS Developer Dashboard)

### `storage`
```text
Used locally to save the user's selected target dialect, daily free translation usage counter, and sign-in status.
```

### `tabs`
```text
Required strictly to handle the Google Sign-In and subscription activation flow with our authentication portal (kasyhq.com), detecting successful sign-in to sync the user's Pro license into the extension.
```

### Host Permission: `*://*.reddit.com/*`
```text
Required to inject the "Translate Vibe" button into Reddit post and comment action rows and display the translated text inline upon user request.
```

### Host Permission: `https://vibe-translator-api.audittool-api.workers.dev/*`
```text
Dedicated secure Cloudflare Worker serverless API proxy that protects AI system prompts and securely executes translation requests.
```

### Host Permission: `https://kasyhq.com/*` & `https://*.kasyhq.com/*`
```text
Primary web application and license portal used for user Google Sign-In and Pro subscription tier verification.
```

### Host Permission: `https://accounts.google.com/*` & `https://www.googleapis.com/*`
```text
Used to facilitate the Google OAuth sign-in flow and authenticate user identity for synchronization across devices.
```

---

## 5. Privacy & User Data Disclosures (August 2026 Developer Program Policies - `Purple Nickel`)

* **Privacy Policy URL:** `https://kasyhq.com/privacy`
* **Data Collected:** 
  - *Personal Communications:* Text of the specific Reddit post/comment that the user explicitly clicks to translate (transmitted ephemerally via encrypted HTTPS to generate the translation; never stored permanently).
  - *User Account Info:* Email address for Google Sign-In authentication and Pro license verification.
* **Data Not Collected:**
  - No web browsing history.
  - No keystrokes or form inputs.
  - No location or device identifiers.
  - Zero third-party advertising or affiliate tracking.
* **Affirmative Pre-Install Disclosure:** Included prominently in the extension description and onboarding modal.
