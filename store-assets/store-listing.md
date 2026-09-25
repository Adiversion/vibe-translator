# Chrome Web Store Submission Metadata

## Short Description (max 132 chars)
```text
Translates Reddit posts into regional Indian slang using English letters. Powered by Google Gemini AI.
```
*(102 / 132 characters)*

---

## Detailed Store Description
```text
Translates Reddit posts into authentic regional Indian slang.
All translations use English letters for easy reading.
No textbook formal Hindi. No robotic phrasing.

Supported Languages:
• Hindi (Hinglish)
• Tamil (Tanglish)
• Telugu (Tenglish)
• Malayalam (Manglish)
• Kannada (Kanglish)
• Bengali, Punjabi, Marathi, Gujarati, and Odia
• Conversational Indian English

Features:
• One-click translate button right on Reddit posts and comments.
• Preserves humor, context, slang, and emojis.
• Switch back to original text anytime with one click.
• 10 free translations every day with automatic midnight reset.
• Connect your free Google AI Studio API key for unlimited translations.
• 100% private. Your key stays in your local browser storage.
• No tracking. No telemetry. No middleman servers.

How to Use:
1. Open the extension popup and pick your language.
2. Open any Reddit thread.
3. Click "Vibe Translate" to read in your regional slang.
```

---

## Single Purpose Justification (for Reviewer)
```text
Translates Reddit posts and comments into regional Indian slang written in English letters.
```

---

## Permission Justifications (for Reviewer)

### `storage`
```text
Saves the user's selected language, API key, and daily translation count locally on their device.
```

### `*://*.reddit.com/*`
```text
Adds the translate button to Reddit posts and displays the translated text in the thread.
```

### `https://generativelanguage.googleapis.com/*`
```text
Sends post text to the official Google Gemini API to generate the translation.
```
