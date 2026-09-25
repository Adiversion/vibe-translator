// vibe-inject.js

const VIBE_GLOBAL_CSS = `
    @keyframes vibe-magic-sweep {
        0% {
            background-position: 0% 50%;
            filter: hue-rotate(0deg);
        }
        50% {
            background-position: 100% 50%;
            filter: hue-rotate(180deg);
        }
        100% {
            background-position: 200% 50%;
            filter: hue-rotate(360deg);
        }
    }

    @keyframes vibe-btn-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.04); }
        100% { transform: scale(1); }
    }

    .vibe-text-processing {
        background: linear-gradient(90deg, 
            #ff4500 0%, 
            #ff8c00 15%, 
            #a020f0 35%, 
            #24a0ed 60%, 
            #00d2ff 80%, 
            #ff4500 100%
        ) !important;
        background-size: 200% 100% !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
        -webkit-box-decoration-break: clone !important;
        box-decoration-break: clone !important;
        animation: vibe-magic-sweep 2s linear infinite !important;
        will-change: background-position, filter !important;
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
`;

function ensureGlobalStyles(targetRoot = document.head) {
    if (!targetRoot) return;
    if (!targetRoot.querySelector('#vibe-global-styles')) {
        const style = document.createElement('style');
        style.id = 'vibe-global-styles';
        style.textContent = VIBE_GLOBAL_CSS;
        targetRoot.appendChild(style);
    }
}

// Initial injection in document head
ensureGlobalStyles(document.head);

/**
 * Collects all candidate DOM contexts (including any open shadow roots)
 * belonging strictly to this container (without penetrating into child posts/comments).
 */
function getContainerContexts(container) {
    const contexts = [container];
    if (container.shadowRoot) {
        contexts.push(container.shadowRoot);
    }

    // Helper to find child shadow roots within container (stopping at nested comments/posts)
    function collectChildShadowRoots(root, depth = 0) {
        if (!root || depth > 3) return;
        const elements = root.querySelectorAll('*');
        for (const el of elements) {
            const tagName = el.tagName.toLowerCase();
            // Do not cross into nested comment or post containers
            if (tagName === 'shreddit-comment' || tagName === 'shreddit-post') {
                continue;
            }
            if (el.shadowRoot && !contexts.includes(el.shadowRoot)) {
                contexts.push(el.shadowRoot);
                collectChildShadowRoots(el.shadowRoot, depth + 1);
            }
        }
    }

    collectChildShadowRoots(container);
    if (container.shadowRoot) {
        collectChildShadowRoots(container.shadowRoot);
    }

    return contexts;
}

/**
 * Universal Action Bar Finder:
 * Inspects all contexts for the best button position:
 * 1. Sibling directly after Share button
 * 2. Sibling directly after Comment / Reply button
 * 3. Sibling directly after Award button
 * 4. Sibling directly after Vote group
 * 5. Action row / toolbar container
 */
function findBestActionBarTarget(container) {
    const contexts = getContainerContexts(container);

    // Never insert the button inside an anchor — it would make clicks navigate
    const isSafeParent = (el) => {
        if (!el) return false;
        let node = el;
        while (node && node !== container) {
            if (node.tagName && node.tagName.toLowerCase() === 'a') return false;
            node = node.parentNode;
        }
        return true;
    };

    // Shallow contexts only: container light DOM + its direct shadow root.
    // Used for text-based fallback walks so we never dive into internal
    // shadow roots of nested components (e.g. shreddit-comment-vote-button).
    const shallowContexts = [container];
    if (container.shadowRoot) shallowContexts.push(container.shadowRoot);

    // ── Priority 1: Action row container ─────────────────────────────────────
    // Checked first — most semantically correct location for both posts and comments.
    const rowSelectors = [
        // Named Shreddit web components
        'shreddit-post-action-row',
        'shreddit-comment-action-row',
        'shreddit-async-action-row',
        // Slotted / data-testid variants
        '[slot="action-row"]',
        '[data-testid="action-row"]',
        '[data-testid="post-action-row"]',
        '[data-testid="seeker-action-row"]',
        // Actual Reddit comment action bar (found via DevTools: shadow DOM)
        // Exact class match and flexible multi-class match
        'div[class="flex items-center max-h-2xl"]',
        'div.flex.items-center.max-h-2xl',
        // Broader Tailwind flex-row patterns Reddit uses for action bars
        'div.flex.items-center.gap-xs',
        'div.flex.items-center.gap-sm',
        'ul.flex.items-center',
        'ol.flex.items-center'
    ];

    for (const ctx of contexts) {
        for (const sel of rowSelectors) {
            const row = ctx.querySelector(sel);
            if (row) {
                // Prefer inserting into the row's own shadow root (renders inline);
                // otherwise append to the element itself.
                const target = row.shadowRoot || row;
                if (isSafeParent(target)) {
                    return { parent: target, nextSibling: null };
                }
            }
        }
    }

    // ── Priority 2: Native Share button (specific selectors) ─────────────────
    const shareSelectors = [
        'shreddit-post-share-button',
        'shreddit-comment-share-button',
        '[data-testid="post-share-button"]',
        '[data-testid="share-button"]',
        '[id*="-share-button"]',
        '[id*="-share-menu"]',
        '[data-post-click-location="share"]',
        'button[aria-label*="share" i]'
    ];

    for (const ctx of contexts) {
        for (const sel of shareSelectors) {
            const el = ctx.querySelector(sel);
            if (el && el.parentNode && isSafeParent(el.parentNode)) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }
    }

    // Text-walk for Share — shallow only to avoid matching internal component buttons
    for (const ctx of shallowContexts) {
        const btns = ctx.querySelectorAll('button, [role="button"]');
        for (const b of btns) {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (label === 'share' || text === 'share') {
                if (b.parentNode && isSafeParent(b.parentNode)) {
                    return { parent: b.parentNode, nextSibling: b.nextSibling };
                }
            }
        }
    }

    // ── Priority 3: Reply / Comment button (specific selectors) ──────────────
    const commentReplySelectors = [
        'shreddit-post-comment-button',
        'shreddit-comment-reply-button',
        '[data-post-click-location="comments-button"]',
        '[data-post-click-location="reply"]',
        '[data-testid="comments-button"]',
        '[data-testid="reply-button"]',
        'button[aria-label*="reply" i]',
        'button[aria-label*="comment" i]'
    ];

    for (const ctx of contexts) {
        for (const sel of commentReplySelectors) {
            const el = ctx.querySelector(sel);
            if (el && el.parentNode && isSafeParent(el.parentNode)) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }
    }

    // Text-walk for Reply — shallow only
    for (const ctx of shallowContexts) {
        const btns = ctx.querySelectorAll('button, [role="button"]');
        for (const b of btns) {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (label.includes('reply') || text === 'reply') {
                if (b.parentNode && isSafeParent(b.parentNode)) {
                    return { parent: b.parentNode, nextSibling: b.nextSibling };
                }
            }
        }
    }

    // ── Priority 4: Vote button group (uses custom element, not internal buttons) ─
    // We target the shreddit-*-vote-button ELEMENT ITSELF as the group reference,
    // never its internal shadow root — that would place our button inside the component.
    const voteGroupSelectors = [
        '.rpl-vote-button-group',
        '[data-post-click-location="vote"]',
        '[data-testid="vote-button-group"]',
        'shreddit-post-vote-button',
        'shreddit-comment-vote-button'
    ];

    for (const ctx of contexts) {
        for (const sel of voteGroupSelectors) {
            const el = ctx.querySelector(sel);
            if (el && el.parentNode && isSafeParent(el.parentNode)) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }
    }

    // Return null — action bar not yet rendered. MutationObserver will retry
    // once the component's shadow DOM is fully hydrated.
    return null;
}


function locateTitleElement(container) {
    if (!container || container.tagName.toLowerCase() === 'shreddit-comment') {
        return null;
    }
    const TITLE_SELECTORS = '[slot="title"], [slot="post-title"], h1[id*="post-title"], [data-testid="post-title"], a[id*="post-title"], h1';
    let el = container.querySelector(TITLE_SELECTORS);
    if (!el && container.shadowRoot) {
        el = container.shadowRoot.querySelector(TITLE_SELECTORS);
    }
    return el;
}

function locateBodyElement(container) {
    if (!container) return null;
    const isComment = container.tagName.toLowerCase() === 'shreddit-comment';

    if (isComment) {
        // Strictly comment content containers (never usernames, flairs, or hovercards)
        const commentSelectors = [
            '[slot="comment"]',
            'div[id$="-comment-rtjson-content"]',
            '[id*="-comment-rtjson-content"]',
            '[data-testid="comment"]'
        ];
        for (const sel of commentSelectors) {
            const el = container.querySelector(sel);
            if (el) return el;
        }
        if (container.shadowRoot) {
            for (const sel of commentSelectors) {
                const el = container.shadowRoot.querySelector(sel);
                if (el) return el;
            }
        }
        return container.querySelector('[slot="comment"] p') || container.querySelector('p');
    }

    // Post body: strictly target post text containers, NEVER author flairs or hovercards
    const postSelectors = [
        '[slot="text-body"]',
        'div[id$="-post-rtjson-content"]',
        '[id*="-post-rtjson-content"]',
        '[data-testid="post-body"]',
        '[slot="blurred"]',
        'shreddit-blurred-container[slot="text-body"]',
        'shreddit-blurred-container'
    ];
    for (const sel of postSelectors) {
        const el = container.querySelector(sel);
        if (el) return el;
    }
    if (container.shadowRoot) {
        for (const sel of postSelectors) {
            const el = container.shadowRoot.querySelector(sel);
            if (el) return el;
        }
    }
    return null;
}

function extractCleanBodyText(bodyEl) {
    if (!bodyEl) return '';
    let text = (bodyEl.innerText || bodyEl.textContent || '');
    // Strip "View spoiler" and "Read more" UI artifacts
    return text.replace(/^\s*View spoiler\s*/i, '')
               .replace(/\s*View spoiler\s*$/i, '')
               .replace(/Read more\s*$/i, '')
               .trim();
}

function parseTranslationResponse(rawText, hasTitle, hasBody) {
    let clean = (rawText || '').trim();
    // Strip markdown code block wrapping if present
    clean = clean.replace(/^```(?:markdown|text)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Regex to match TITLE: and BODY: tags with optional markdown bolding (**, ##, etc.)
    const titleRegex = /(?:^|\n)\s*(?:\*{1,2}|#{1,3}\s*)?TITLE\s*:?\s*(?:\*{1,2})?\s*([\s\S]*?)(?=(?:\r?\n\s*(?:\*{1,2}|#{1,3}\s*)?BODY\s*:?\s*(?:\*{1,2})?)|$)/i;
    const bodyRegex = /(?:^|\n)\s*(?:\*{1,2}|#{1,3}\s*)?BODY\s*:?\s*(?:\*{1,2})?\s*([\s\S]*)$/i;

    const titleMatch = clean.match(titleRegex);
    const bodyMatch = clean.match(bodyRegex);

    if (hasTitle && hasBody) {
        if (titleMatch && bodyMatch) {
            return {
                title: titleMatch[1].trim(),
                body: bodyMatch[1].trim()
            };
        }
        if (titleMatch && !bodyMatch) {
            return {
                title: titleMatch[1].trim(),
                body: clean.replace(titleRegex, '').trim()
            };
        }
        // Fallback: split on double newline (paragraph break) if labels omitted
        const parts = clean.split(/\n\s*\n/);
        if (parts.length > 1) {
            return {
                title: parts[0].trim(),
                body: parts.slice(1).join('\n\n').trim()
            };
        }
        return {
            title: clean,
            body: ''
        };
    } else if (hasTitle && !hasBody) {
        // Single title-only post: if model generated TITLE: ... and BODY: ..., merge cleanly without labels
        if (titleMatch) {
            const titlePart = titleMatch[1].trim();
            const bodyPart = bodyMatch ? bodyMatch[1].trim() : '';
            const combined = bodyPart ? `${titlePart} ${bodyPart}` : titlePart;
            return {
                title: combined.replace(/^(?:\*{1,2})?TITLE\s*:?\s*(?:\*{1,2})?\s*/i, '').trim(),
                body: ''
            };
        }
        return {
            title: clean.replace(/^(?:\*{1,2})?TITLE\s*:?\s*(?:\*{1,2})?\s*/i, '').trim(),
            body: ''
        };
    } else {
        // Body-only (comment or post without title)
        return {
            title: '',
            body: clean.replace(/^(?:\*{1,2})?BODY\s*:?\s*(?:\*{1,2})?\s*/i, '').trim()
        };
    }
}

function injectActionBarButton(container) {
    // Inject styles into container shadowRoot if present so keyframes exist in shadow boundary
    if (container.shadowRoot) {
        ensureGlobalStyles(container.shadowRoot);
    }

    // Handle Reddit SPA dynamic post updates
    const currentPermalink = container.getAttribute('permalink') || '';
    if (container.dataset.vibePermalink && container.dataset.vibePermalink !== currentPermalink) {
        container.removeAttribute('data-vibe-injected');
        if (container.__vibeBtn) {
            container.__vibeBtn.remove();
            container.__vibeBtn = null;
        }
    }
    if (currentPermalink) {
        container.dataset.vibePermalink = currentPermalink;
    }

    // Guard against duplicate injections on this container
    if (container.hasAttribute('data-vibe-injected')) {
        return;
    }

    const titleAttr = container.getAttribute('post-title') || '';
    let titleEl = locateTitleElement(container);
    let textBody = locateBodyElement(container);

    const originalTitleText = titleAttr.trim() || (titleEl && titleEl.innerText.trim()) || '';
    const initialBodyText = extractCleanBodyText(textBody);

    const hasTitle = Boolean(originalTitleText);
    const hasInitialBody = Boolean(initialBodyText);

    if (!hasTitle && !hasInitialBody && !textBody) return;

    // Find action bar placement
    const targetPlacement = findBestActionBarTarget(container);
    if (!targetPlacement || !targetPlacement.parent) {
        return; // Component action bar not fully rendered yet
    }

    // Check if the target parent already has a direct Vibe button
    if (targetPlacement.parent.querySelector && targetPlacement.parent.querySelector(':scope > .vibe-translate-action-btn')) {
        container.setAttribute('data-vibe-injected', 'true');
        return;
    }

    // Ensure styles exist in placement shadow root if placed inside one
    if (targetPlacement.parent.getRootNode && targetPlacement.parent.getRootNode() instanceof ShadowRoot) {
        ensureGlobalStyles(targetPlacement.parent.getRootNode());
    }

    // Create the button
    const btn = document.createElement('button');
    btn.className = 'vibe-translate-action-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Translate Vibe into regional slang');

    btn.innerHTML = `
        <svg class="vibe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; flex-shrink: 0;">
            <path d="M5 8l6 6"></path>
            <path d="M4 14l6-6 2-3"></path>
            <path d="M2 5h12"></path>
            <path d="M7 2h1"></path>
            <path d="M22 22l-5-10-5 10"></path>
            <path d="M14 18h6"></path>
        </svg>
        <span class="vibe-btn-text" style="font-weight: 600; font-size: 12px; line-height: 1;">Translate Vibe</span>
    `;

    // Inline styling ensures appearance matches regardless of Shadow DOM context
    btn.style.cssText = `
        background: var(--color-neutral-background-weak, rgba(0, 0, 0, 0.05));
        color: var(--color-neutral-content-strong, #1c1c1c);
        border: none;
        border-radius: 9999px;
        padding: 0 12px;
        height: 32px;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
        margin-left: 8px;
        vertical-align: middle;
        white-space: nowrap;
        user-select: none;
        position: relative;
        z-index: 2;
    `;

    let translatedTitle = '';
    let translatedBody = '';
    let isShowingTranslated = false;
    let translatedDiv = null;

    btn.addEventListener('mouseenter', () => {
        if (!isShowingTranslated) {
            btn.style.backgroundColor = 'var(--color-neutral-background-hover, rgba(0, 0, 0, 0.08))';
        }
    });

    btn.addEventListener('mouseleave', () => {
        if (!isShowingTranslated) {
            btn.style.backgroundColor = 'var(--color-neutral-background-weak, rgba(0, 0, 0, 0.05))';
        }
    });

    // Use capture:true so our handler fires BEFORE Reddit's card-level capture listener.
    // stopImmediatePropagation() prevents Reddit's navigation handler from running at all.
    btn.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        const textSpan = btn.querySelector('.vibe-btn-text');
        if (!titleEl && hasTitle) {
            titleEl = locateTitleElement(container);
        }

        // Toggle state once translated
        if (translatedTitle || translatedBody) {
            if (isShowingTranslated) {
                // Restore original
                if (hasTitle && titleEl) {
                    titleEl.innerText = originalTitleText;
                }
                if (container.hasAttribute('post-title')) {
                    container.setAttribute('post-title', originalTitleText);
                }
                if (textBody) textBody.style.display = '';
                if (translatedDiv) translatedDiv.style.display = 'none';

                textSpan.innerText = 'Translate Vibe';
                btn.style.color = 'var(--color-neutral-content-strong, #1c1c1c)';
                btn.style.backgroundColor = 'var(--color-neutral-background-weak, rgba(0, 0, 0, 0.05))';
                btn.classList.remove('vibe-active');
                isShowingTranslated = false;
                return;
            } else {
                // Before showing cached title-only translation, check if body content has newly appeared
                // (e.g. user unfolded a spoiler after a prior title-only translation).
                if (translatedTitle && !translatedBody) {
                    const freshBody = locateBodyElement(container);
                    const freshBodyText = extractCleanBodyText(freshBody);
                    if (freshBodyText) {
                        // Body is now available — reset cache so we fall through to full translate
                        textBody = freshBody;
                        translatedTitle = '';
                        translatedBody = '';
                        if (titleEl) titleEl.innerText = originalTitleText;
                        if (container.hasAttribute('post-title')) {
                            container.setAttribute('post-title', originalTitleText);
                        }
                        // Fall through to fresh translation below
                    } else {
                        // Show cached title-only translation
                        if (hasTitle && titleEl && translatedTitle) {
                            titleEl.innerText = translatedTitle;
                        }
                        if (container.hasAttribute('post-title') && translatedTitle) {
                            container.setAttribute('post-title', translatedTitle);
                        }
                        textSpan.innerText = 'Show Original';
                        btn.style.color = '#24a0ed';
                        btn.style.backgroundColor = 'rgba(36, 160, 237, 0.12)';
                        btn.classList.add('vibe-active');
                        isShowingTranslated = true;
                        return;
                    }
                } else {
                    // Show cached translation
                    if (hasTitle && titleEl && translatedTitle) {
                        titleEl.innerText = translatedTitle;
                    }
                    if (container.hasAttribute('post-title') && translatedTitle) {
                        container.setAttribute('post-title', translatedTitle);
                    }
                    if (translatedBody) {
                        if (textBody) textBody.style.display = 'none';
                        if (translatedDiv) translatedDiv.style.display = 'block';
                    }
                    textSpan.innerText = 'Show Original';
                    btn.style.color = '#24a0ed';
                    btn.style.backgroundColor = 'rgba(36, 160, 237, 0.12)';
                    btn.classList.add('vibe-active');
                    isShowingTranslated = true;
                    return;
                }
            }
        }

        // Re-evaluate body at click time (feed cards load body content lazily or spoiler unfolded)
        const freshBody = locateBodyElement(container);
        if (freshBody) {
            textBody = freshBody;
        }
        const freshBodyText = extractCleanBodyText(textBody);
        const hasBodyNow = Boolean(freshBodyText);

        if (!hasTitle && !hasBodyNow) return;

        // Prepare text to translate
        let textToTranslate = '';
        if (hasTitle && !hasBodyNow) {
            textToTranslate = originalTitleText;
        } else if (!hasTitle && hasBodyNow) {
            textToTranslate = freshBodyText;
        } else {
            textToTranslate = "TITLE: " + originalTitleText + "\n\nBODY: " + freshBodyText;
        }

        // Guard against invalidated extension context (e.g. extension was reloaded in chrome://extensions but page was not refreshed)
        if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
            textSpan.innerText = 'Refresh Tab';
            btn.style.color = '#ff4500';
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('vibe-processing');
            console.warn("Vibe Translator extension context was invalidated or updated. Please refresh this Reddit tab (F5).");
            return;
        }

        // Animate processing state
        textSpan.innerText = 'Translating...';
        btn.style.pointerEvents = 'none';
        btn.classList.add('vibe-processing');

        if (titleEl) titleEl.classList.add('vibe-text-processing');
        if (textBody) textBody.classList.add('vibe-text-processing');

        try {
            chrome.runtime.sendMessage({ action: "fetch_gemini", text: textToTranslate }, (response) => {
                if (titleEl) titleEl.classList.remove('vibe-text-processing');
                if (textBody) textBody.classList.remove('vibe-text-processing');

                btn.style.pointerEvents = 'auto';
                btn.classList.remove('vibe-processing');

                if (chrome.runtime?.lastError) {
                    textSpan.innerText = 'Failed';
                    btn.style.color = '#d93a00';
                    console.error("Vibe translation error:", chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.translated) {
                    const parsed = parseTranslationResponse(response.translated, hasTitle, hasBodyNow);

                    if (hasTitle && parsed.title) {
                        translatedTitle = parsed.title;
                        if (titleEl) titleEl.innerText = translatedTitle;
                        if (container.hasAttribute('post-title')) {
                            container.setAttribute('post-title', translatedTitle);
                        }
                    }

                    if (hasBodyNow && parsed.body) {
                        translatedBody = parsed.body;
                        if (!translatedDiv) {
                            translatedDiv = document.createElement('div');
                            translatedDiv.className = 'vibe-translated-text-body';
                            const slotName = textBody.getAttribute('slot');
                            if (slotName) translatedDiv.setAttribute('slot', slotName);
                            if (textBody.parentNode) {
                                textBody.parentNode.insertBefore(translatedDiv, textBody.nextSibling);
                            }
                        }
                        translatedDiv.innerText = translatedBody;
                        translatedDiv.style.display = 'block';
                        textBody.style.display = 'none';
                    }

                    textSpan.innerText = 'Show Original';
                    btn.style.color = '#24a0ed';
                    btn.style.backgroundColor = 'rgba(36, 160, 237, 0.12)';
                    btn.classList.add('vibe-active');
                    isShowingTranslated = true;
                } else {
                    textSpan.innerText = 'Failed';
                    btn.style.color = '#d93a00';
                    console.error("Vibe translation failed:", response?.error || "Unknown error");
                }
            });
        } catch (err) {
            if (titleEl) titleEl.classList.remove('vibe-text-processing');
            if (textBody) textBody.classList.remove('vibe-text-processing');
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('vibe-processing');
            textSpan.innerText = 'Refresh Tab';
            btn.style.color = '#ff4500';
            console.error("Extension runtime error (please refresh page):", err);
        }
    }, { capture: true });

    // Mount the button
    if (targetPlacement.nextSibling) {
        targetPlacement.parent.insertBefore(btn, targetPlacement.nextSibling);
    } else {
        targetPlacement.parent.appendChild(btn);
    }

    container.__vibeBtn = btn;
    container.setAttribute('data-vibe-injected', 'true');
}

// Debounced observer to process posts and comments
let isScheduled = false;
function processAllContainers() {
    // Only target the canonical Shreddit web components — never <article> or generic
    // containers, as shreddit-post is nested inside article on the feed and would
    // cause duplicate button injection.
    const posts = document.querySelectorAll('shreddit-post');
    posts.forEach(post => injectActionBarButton(post));

    const comments = document.querySelectorAll('shreddit-comment');
    comments.forEach(comment => injectActionBarButton(comment));

    isScheduled = false;
}

const observer = new MutationObserver(() => {
    if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(processAllContainers);
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial pass on script execution
processAllContainers();

// Timed retry passes — shreddit-comment shadow DOMs hydrate asynchronously after
// the element is inserted into the light DOM. MutationObserver only watches light DOM,
// so it never re-fires when Lit renders the shadow. These retries catch components
// that weren't ready on the initial pass or observer trigger.
// data-vibe-injected guards against duplicates.
[300, 800, 1500, 3000].forEach(delay => {
    setTimeout(processAllContainers, delay);
});