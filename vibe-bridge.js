try {
  importScripts("config.js");
} catch (e) {}

const DEFAULT_TEST_KEY = "";
const DEFAULT_BACKEND_URL = "https://vibe-translator-api.audittool-api.workers.dev";

const TARGET_LANGUAGES = {
  hindi: "Hindi (authentic casual street Hinglish written in English/Latin script)",
  tamil: "Tamil (authentic casual street Tanglish written in English/Latin script)",
  telugu: "Telugu (authentic casual street Telugu written in English/Latin script)",
  malayalam: "Malayalam (authentic casual street Manglish written in English/Latin script)",
  kannada: "Kannada (authentic casual street Kannada written in English/Latin script)",
  bengali: "Bengali (authentic casual street Bengali written in English/Latin script)",
  punjabi: "Punjabi (authentic casual street Punjabi written in English/Latin script)",
  marathi: "Marathi (authentic casual street Marathi written in English/Latin script)",
  gujarati: "Gujarati (authentic casual street Gujarati written in English/Latin script)",
  odia: "Romanized Odia (authentic street vernacular written in English/Latin script)",
  english: "Casual Internet English (unfiltered Indian street internet English, Reddit/Twitter style)"
};

const SYSTEM_PROMPT = `You are an elite multilingual street-slang, emotion, and vibe translator. Your primary mission is to faithfully transport the author's EXACT emotion, tone, and cultural register into the target language.

### Core Translation Directives:

1. Emotion, Vibe & Cadence First:
   - Identify whether the context is heated road rage, internet dating venting, sarcasm, shock, dry wit, or hype.
   - Match the spontaneous spoken cadence, breathlessness, and natural rhythm of a native speaker.

2. Complete Slang & Dialect Conversion (Zero Source Residue):
   - Every single regional slang word, colloquial particle, or sentence connector from the source (e.g., Tamil "aprom", "kuda", "da", "machi"; Malayalam "pinne", "alle", "thalleoli") MUST be translated into the target language's natural idiom. NEVER leave source regional words untranslated in the output.

3. Authentic Tone-Matched Register (Strictly No Bookish/Formal Words):
   - Never use archaic, textbook, or overly formal literary terms (e.g., in Hinglish, strictly avoid words like "aashcharya", "sandarbha", "drishyakaavya"; use "shock", "jhatka", "scene", "vibe").
   - Seamlessly blend tech, vehicle, and internet loanwords ("speed", "brake", "date", "apps", "bro", "scene") in Latin script.

4. Semantic Fidelity (Zero Hallucinated Padding):
   - Capture the exact message, nuance, and intensity of the original text.
   - NEVER invent extra consequences, threats, anatomical exaggerations, or filler drama not present in the input.

5. 100% Native Endogenous Slang:
   - Use the target culture's own indigenous curses and expletives.
   - NEVER inject Hindi slurs (e.g., "bhenchod", "chutiya") into Odia, Tamil, Telugu, Malayalam, or Bengali.

6. Zero Censorship:
   - If the original text is offensive, crude, or aggressive, match that exact level of vulgarity and aggression without softening or sanitizing.

7. Structural Formatting:
   - If the input contains "TITLE:" and "BODY:", preserve those exact labels in the output. Otherwise, output only the translated text.
   - SCRIPT PURITY: For Romanized output, use ONLY English/Latin alphabet. Never output native scripts (Devanagari, Tamil, etc.).
   - Output ONLY the translated text without quotes, disclaimers, or conversational preambles.

8. Cynical Internet Venting vs Polite Storytelling:
   - When the source is an anonymous Reddit rant, exposé, or gossip:
   - Do NOT write like a polite narrator (avoid stilted phrasing like "ek ladki hoti hai", "dhokhe mein fasna", "jawab diya").
   - Use active, conversational street slang and cynical framing (e.g., "ek ladki hai", "chutiya na bane", "laundon ko message karna", "patta kaat dena", "bakchodi pelna"). Treat the reader like a friend in an informal group chat.

### Calibration Anchors:
- Road Rage (Manglish -> Hinglish):
  Source: "Ho thalleoli ayale kanditum speed kurachilla, matte vandi nirthiya kondu mathrama kunna nirthiyathu. Ee thayoli onnum jeevithathil vandi odikan pattatha reethyil aaki vidanam"
  Target: "Abey saala madarchod, usko dekh ke bhi speed kam nahi kiya! Woh toh doosri gaadi ruk gayi isliye lund ruk paya. Aise bhenchodon ko toh zindagi bhar gaadi chalane layak hi nahi chhodna chahiye."

- Cynical Dating/Reddit Rants (Telugu -> Hinglish):
  Source: "Oka chinna story type lo chepta.. Oka girl vuntadi.. aameki cafés ki tirigi baaga pics upload cheyali.. eyy coffee teskunna 300-400 minimum vuntadi.. dating bonda sub open chesi.. vallaki msg chesi cafe lo meet avdam ani.. 2-3 hours sollu cheppesi vacheyali.. lekapothe cut cheseyali."
  Target: "Ek chhoti si story ki tarah batata hoon.. Ek ladki hai.. usko cafés ghoom ke mast photos upload karni hain.. koi bhi coffee le lo, kam se kam 300-400 lagte hi hain.. dating bonda sub khol ke laundon ko message karke bolti hai café mein milo.. 2-3 ghante bakchodi pelo aur nikal lo.. warna wahi pe patta kaat do."`;

const MAX_DAILY_TRIALS = 5;
const VIP_PREMIUM_EMAILS = ["anadisyagnik@gmail.com"];

function getTodayString() {
  const e = new Date();
  return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}

chrome.runtime.onInstalled.addListener(e => {
  if ("install" === e.reason) {
    const url = "undefined" != typeof CONFIG_UPGRADE_URL && CONFIG_UPGRADE_URL
      ? `${CONFIG_UPGRADE_URL}&welcome=true&source=extension_install`
      : "https://kasyhq.com/vibe-translator?welcome=true";
    chrome.tabs.create({ url });
  }
});

chrome.runtime.onMessageExternal.addListener((e, t, a) => {
  if (e && ("SYNC_USER_EMAIL" === e.type || "LOGIN_SUCCESS" === e.type)) {
    const email = e.email ? String(e.email).trim().toLowerCase() : "";
    if (email && email.includes("@")) {
      const isVip = VIP_PREMIUM_EMAILS.includes(email);
      chrome.storage.sync.set({ userEmail: email, isPremium: !!isVip }, () => {
        if (isVip) {
          a({ status: "ok", email, isPro: true });
        } else {
          fetch(`https://kasyhq.com/api/subscription?email=${encodeURIComponent(email)}&product=VIBE`)
            .then(res => res.json())
            .then(data => {
              const prod = String(data?.product || data?.requestedProduct || "").toUpperCase();
              const isMatch = prod === "VIBE" || prod === "VIBE_TRANSLATOR" || prod === "ALL";
              const isPro = data && (String(data.plan).toUpperCase() === "PREMIUM" || String(data.plan).toUpperCase() === "PRO") && isMatch;
              chrome.storage.sync.set({ isPremium: isPro });
              a({ status: "ok", email, isPro });
            })
            .catch(() => {
              a({ status: "ok", email, isPro: false });
            });
        }
      });
      return true;
    }
  }
  return true;
});

chrome.runtime.onMessage.addListener((e, t, a) => {
  if (e && ("SYNC_USER_EMAIL" === e.type || "sync-user-email" === e.request || "sync_email" === e.action)) {
    const email = e.email ? String(e.email).trim().toLowerCase() : "";
    if (email && email.includes("@")) {
      const isVip = VIP_PREMIUM_EMAILS.includes(email);
      chrome.storage.sync.set({ userEmail: email, isPremium: !!isVip }, () => {
        if (isVip) {
          a({ status: "ok", email, isPro: true, founder: true });
        } else {
          fetch(`https://kasyhq.com/api/subscription?email=${encodeURIComponent(email)}&product=VIBE`)
            .then(res => res.json())
            .then(data => {
              const prod = String(data?.product || data?.requestedProduct || "").toUpperCase();
              const isMatch = prod === "VIBE" || prod === "VIBE_TRANSLATOR" || prod === "ALL";
              const isPro = data && (String(data.plan).toUpperCase() === "PREMIUM" || String(data.plan).toUpperCase() === "PRO") && isMatch;
              chrome.storage.sync.set({ isPremium: isPro });
              a({ status: "ok", email, isPro });
            })
            .catch(() => {
              a({ status: "ok", email, isPro: false });
            });
        }
      });
      return true;
    }
    a({ status: "error", message: "Invalid email" });
    return true;
  }

  if ("fetch_gemini" === e.action) {
    chrome.storage.sync.get(["userEmail", "isPremium", "licenseKey", "targetLanguage"], config => {
      const userEmail = (config.userEmail || "").trim().toLowerCase();
      const isVip = VIP_PREMIUM_EMAILS.includes(userEmail);
      const isPro = !!config.isPremium || isVip;
      const upgradeUrl = "undefined" != typeof CONFIG_UPGRADE_URL && CONFIG_UPGRADE_URL ? CONFIG_UPGRADE_URL : "https://kasyhq.com/vibe-translator#pricing";

      if (!config.userEmail && !isVip) {
        return a({
          error: "Please sign in with Google to start using Vibe Translator.",
          needsLogin: true,
          loginUrl: `${upgradeUrl}&auth=google&source=inline_click`
        });
      }

      chrome.storage.local.get(["usageDate", "usageCount"], usage => {
        const today = getTodayString();
        let count = (usage.usageDate === today && usage.usageCount) || 0;

        if (!isPro && count >= MAX_DAILY_TRIALS) {
          return a({
            error: "Daily limit reached (5/5 free used today). Upgrade to Pro for unlimited translations!",
            translated: null,
            limitReached: true,
            usedToday: count,
            maxTrials: MAX_DAILY_TRIALS,
            upgradeUrl
          });
        }

        const langKey = (e.targetLanguage || config.targetLanguage || "hindi").toLowerCase();
        const targetDesc = TARGET_LANGUAGES[langKey] || TARGET_LANGUAGES.hindi;
        const backendUrl = "undefined" != typeof CONFIG_BACKEND_URL && CONFIG_BACKEND_URL ? CONFIG_BACKEND_URL.trim() : DEFAULT_BACKEND_URL;

        if (backendUrl) {
          (async () => {
            try {
              const res = await fetch(`${backendUrl.replace(/\/+$/, "")}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: e.text,
                  targetLanguage: langKey,
                  targetDesc,
                  licenseKey: config.licenseKey || null,
                  userEmail: userEmail || "",
                  subreddit: e.subreddit || "",
                  parentContext: e.parentContext || ""
                })
              });
              const data = await res.json();
              if (!res.ok || data.error) {
                if (data.limitReached) {
                  return a({
                    error: data.error,
                    translated: null,
                    limitReached: true,
                    usedToday: MAX_DAILY_TRIALS,
                    maxTrials: MAX_DAILY_TRIALS,
                    upgradeUrl
                  });
                }
                throw new Error(data.error || `Proxy returned HTTP ${res.status}`);
              }
              if (data.translated) {
                if (!isPro) {
                  count += 1;
                  chrome.storage.local.set({ usageDate: today, usageCount: count });
                }
                a({ translated: data.translated, error: null, usedToday: count, maxTrials: MAX_DAILY_TRIALS, isPro });
              } else {
                a({ error: "No translation received from backend proxy", translated: null });
              }
            } catch (err) {
              a({ error: `Backend proxy error: ${err.message}`, translated: null });
            }
          })();
          return;
        }

        const apiKey = "undefined" != typeof CONFIG_API_KEY && CONFIG_API_KEY ? CONFIG_API_KEY : "";
        if (!apiKey) {
          return a({
            error: "Service is temporarily unconfigured. Please configure CONFIG_BACKEND_URL or CONFIG_API_KEY in config.js.",
            translated: null
          });
        }

        const promptText = `${e.parentContext ? `<parent_context>\n${e.parentContext}\n</parent_context>\n\n` : ""}<source_text>\n${e.text}\n</source_text>\n\nTranslate the text inside <source_text> into ${targetDesc}. Match the exact emotion, vibe, and natural street cadence. Output only the translation.`;

        const payload = {
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 }
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };

        const models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

        (async () => {
          let lastError = null;
          for (const model of models) {
            try {
              const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
              const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              const json = await res.json();
              if (!res.ok) {
                lastError = json.error?.message || `HTTP ${res.status}`;
                continue;
              }
              const outputText = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (outputText) {
                if (!isPro) {
                  count += 1;
                  chrome.storage.local.set({ usageDate: today, usageCount: count });
                }
                return a({ translated: outputText, error: null, usedToday: count, maxTrials: MAX_DAILY_TRIALS, isPro });
              }
              lastError = "No candidate text returned";
            } catch (err) {
              lastError = err.message;
            }
          }
          a({ error: lastError || "All Gemini fallback models failed", translated: null });
        })();
      });
    });
    return true;
  }
});