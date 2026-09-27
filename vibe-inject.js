const VIBE_GLOBAL_CSS = `
    @keyframes vibe-magic-sweep {
        0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
        50% { background-position: 100% 50%; filter: hue-rotate(180deg); }
        100% { background-position: 200% 50%; filter: hue-rotate(360deg); }
    }
    @keyframes vibe-btn-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.04); }
        100% { transform: scale(1); }
    }
    .vibe-text-processing {
        background: linear-gradient(90deg, #ff4500 0%, #ff8c00 15%, #a020f0 35%, #24a0ed 60%, #00d2ff 80%, #ff4500 100%) !important;
        background-size: 200% 100% !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
        animation: vibe-magic-sweep 2s linear infinite !important;
        display: inline-block !important;
    }
    .vibe-text-processing * {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        background: transparent !important;
    }
    .vibe-translate-action-btn.vibe-processing {
        animation: vibe-btn-pulse 1.2s ease-in-out infinite !important;
        opacity: 0.85 !important;
    }
    .vibe-translate-action-btn.vibe-flat-style {
        height: 24px !important;
        padding: 0 10px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        margin-left: 8px !important;
        border-radius: 9999px !important;
        align-self: center !important;
        display: inline-flex !important;
        vertical-align: middle !important;
        flex-shrink: 0 !important;
        white-space: nowrap !important;
    }
    .vibe-upgrade-modal-backdrop {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0, 0, 0, 0.75) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        backdrop-filter: blur(3px) !important;
    }
    .vibe-upgrade-dialog {
        background: #0d1117 !important;
        border: 1px solid #30363d !important;
        border-radius: 14px !important;
        padding: 24px !important;
        width: 380px !important;
        max-width: 90vw !important;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6) !important;
        color: #f0f6fc !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-sizing: border-box !important;
    }
    .vibe-modal-badge {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: rgba(255, 69, 0, 0.15) !important;
        color: #ff6b35 !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        padding: 3px 8px !important;
        border-radius: 9999px !important;
        margin-bottom: 12px !important;
    }
    .vibe-modal-badge-dot {
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background: #ff4500 !important;
    }
    .vibe-modal-title {
        font-size: 16px !important;
        font-weight: 700 !important;
        margin: 0 0 8px 0 !important;
    }
    .vibe-modal-desc {
        font-size: 12px !important;
        color: #8b949e !important;
        margin: 0 0 14px 0 !important;
        line-height: 1.5 !important;
    }
    .vibe-modal-features {
        list-style: none !important;
        padding: 0 !important;
        margin: 0 0 16px 0 !important;
        font-size: 11px !important;
        color: #c9d1d9 !important;
        line-height: 1.6 !important;
    }
    .vibe-modal-upgrade-btn {
        background: #ff4500 !important;
        color: #ffffff !important;
        text-decoration: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        padding: 11px 16px !important;
        border-radius: 8px !important;
        border: none !important;
        cursor: pointer !important;
    }
    .vibe-modal-dismiss-btn {
        background: transparent !important;
        color: #8b949e !important;
        border: 1px solid #30363d !important;
        border-radius: 8px !important;
        min-height: 38px !important;
        font-size: 12px !important;
        cursor: pointer !important;
        margin-top: 8px !important;
        width: 100% !important;
    }
`;

function showUpgradeModal(t) {
  if (document.getElementById("vibe-upgrade-modal-backdrop")) return;
  const url = t?.upgradeUrl || "https://kasyhq.com/vibe-translator#pricing";
  const used = t?.usedToday || 5;
  const max = t?.maxTrials || 5;
  const el = document.createElement("div");
  el.id = "vibe-upgrade-modal-backdrop";
  el.className = "vibe-upgrade-modal-backdrop";
  el.innerHTML = `
    <div class="vibe-upgrade-dialog" role="dialog" aria-modal="true">
        <div class="vibe-modal-badge">
            <span class="vibe-modal-badge-dot"></span>
            <span>FREE LIMIT REACHED (${used}/${max})</span>
        </div>
        <h2 class="vibe-modal-title">Unlock Unlimited Vibe Translations</h2>
        <p class="vibe-modal-desc">You've hit your daily limit of ${max} free translations! Upgrade to Pro for unlimited translations across all Indian dialects.</p>
        <ul class="vibe-modal-features">
            <li>✦ Unlimited daily translations</li>
            <li>✦ Authentic unfiltered street dialects</li>
            <li>✦ Ultra-low latency responses</li>
        </ul>
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="vibe-modal-upgrade-btn">Upgrade to Pro</a>
        <button type="button" class="vibe-modal-dismiss-btn" id="vibe-modal-close-btn">Maybe Tomorrow</button>
    </div>`;
  document.body.appendChild(el);
  const dismiss = () => { el.remove(); };
  el.querySelector("#vibe-modal-close-btn")?.addEventListener("click", dismiss);
  el.addEventListener("click", e => { if (e.target === el) dismiss(); });
}

function showLoginModal(t) {
  if (document.getElementById("vibe-login-modal-backdrop")) return;
  const url = t?.loginUrl || "https://kasyhq.com/pricing?product=vibe_translator&auth=google";
  const el = document.createElement("div");
  el.id = "vibe-login-modal-backdrop";
  el.className = "vibe-upgrade-modal-backdrop";
  el.innerHTML = `
    <div class="vibe-upgrade-dialog" role="dialog" aria-modal="true">
        <h2 class="vibe-modal-title">Sign in to Vibe Translator</h2>
        <p class="vibe-modal-desc">Sign in with Google to get 5 free daily authentic translations on Reddit.</p>
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="vibe-modal-upgrade-btn">Continue with Google</a>
        <button type="button" class="vibe-modal-dismiss-btn" id="vibe-login-close-btn">Maybe Later</button>
    </div>`;
  document.body.appendChild(el);
  const dismiss = () => { el.remove(); };
  el.querySelector("#vibe-login-close-btn")?.addEventListener("click", dismiss);
  el.addEventListener("click", e => { if (e.target === el) dismiss(); });
}

function ensureGlobalStyles(target = document.head) {
  if (target && !target.querySelector("#vibe-global-styles")) {
    const el = document.createElement("style");
    el.id = "vibe-global-styles";
    el.textContent = VIBE_GLOBAL_CSS;
    target.appendChild(el);
  }
}
ensureGlobalStyles(document.head);

let currentTargetLanguage = "hindi";

function handleLanguageChange(lang) {
  if (!lang) return;
  const next = lang.toLowerCase();
  if (next !== currentTargetLanguage) {
    currentTargetLanguage = next;
    document.querySelectorAll(".vibe-translate-action-btn").forEach(btn => {
      if (typeof btn.__onLanguageChange === "function") {
        btn.__onLanguageChange(currentTargetLanguage);
      }
    });
  }
}

function getContainerContexts(el) {
  const list = [el];
  function scan(parent, depth = 0) {
    if (!parent || depth > 3) return;
    parent.querySelectorAll("*").forEach(node => {
      const tag = node.tagName.toLowerCase();
      if (tag !== "shreddit-comment" && tag !== "shreddit-post" && node.shadowRoot && !list.includes(node.shadowRoot)) {
        list.push(node.shadowRoot);
        scan(node.shadowRoot, depth + 1);
      }
    });
  }
  if (el.shadowRoot) list.push(el.shadowRoot);
  scan(el);
  return list;
}

function findBestActionBarTarget(container) {
  const contexts = getContainerContexts(container);
  const getSafePlacement = node => {
    if (!node || !node.parentNode) return null;
    let curr = node;
    let link = null;
    while (curr && curr !== container) {
      if (curr.tagName && curr.tagName.toLowerCase() === "a") link = curr;
      curr = curr.parentNode;
    }
    return link && link.parentNode ? { parent: link.parentNode, nextSibling: link.nextSibling, isFlat: true } : { parent: node.parentNode, nextSibling: node.nextSibling, isFlat: false };
  };

  const selectors = [
    "shreddit-post-action-row",
    "shreddit-comment-action-row",
    "shreddit-async-action-row",
    '[slot="action-row"]',
    '[data-testid="action-row"]',
    '[data-testid="post-action-row"]',
    "div.flex.items-center.gap-xs",
    "div.flex.items-center.gap-sm"
  ];

  for (const ctx of contexts) {
    for (const sel of selectors) {
      const row = ctx.querySelector(sel);
      if (row) {
        const root = row.shadowRoot || row;
        return { parent: root, nextSibling: null, isFlat: false };
      }
    }
  }

  const buttons = ['[data-testid="post-share-button"]', 'button[aria-label*="share" i]', '[data-testid="reply-button"]', 'button[aria-label*="reply" i]'];
  for (const ctx of contexts) {
    for (const sel of buttons) {
      const b = ctx.querySelector(sel);
      if (b) {
        const pos = getSafePlacement(b);
        if (pos) return pos;
      }
    }
  }
  return null;
}

function locateTitleElement(container) {
  if (!container || container.tagName.toLowerCase() === "shreddit-comment") return null;
  const sel = ['[slot="title"]', '[slot="post-title"]', 'h1[id*="post-title"]', '[data-testid="post-title"]', "h1", "h2"].join(", ");
  let el = container.querySelector(sel);
  if (!el && container.shadowRoot) el = container.shadowRoot.querySelector(sel);
  return el;
}

function locateBodyElement(container) {
  if (!container) return null;
  const isComment = container.tagName.toLowerCase() === "shreddit-comment";
  const selectors = isComment
    ? ['[slot="comment"]', 'div[id$="-comment-rtjson-content"]', '[data-testid="comment"]', "p"]
    : ['[slot="text-body"]', 'div[id$="-post-rtjson-content"]', '[data-testid="post-body"]', "p"];

  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el) return el;
    if (container.shadowRoot) {
      const shadowEl = container.shadowRoot.querySelector(sel);
      if (shadowEl) return shadowEl;
    }
  }
  return null;
}

function extractCleanBodyText(el) {
  return el ? (el.innerText || el.textContent || "").replace(/^\s*View spoiler\s*/i, "").replace(/\s*View spoiler\s*$/i, "").replace(/Read more\s*$/i, "").trim() : "";
}

function parseTranslationResponse(rawText, hasTitle, hasBody) {
  let text = (rawText || "").trim().replace(/^```(?:markdown|text)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const titleRegex = /(?:^|\n)\s*(?:\*{1,2}|#{1,3}\s*)?TITLE\s*:?\s*(?:\*{1,2})?\s*([\s\S]*?)(?=(?:\r?\n\s*(?:\*{1,2}|#{1,3}\s*)?BODY\s*:?\s*(?:\*{1,2})?)|$)/i;
  const bodyRegex = /(?:^|\n)\s*(?:\*{1,2}|#{1,3}\s*)?BODY\s*:?\s*(?:\*{1,2})?\s*([\s\S]*)$/i;

  const matchTitle = text.match(titleRegex);
  const matchBody = text.match(bodyRegex);

  if (hasTitle && hasBody) {
    if (matchTitle && matchBody) return { title: matchTitle[1].trim(), body: matchBody[1].trim() };
    const parts = text.split(/\n\s*\n/);
    return parts.length > 1 ? { title: parts[0].trim(), body: parts.slice(1).join("\n\n").trim() } : { title: text, body: "" };
  }
  if (hasTitle && !hasBody) {
    return { title: matchTitle ? matchTitle[1].trim() : text.replace(/^(?:\*{1,2})?TITLE\s*:?\s*/i, "").trim(), body: "" };
  }
  return { title: "", body: matchBody ? matchBody[1].trim() : text.replace(/^(?:\*{1,2})?BODY\s*:?\s*/i, "").trim() };
}

function injectActionBarButton(container, isFlat = false) {
  if (container.shadowRoot) ensureGlobalStyles(container.shadowRoot);
  const permalink = container.getAttribute("permalink") || "";
  if (container.dataset.vibePermalink && container.dataset.vibePermalink !== permalink) {
    container.removeAttribute("data-vibe-injected");
    if (container.__vibeBtn) {
      container.__vibeBtn.remove();
      container.__vibeBtn = null;
    }
  }
  if (permalink) container.dataset.vibePermalink = permalink;
  if (container.hasAttribute("data-vibe-injected")) return;

  const rawTitleAttr = container.getAttribute("post-title") || "";
  let titleNode = locateTitleElement(container);
  let bodyNode = locateBodyElement(container);

  const titleText = rawTitleAttr.trim() || (titleNode ? titleNode.innerText.trim() : "");
  const bodyText = extractCleanBodyText(bodyNode);
  const hasTitle = Boolean(titleText);
  const hasBody = Boolean(bodyText);

  if (bodyText) container.__vibeOriginalBodyText = bodyText;
  if (!hasTitle && !hasBody) return;

  const placement = findBestActionBarTarget(container);
  if (!placement || !placement.parent) return;
  if (placement.parent.querySelector && placement.parent.querySelector(":scope > .vibe-translate-action-btn")) {
    container.setAttribute("data-vibe-injected", "true");
    return;
  }

  const isFlatButton = isFlat || Boolean(placement.isFlat);
  const btn = document.createElement("button");
  btn.className = "vibe-translate-action-btn" + (isFlatButton ? " vibe-flat-style" : "");
  btn.setAttribute("type", "button");
  btn.setAttribute("aria-label", "Translate Vibe");

  btn.innerHTML = `
    <svg class="vibe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 5px;">
        <path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path>
    </svg>
    <span class="vibe-btn-text" style="font-weight: 600; font-size: 11px;">Translate Vibe</span>`;

  btn.style.cssText = `
    background: var(--color-neutral-background-weak, rgba(0, 0, 0, 0.05));
    color: var(--color-neutral-content-strong, #1c1c1c);
    border: none;
    border-radius: 9999px;
    padding: 0 10px;
    height: 26px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
  `;

  const cache = {};
  let isTranslated = false;
  let translatedBodyContainer = null;

  function applyTranslation(lang) {
    const data = cache[lang];
    if (!data) return;

    if (hasTitle && data.title) {
      if (!titleNode) titleNode = locateTitleElement(container);
      if (titleNode) titleNode.innerText = data.title;
    }
    if (data.body) {
      if (!bodyNode) bodyNode = locateBodyElement(container);
      if (bodyNode) {
        if (!translatedBodyContainer) {
          translatedBodyContainer = document.createElement("div");
          translatedBodyContainer.className = "vibe-translated-text-body";
          const slot = bodyNode.getAttribute("slot");
          if (slot) translatedBodyContainer.setAttribute("slot", slot);
          if (bodyNode.parentNode) bodyNode.parentNode.insertBefore(translatedBodyContainer, bodyNode.nextSibling);
        }
        translatedBodyContainer.innerText = data.body;
        translatedBodyContainer.style.display = "block";
        bodyNode.style.display = "none";
      }
    }

    const label = btn.querySelector(".vibe-btn-text");
    if (label) label.innerText = "Show Original";
    btn.style.color = "#24a0ed";
    btn.classList.add("vibe-active");
    isTranslated = true;
  }

  function doTranslate(lang) {
    const label = btn.querySelector(".vibe-btn-text");
    if (cache[lang]) return applyTranslation(lang);

    if (!titleNode && hasTitle) titleNode = locateTitleElement(container);
    const currBody = locateBodyElement(container);
    if (currBody) bodyNode = currBody;

    const cleanBody = extractCleanBodyText(bodyNode);
    const validBody = Boolean(cleanBody);
    if (!hasTitle && !validBody) return;

    let payloadText = hasTitle && !validBody ? titleText : !hasTitle && validBody ? cleanBody : `TITLE: ${titleText}\n\nBODY: ${cleanBody}`;

    if (!chrome?.runtime?.id) {
      if (label) label.innerText = "Refresh Page";
      btn.style.color = "#ff4500";
      return;
    }

    if (label) label.innerText = "Translating...";
    btn.style.pointerEvents = "none";
    btn.classList.add("vibe-processing");
    if (titleNode) titleNode.classList.add("vibe-text-processing");
    if (bodyNode) bodyNode.classList.add("vibe-text-processing");

    let parentContext = "";
    if (container.tagName.toLowerCase() === "shreddit-comment") {
      let cur = container.parentElement;
      while (cur && cur !== document.body) {
        if (cur.tagName && cur.tagName.toLowerCase() === "shreddit-comment") {
          parentContext = cur.__vibeOriginalBodyText || extractCleanBodyText(locateBodyElement(cur));
          if (parentContext) parentContext = parentContext.slice(0, 300);
          break;
        }
        cur = cur.parentElement;
      }
    }

    const subredditMatch = window.location.pathname.match(/\/r\/([^\/]+)/i);
    const subreddit = subredditMatch ? subredditMatch[1] : "";

    chrome.runtime.sendMessage(
      {
        action: "fetch_gemini",
        text: payloadText,
        targetLanguage: lang,
        subreddit: subreddit,
        parentContext: parentContext
      },
      res => {
        if (titleNode) titleNode.classList.remove("vibe-text-processing");
        if (bodyNode) bodyNode.classList.remove("vibe-text-processing");
        btn.style.pointerEvents = "auto";
        btn.classList.remove("vibe-processing");

        if (chrome.runtime?.lastError || !res) {
          const errMsg = chrome.runtime?.lastError?.message || "No response from background service worker.";
          console.error("[Vibe Translator]: Translation failed —", errMsg);
          if (label) label.innerText = "Retry";
          btn.style.color = "#d93a00";
          return;
        }

        if (res.translated) {
          const parsed = parseTranslationResponse(res.translated, hasTitle, validBody);
          cache[lang] = parsed;
          applyTranslation(lang);
        } else if (res.needsLogin) {
          if (label) label.innerText = "Sign In";
          showLoginModal(res);
        } else if (res.limitReached) {
          if (label) label.innerText = "Limit (5/5)";
          showUpgradeModal(res);
        } else {
          console.error("[Vibe Translator]: Background returned error —", res.error);
          if (label) label.innerText = "Retry";
          btn.style.color = "#d93a00";
        }
      }
    );
  }

  btn.__onLanguageChange = l => { if (isTranslated) doTranslate(l); };

  btn.addEventListener("click", e => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const label = btn.querySelector(".vibe-btn-text");
    const txt = label ? label.innerText : "";

    if (txt === "Sign In") return showLoginModal();
    if (txt.includes("Limit")) return showUpgradeModal({ usedToday: 5, maxTrials: 5 });
    if (txt === "Refresh Page") return window.location.reload();

    if (isTranslated) {
      if (hasTitle && titleNode) titleNode.innerText = titleText;
      if (bodyNode) bodyNode.style.display = "";
      if (translatedBodyContainer) translatedBodyContainer.style.display = "none";
      if (label) label.innerText = "Translate Vibe";
      btn.style.color = "var(--color-neutral-content-strong, #1c1c1c)";
      btn.classList.remove("vibe-active");
      isTranslated = false;
    } else {
      doTranslate(currentTargetLanguage);
    }
  }, { capture: true });

  if (placement.nextSibling) {
    placement.parent.insertBefore(btn, placement.nextSibling);
  } else {
    placement.parent.appendChild(btn);
  }

  container.__vibeBtn = btn;
  container.setAttribute("data-vibe-injected", "true");
}

if (typeof chrome !== "undefined" && chrome.storage?.sync) {
  chrome.storage.sync.get(["targetLanguage"], res => {
    if (res?.targetLanguage) currentTargetLanguage = res.targetLanguage.toLowerCase();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.targetLanguage) {
      handleLanguageChange(changes.targetLanguage.newValue);
    }
  });
}

let scheduledTimer = null;
const observedShadowRoots = new WeakSet();

function observeCommentShadowRoots() {
  document.querySelectorAll("shreddit-comment").forEach(el => {
    if (el.shadowRoot && !observedShadowRoots.has(el.shadowRoot)) {
      observedShadowRoots.add(el.shadowRoot);
      new MutationObserver(debouncedProcess).observe(el.shadowRoot, { childList: true, subtree: true });
    }
  });
}

function processAllContainers() {
  observeCommentShadowRoots();
  document.querySelectorAll("shreddit-post, shreddit-comment").forEach(el => injectActionBarButton(el));
  document.querySelectorAll('faceplate-tracker[source="search"] article, [data-testid="search-post-unit"]').forEach(el => {
    if (!el.hasAttribute("data-vibe-injected")) injectActionBarButton(el, true);
  });
}

function debouncedProcess() {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = setTimeout(() => {
    processAllContainers();
  }, 120);
}

const observer = new MutationObserver(debouncedProcess);
observer.observe(document.body, { childList: true, subtree: true });

processAllContainers();
[300, 1000, 2500].forEach(t => setTimeout(processAllContainers, t));