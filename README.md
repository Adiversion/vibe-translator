# Vibe Translator — Project Status & Agent Handoff

> **Purpose of this document:** Complete technical documentation and handoff notes for the **Vibe Translator** Chrome Extension. Any future agent or developer can pick up development seamlessly from this document.

---

## 1. Project Overview

**Vibe Translator** is a Manifest V3 Chrome Extension that integrates into Reddit's desktop interface (modern **Shreddit** Lit-based web components). It injects a native-styled **"Translate Vibe"** action pill button into Reddit posts and comments, allowing users to translate regional and English Reddit content into natural, authentic, conversational Indian regional dialects and slang (Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Punjabi, Marathi, Gujarati, Odia, English) written in conversational Latin / English script using Google Gemini.

- **Target Site:** `*://*.reddit.com/*`
- **Supported Dialects:** Hindi (Hinglish), Tamil, Telugu, Malayalam, Kannada, Bengali, Punjabi, Marathi, Gujarati, Odia, and Casual Internet English (all written in English letters).
- **Model Endpoints:** Primary `gemini-3.5-flash-lite:generateContent` with seamless automatic fallback to `gemini-3.8-flash:generateContent` via v1beta REST API.
- **Key Characteristics:** Authentic internet slang mapping, preservation of code-mixing/English phrasing, zero robotic gender slashes, identical emoji/punctuation preservation, in-place toggle ("Show Original" / "Translate Vibe").

---

## 2. Directory Structure & Files

```text
D:\Reddit post and comment translator\
├── icons/
│   ├── icon16.png        # 16x16 Favicon
│   ├── icon32.png        # 32x32 Toolbar icon
│   ├── icon48.png        # 48x48 Extensions settings page icon
│   ├── icon128.png       # 128x128 Chrome Web Store icon
│   └── logo.png          # 512x512 High-res app logo
├── manifest.json         # Manifest V3 extension configuration
├── popup.html            # Extension action popup UI (Dark Theme)
├── popup.js              # Manages optional custom Gemini API key in chrome.storage.sync
├── styles.css            # Extension styling, rainbow sweep animation, translated text card
├── vibe-bridge.js        # Background Service Worker handling Gemini API requests
├── vibe-inject.js        # Content Script handling DOM observation, Shadow DOM traversal, & injection
└── README.md             # This handoff & documentation file
```

---

## 3. Core Architecture & How It Works

### A. Manifest V3 (`manifest.json`)
- Pruned unnecessary permissions (`activeTab`, `scripting`) to respect least-privilege principles.
- Requested permissions: `["storage"]` (to allow users to configure their own Gemini API key if desired).
- Host permissions: `*://*.reddit.com/*` and `https://generativelanguage.googleapis.com/*`.
- Action popup: `popup.html`.
- Content script: runs `vibe-inject.js` and `styles.css` on `*://*.reddit.com/*`.
- Background service worker: `vibe-bridge.js`.

### B. Background Service Worker (`vibe-bridge.js`)
- **Key Resolution:** First checks `chrome.storage.sync` for `customGeminiApiKey`. If not found, falls back cleanly to the built-in local testing key (`DEFAULT_TEST_KEY`).
- **Prompt Isolation (`system_instruction`):** Separates system persona and prompt guidelines into the official Gemini `system_instruction` payload. This mitigates prompt injection vulnerabilities and separates untrusted user text.
- **Slang Safety Settings:** Reddit text frequently contains strong colloquial expressions (e.g., Telugu insults like *"kukka kottudu"*, *"denemma"*). Standard Gemini safety filters could trigger false-positive blocks (`finishReason: "SAFETY"`). Explicit `safetySettings` with `BLOCK_ONLY_HIGH` are enabled for harassment, hate speech, sexual content, and dangerous content.
- **Structure Preservation Rule:** Explicitly instructs Gemini that if an input contains `TITLE:` and `BODY:`, the output must retain `TITLE:` and `BODY:` delimiters to facilitate clean UI separation.
- **Error Propagation:** Inspects `response.ok` before parsing JSON. Network and API errors are passed back with clear messages rather than failing silently.

### C. Content Script (`vibe-inject.js`)
- **DOM Observation:** Uses a debounced `MutationObserver` wrapped in `requestAnimationFrame` (`processAllContainers`) observing `document.body` for `shreddit-post`, `shreddit-comment`, and fallback containers.
- **Container Tracking:** Tracks injection via `data-vibe-injected` and `container.__vibeBtn` to eliminate duplicate injections and avoid DOM tree search collisions.
- **SPA Navigation:** Checks `permalink` attribute changes on existing `<shreddit-post>` elements during SPA navigation and resets state automatically.

---

## 4. Key Engineering Problems Solved

### Problem 1: Shadow DOM & Missing Action Bar Buttons
- **Challenge:** Reddit's modern UI (**Shreddit**) wraps posts (`<shreddit-post>`) and comments (`<shreddit-comment>`) in Lit Web Components with Shadow Roots. Standard `document.querySelector` cannot pierce these boundaries.
- **Solution (`getContainerContexts`):** Recursively inspects open shadow roots inside the container up to 3 levels deep while strictly stopping at nested `shreddit-comment` boundaries.
- **Multi-Priority Fallback (`findBestActionBarTarget`):**
  1. **Priority 1 (Share Button):** Sibling immediately after the Share button (matches by custom tag, ARIA label, or text "Share").
  2. **Priority 2 (Comment / Reply Button):** Sibling immediately after the comment button or reply button (critical for permalink pages where posts lack a Share button, e.g. `[ ⬆ 0 ⬇ ] [ 💬 153 ]`).
  3. **Priority 3 (Award Button):** Sibling after the Award button.
  4. **Priority 4 (Vote Group):** Sibling immediately after the upvote/downvote group (`.rpl-vote-button-group` / `div[role="group"]`). **Note:** Must be inserted as a *sibling* after the group, never appended *inside* the vote group to avoid clipping.

### Problem 2: Parent vs. Reply Comment Subtree Collisions
- **Challenge:** In Reddit's DOM, parent comments contain their replies inside `<div slot="children">`. Previously, querying `container.querySelector('.vibe-translate-action-btn')` on a parent comment searched the entire child subtree. If a reply was processed first, the parent comment aborted injection thinking it already had a button.
- **Solution:** Replaced subtree queries with per-container attribute tracking (`container.hasAttribute('data-vibe-injected')`) and targeted direct children of the action bar (`targetPlacement.parent.querySelector(':scope > .vibe-translate-action-btn')`).

### Problem 3: Static Rainbow Text Sweep Animation
- **Challenge:** The loading rainbow gradient on the text was static and not animating. Two root causes were identified:
  1. CSS `@keyframes` in `document.head` cannot penetrate into Web Component Shadow Roots; browsers fail to find the animation definition.
  2. Reddit headings use `-webkit-text-fill-color`, which overrides `color: transparent`.
- **Solution:**
  - `ensureGlobalStyles` dynamically mounts `@keyframes vibe-magic-sweep` directly into any target `shadowRoot`.
  - Added dual-driver animation: `background-position: 0% 50%` to `200% 50%` plus `filter: hue-rotate(360deg)` with `will-change: background-position, filter`.
  - Added `-webkit-text-fill-color: transparent !important`, `box-decoration-break: clone`, and child transparency rules (`.vibe-text-processing *`).
  - Added dynamic pulsing feedback to the button itself (`vibe-processing`).

### Problem 4: Slotted Text Replacement in Comments & Posts
- **Challenge:** If a translation `<div>` was inserted as a sibling outside of `<div slot="comment">`, the browser's Shadow DOM layout engine refused to render it because it was not projected into the `<slot name="comment">`.
- **Solution:** When translating comments or post bodies, `translatedDiv` is inserted directly inside `textBody` while original paragraphs are set to `display: none`. This guarantees 100% accurate slot projection, line wrapping, and theme inheritance.

### Problem 5: Title-Only Posts vs. Text Posts
- Image/media posts (e.g. meme posts) have only a title and no body text. The script detects `hasTitle && !hasBody` and performs an in-place replacement of the heading (`titleEl.innerText = translatedTitle`) and updates the `post-title` attribute, leaving Reddit's media layout completely intact.
- If both title and body exist, it structures the prompt with `TITLE:` and `BODY:` and updates both in-place.

---

## 5. Popup & Configuration (`popup.html` & `popup.js`)

- Features a high-tech dark theme with the project logo (`icons/icon48.png`).
- Displays live status: `"Active on reddit.com"`.
- Allows users to save a custom Gemini API key into `chrome.storage.sync` or reset back to the default testing key with a single click.

---

## 6. How to Load and Test the Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the folder:
   `D:\Reddit post and comment translator`
5. Pin the extension to your toolbar to view the popup.
6. Open any Reddit thread (e.g. `https://www.reddit.com/r/tollywood/` or `https://www.reddit.com/r/southindia_/`).
7. Verify that:
   - The **"Translate Vibe"** button appears in the post action bar (next to Share or Comment count).
   - The **"Translate Vibe"** button appears on all comments and replies.
   - Clicking the button triggers an active, moving rainbow gradient text sweep and pulsing button state.
   - The text translates into authentic conversational Hinglish.
   - Clicking "Show Original" reverts to the original text.

---

## 7. Backlog / Potential Future Improvements

For the next engineer working on this project:

1. **Language Dialect Selector (Feature):**
   - Currently translates into North Indian / Mumbai style conversational Hinglish. Could add options in `popup.html` for "Hyderabadi Hinglish" or "Bangalore Kanglish".
2. **Reddit Old Layout Support (`old.reddit.com`):**
   - Currently optimized for modern Reddit (`shreddit`). If `old.reddit.com` support is needed, add selectors for `.entry .flat-list`.
3. **Automated End-to-End Tests:**
   - Consider setting up a lightweight Playwright or Puppeteer test suite to mock Reddit DOM components and verify injection stability across Reddit layout updates.
