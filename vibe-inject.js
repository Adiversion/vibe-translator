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

    // Priority 1: Native Share button
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
            if (el && el.parentNode) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }

        // Text match for Share button (e.g., <button><span>Share</span></button>)
        const buttons = ctx.querySelectorAll('button, [role="button"], a');
        for (const b of buttons) {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (label === 'share' || text === 'share') {
                if (b.parentNode) {
                    return { parent: b.parentNode, nextSibling: b.nextSibling };
                }
            }
        }
    }

    // Priority 2: Comment or Reply button
    const commentReplySelectors = [
        'shreddit-post-comment-button',
        'shreddit-comment-reply-button',
        '[data-post-click-location="comments-button"]',
        '[data-post-click-location="reply"]',
        '[data-testid="comments-button"]',
        '[data-testid="reply-button"]',
        'a[href*="/comments/"]',
        'button[aria-label*="reply" i]',
        'button[aria-label*="comment" i]'
    ];

    for (const ctx of contexts) {
        for (const sel of commentReplySelectors) {
            const el = ctx.querySelector(sel);
            if (el && el.parentNode) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }

        const buttons = ctx.querySelectorAll('button, [role="button"], a');
        for (const b of buttons) {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (label.includes('reply') || text === 'reply' || text.includes('comments')) {
                if (b.parentNode) {
                    return { parent: b.parentNode, nextSibling: b.nextSibling };
                }
            }
        }
    }

    // Priority 3: Award button
    for (const ctx of contexts) {
        const awardBtn = ctx.querySelector('button[aria-label*="award" i], [data-testid="award-button"]');
        if (awardBtn && awardBtn.parentNode) {
            return { parent: awardBtn.parentNode, nextSibling: awardBtn.nextSibling };
        }
        const buttons = ctx.querySelectorAll('button, [role="button"], a');
        for (const b of buttons) {
            const text = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (text === 'award') {
                if (b.parentNode) {
                    return { parent: b.parentNode, nextSibling: b.nextSibling };
                }
            }
        }
    }

    // Priority 4: Vote button group (places sibling AFTER the group, never inside)
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
            if (el && el.parentNode) {
                return { parent: el.parentNode, nextSibling: el.nextSibling };
            }
        }

        const upvoteBtn = ctx.querySelector('button[aria-label*="upvote" i], button[aria-label*="up" i]');
        if (upvoteBtn) {
            const group = upvoteBtn.closest('div[role="group"]') || upvoteBtn.parentNode;
            if (group && group.parentNode) {
                return { parent: group.parentNode, nextSibling: group.nextSibling };
            }
        }
    }

    // Priority 5: Action row or toolbar container
    const rowSelectors = [
        'shreddit-post-action-row',
        'shreddit-comment-action-row',
        'shreddit-async-action-row',
        '[slot="action-row"]',
        '[data-testid="action-row"]',
        '[data-testid="post-action-row"]',
        '[data-testid="seeker-action-row"]'
    ];

    for (const ctx of contexts) {
        for (const sel of rowSelectors) {
            const row = ctx.querySelector(sel);
            if (row) {
                const target = row.shadowRoot || row;
                return { parent: target, nextSibling: null };
            }
        }
    }

    return null;
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

    const contexts = getContainerContexts(container);
    const findInContexts = (selector) => {
        for (const ctx of contexts) {
            const el = ctx.querySelector(selector);
            if (el) return el;
        }
        return null;
    };

    // Locate Title and Body
    const titleAttr = container.getAttribute('post-title') || '';
    const titleEl = findInContexts('[slot="title"], [slot="post-title"], h1[id*="post-title"], h1, h2, h3, [data-testid="post-title"], a[id*="post-title"]');

    // Locate text body: supports post bodies and comment text
    let textBody = findInContexts(
        '[slot="comment"], [slot="text-body"], [id*="-comment-rtjson-content"], [id*="-post-rtjson-content"], [data-testid="comment"], [data-testid="post-body"], .md, [data-post-click-location="text-body"], [slot="body"]'
    );

    // Additional fallback for comments with paragraph content
    if (!textBody && container.tagName.toLowerCase() === 'shreddit-comment') {
        textBody = container.querySelector('[slot="comment"] p') || container.querySelector('p');
    }

    const originalTitleText = (titleEl && titleEl.innerText.trim()) || titleAttr.trim();
    const hasTitle = Boolean(originalTitleText);
    const hasBody = Boolean(textBody && textBody.innerText.trim());

    if (!hasTitle && !hasBody) return;

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
    btn.setAttribute('aria-label', 'Translate Vibe to Hinglish');

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

    const getBodyParagraphs = () => {
        if (!textBody) return [];
        const nodes = Array.from(textBody.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote'));
        return nodes.length > 0 ? nodes : [textBody];
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const textSpan = btn.querySelector('.vibe-btn-text');
        const bodyParagraphs = getBodyParagraphs();

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
                bodyParagraphs.forEach(el => el.style.display = '');
                if (translatedDiv) translatedDiv.style.display = 'none';

                textSpan.innerText = 'Translate Vibe';
                btn.style.color = 'var(--color-neutral-content-strong, #1c1c1c)';
                btn.style.backgroundColor = 'var(--color-neutral-background-weak, rgba(0, 0, 0, 0.05))';
                btn.classList.remove('vibe-active');
                isShowingTranslated = false;
            } else {
                // Show translated
                if (hasTitle && titleEl && translatedTitle) {
                    titleEl.innerText = translatedTitle;
                }
                if (container.hasAttribute('post-title') && translatedTitle) {
                    container.setAttribute('post-title', translatedTitle);
                }
                if (translatedBody) {
                    bodyParagraphs.forEach(el => el.style.display = 'none');
                    if (translatedDiv) translatedDiv.style.display = 'block';
                }
                textSpan.innerText = 'Show Original';
                btn.style.color = '#24a0ed';
                btn.style.backgroundColor = 'rgba(36, 160, 237, 0.12)';
                btn.classList.add('vibe-active');
                isShowingTranslated = true;
            }
            return;
        }

        // Prepare text to translate
        let textToTranslate = '';
        if (hasTitle && !hasBody) {
            textToTranslate = originalTitleText;
        } else if (!hasTitle && hasBody) {
            textToTranslate = textBody.innerText.replace(/Read more\s*$/i, '').trim();
        } else {
            textToTranslate = "TITLE: " + originalTitleText + "\n\nBODY: " + textBody.innerText.replace(/Read more\s*$/i, '').trim();
        }

        // Animate processing state
        textSpan.innerText = 'Translating...';
        btn.style.pointerEvents = 'none';
        btn.classList.add('vibe-processing');

        if (titleEl) titleEl.classList.add('vibe-text-processing');
        bodyParagraphs.forEach(el => el.classList.add('vibe-text-processing'));

        chrome.runtime.sendMessage({ action: "fetch_gemini", text: textToTranslate }, (response) => {
            if (titleEl) titleEl.classList.remove('vibe-text-processing');
            bodyParagraphs.forEach(el => el.classList.remove('vibe-text-processing'));

            btn.style.pointerEvents = 'auto';
            btn.classList.remove('vibe-processing');

            if (response && response.translated) {
                const fullTranslated = response.translated.trim();

                if (hasTitle && !hasBody) {
                    // Post with title only (image / media posts)
                    translatedTitle = fullTranslated;
                    if (titleEl) titleEl.innerText = translatedTitle;
                    if (container.hasAttribute('post-title')) {
                        container.setAttribute('post-title', translatedTitle);
                    }
                } else if (!hasTitle && hasBody) {
                    // Comment or post with body only
                    translatedBody = fullTranslated;
                    translatedDiv = document.createElement('div');
                    translatedDiv.className = 'vibe-translated-text-body';
                    translatedDiv.innerText = translatedBody;

                    // Insert inside or after textBody
                    if (textBody.appendChild && textBody !== container) {
                        textBody.appendChild(translatedDiv);
                    } else if (textBody.parentNode) {
                        textBody.parentNode.insertBefore(translatedDiv, textBody.nextSibling);
                    }
                    bodyParagraphs.forEach(el => el.style.display = 'none');
                } else {
                    // Both title and body present
                    const titleMatch = fullTranslated.match(/^TITLE:\s*(.*?)(?=\n\s*BODY:|$)/is);
                    const bodyMatch = fullTranslated.match(/\n\s*BODY:\s*(.*)/is);

                    if (titleMatch && bodyMatch) {
                        translatedTitle = titleMatch[1].trim();
                        translatedBody = bodyMatch[1].trim();
                        if (titleEl) titleEl.innerText = translatedTitle;
                        if (container.hasAttribute('post-title')) {
                            container.setAttribute('post-title', translatedTitle);
                        }
                    } else {
                        translatedBody = fullTranslated;
                    }

                    translatedDiv = document.createElement('div');
                    translatedDiv.className = 'vibe-translated-text-body';
                    translatedDiv.innerText = translatedBody;

                    if (textBody.appendChild && textBody !== container) {
                        textBody.appendChild(translatedDiv);
                    } else if (textBody.parentNode) {
                        textBody.parentNode.insertBefore(translatedDiv, textBody.nextSibling);
                    }
                    bodyParagraphs.forEach(el => el.style.display = 'none');
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
    });

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
    // 1. Process main posts
    const posts = document.querySelectorAll('shreddit-post, article, [data-testid="post-container"]');
    posts.forEach(post => injectActionBarButton(post));

    // 2. Process all comments
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