// popup.js - Vibe Translator SaaS Popup Controller with Google Login Gate

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const statusMsg = document.getElementById('status-msg');

    // Login Elements (Google OAuth Only - Secure)
    const googleLoginBtn = document.getElementById('google-login-btn');

    // App View Elements
    const userEmailDisplay = document.getElementById('user-email-display');
    const accountAvatar = document.getElementById('account-avatar');
    const btnSignout = document.getElementById('btn-signout');
    const langSelect = document.getElementById('target-language-select');

    // Quota Elements
    const quotaCard = document.getElementById('quota-card');
    const quotaProgress = document.getElementById('quota-progress');
    const quotaUsedText = document.getElementById('quota-used-text');
    const quotaBadge = document.getElementById('quota-badge');

    // Upgrade Elements
    const upgradeCard = document.getElementById('upgrade-card');
    const upgradeBtn = document.getElementById('upgrade-btn');
    const proActiveCard = document.getElementById('pro-active-card');
    const proBadgeTitle = document.getElementById('pro-badge-title');
    const proAccountInfo = document.getElementById('pro-account-info');

    const MAX_DAILY_TRIALS = 5;
    const upgradeUrl = (typeof CONFIG_UPGRADE_URL !== 'undefined' && CONFIG_UPGRADE_URL) 
        ? CONFIG_UPGRADE_URL 
        : 'https://kasyhq.com/vibe-translator#pricing';

    const GOOGLE_OAUTH_CLIENT_ID = '952360719209-f5b4439hpqhiacc2nla3vfa7pcog3pk9.apps.googleusercontent.com';
    const GOOGLE_REDIRECT_URI = 'https://kasyhq.com';

    function getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    let statusTimer = null;
    function showStatus(text, type = 'info', autoClear = false) {
        if (!statusMsg) return;
        if (!text) {
            statusMsg.className = 'status-msg';
            statusMsg.innerText = '';
            return;
        }
        statusMsg.innerText = text;
        statusMsg.className = `status-msg active status-${type}`;
        if (statusTimer) clearTimeout(statusTimer);
        if (autoClear) {
            statusTimer = setTimeout(() => {
                statusMsg.className = 'status-msg';
                statusMsg.innerText = '';
            }, 3500);
        }
    }

    const VIP_PREMIUM_EMAILS = [
        'anadisyagnik@gmail.com'
    ];

    // Refresh UI based on authentication state
    function refreshUI() {
        chrome.storage.sync.get(['userEmail', 'isPremium', 'targetLanguage', 'userName'], (syncData) => {
            const userEmail = (syncData.userEmail || '').trim().toLowerCase();
            const isOwner = userEmail ? VIP_PREMIUM_EMAILS.includes(userEmail) : false;
            const isPro = !!syncData.isPremium || isOwner;

            if (userEmail && isOwner && !syncData.isPremium) {
                chrome.storage.sync.set({ userEmail: userEmail, isPremium: true });
            }

            if (!userEmail) {
                // Not logged in -> Show Google Login Gate
                if (loginView) loginView.style.display = 'block';
                if (appView) appView.style.display = 'none';
                showStatus('');
                return;
            }

            // Logged in -> Show Main App
            if (loginView) loginView.style.display = 'none';
            if (appView) appView.style.display = 'block';
            showStatus('');

            if (userEmailDisplay) {
                userEmailDisplay.innerText = userEmail;
            }

            if (accountAvatar) {
                const initial = (syncData.userName || userEmail || 'U').charAt(0).toUpperCase();
                accountAvatar.innerText = initial;
            }

            if (syncData.targetLanguage && langSelect) {
                langSelect.value = syncData.targetLanguage;
            }

            if (isPro) {
                // PRO TIER: Hide quota meter and upgrade cards entirely
                if (quotaCard) quotaCard.style.display = 'none';
                if (upgradeCard) upgradeCard.style.display = 'none';
                if (proActiveCard) proActiveCard.style.display = 'block';

                if (proBadgeTitle) {
                    proBadgeTitle.innerText = isOwner ? 'Founder Pro' : 'Vibe Pro Active';
                }

                if (proAccountInfo) {
                    proAccountInfo.innerText = isOwner 
                        ? 'Founder Lifetime Access • Unlimited priority translations'
                        : 'Pro Membership Active • Unlimited priority translations';
                }
            } else {
                // FREE TIER: Show quota meter and upgrade CTA
                if (proActiveCard) proActiveCard.style.display = 'none';
                if (quotaCard) quotaCard.style.display = 'block';
                if (upgradeCard) upgradeCard.style.display = 'block';

                const today = getTodayKey();
                chrome.storage.local.get(['usageDate', 'usageCount'], (localData) => {
                    const count = (localData.usageDate === today) ? (localData.usageCount || 0) : 0;
                    const remaining = Math.max(0, MAX_DAILY_TRIALS - count);
                    const percentage = Math.min(100, Math.round((count / MAX_DAILY_TRIALS) * 100));

                    if (quotaProgress) {
                        quotaProgress.style.width = `${percentage}%`;
                        quotaProgress.style.background = count >= MAX_DAILY_TRIALS ? '#ef4444' : '#ff5722';
                    }
                    if (quotaUsedText) {
                        quotaUsedText.innerText = `${count} / ${MAX_DAILY_TRIALS} used today (${remaining} left)`;
                    }
                    if (quotaBadge) {
                        if (remaining === 0) {
                            quotaBadge.innerText = 'Limit Reached (5/5)';
                            quotaBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                            quotaBadge.style.color = '#ef4444';
                        } else {
                            quotaBadge.innerText = `${remaining} Free Left`;
                            quotaBadge.style.background = 'rgba(255, 87, 34, 0.12)';
                            quotaBadge.style.color = '#ff7043';
                        }
                    }
                });
            }
        });
    }

    // Initialize UI
    refreshUI();

    // ── Native Google OAuth Window ──
    function launchGoogleOAuth() {
        return new Promise((resolve, reject) => {
            const authUrl =
                `https://accounts.google.com/o/oauth2/v2/auth` +
                `?client_id=${encodeURIComponent(GOOGLE_OAUTH_CLIENT_ID)}` +
                `&response_type=token` +
                `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
                `&scope=${encodeURIComponent('openid email profile')}` +
                `&prompt=select_account` +
                `&include_granted_scopes=true`;

            const width = 520;
            const height = 630;
            const left = (typeof screen !== 'undefined' && screen.width) ? Math.max(0, Math.round((screen.width - width) / 2)) : 100;
            const top = (typeof screen !== 'undefined' && screen.height) ? Math.max(0, Math.round((screen.height - height) / 2)) : 100;

            let popupWinId = null;
            let isResolved = false;

            function cleanup() {
                if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onUpdated) {
                    chrome.tabs.onUpdated.removeListener(onTabUpdateListener);
                }
                if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.onRemoved) {
                    chrome.windows.onRemoved.removeListener(onWinRemoveListener);
                }
            }

            function checkUrlAndResolve(checkUrl) {
                if (checkUrl && (checkUrl.startsWith(GOOGLE_REDIRECT_URI) || checkUrl.includes('access_token='))) {
                    isResolved = true;
                    cleanup();

                    try {
                        const rawUrl = new URL(checkUrl);
                        const hashParams = new URLSearchParams(rawUrl.hash ? rawUrl.hash.slice(1) : '');
                        const searchParams = rawUrl.searchParams;
                        const token = hashParams.get('access_token') || searchParams.get('access_token');
                        const errStr = hashParams.get('error') || searchParams.get('error');

                        if (popupWinId) {
                            chrome.windows.remove(popupWinId, () => {});
                        }

                        if (token) resolve(token);
                        else if (errStr) reject(new Error(`OAuth notice: ${errStr}`));
                        else reject(new Error('Sign-in cancelled'));
                    } catch (e) {
                        if (popupWinId) chrome.windows.remove(popupWinId, () => {});
                        reject(new Error('Invalid OAuth redirect URL format'));
                    }
                    return true;
                }
                return false;
            }

            function onTabUpdateListener(tabId, changeInfo, tab) {
                const checkUrl = changeInfo.url || (tab && tab.url);
                if (checkUrl) {
                    checkUrlAndResolve(checkUrl);
                } else if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
                    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.get) {
                        chrome.tabs.get(tabId, (t) => {
                            if (t && t.url) checkUrlAndResolve(t.url);
                        });
                    }
                }
            }

            function onWinRemoveListener(winId) {
                if (winId === popupWinId) {
                    cleanup();
                    if (!isResolved) {
                        reject(new Error('Sign-in window closed'));
                    }
                }
            }

            if (typeof chrome !== 'undefined' && chrome.windows && typeof chrome.windows.create === 'function') {
                chrome.windows.create({
                    url: authUrl,
                    type: 'popup',
                    width: width,
                    height: height,
                    left: left,
                    top: top,
                    focused: true
                }, (win) => {
                    if (chrome.runtime.lastError || !win) {
                        reject(chrome.runtime.lastError || new Error('Failed to open authentication window'));
                        return;
                    }
                    popupWinId = win.id;
                    chrome.tabs.onUpdated.addListener(onTabUpdateListener);
                    chrome.windows.onRemoved.addListener(onWinRemoveListener);
                });
            } else {
                chrome.tabs.create({ url: `${upgradeUrl}&auth=google&source=extension` });
                resolve(null);
            }
        });
    }

    // 1-Click "Continue with Google"
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            showStatus('Connecting with Google…', 'info');
            googleLoginBtn.disabled = true;
            try {
                const token = await launchGoogleOAuth();
                if (!token) return;

                showStatus('Retrieving Google profile…', 'info');
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!userRes.ok) {
                    throw new Error('Failed to retrieve Google profile');
                }

                const profile = await userRes.json();
                const email = (profile.email || '').trim().toLowerCase();
                if (!email) throw new Error('No email found in Google account');

                await handleGoogleAuthenticatedUser(email, profile.name);
            } catch (err) {
                console.warn('[Vibe Auth Notice]:', err.message);
                showStatus(err.message === 'Sign-in window closed' ? 'Sign-in cancelled' : err.message, 'error');
            } finally {
                googleLoginBtn.disabled = false;
            }
        });
    }

    // Google OAuth Authenticated User Handler & Strict Product Decoupled Check
    async function handleGoogleAuthenticatedUser(email, displayName = '') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            showStatus('Invalid Google account email.', 'error');
            return;
        }

        // ONLY anadisyagnik@gmail.com is Founder VIP
        const isOwner = VIP_PREMIUM_EMAILS.includes(cleanEmail);
        if (isOwner) {
            chrome.storage.sync.remove('userLoggedOut', () => {
                chrome.storage.sync.set({ userEmail: cleanEmail, isPremium: true, userName: displayName }, () => {
                    showStatus(`Welcome, Founder (${cleanEmail})! Unlimited Pro Active.`, 'success');
                    refreshUI();
                });
            });
            return;
        }

        showStatus('Verifying license with kasyhq.com...', 'info');

        const endpoint = (typeof CONFIG_SUBSCRIPTION_ENDPOINT !== 'undefined' && CONFIG_SUBSCRIPTION_ENDPOINT)
            ? CONFIG_SUBSCRIPTION_ENDPOINT
            : 'https://kasyhq.com/api/subscription';

        try {
            // Decoupled query: product=VIBE ensures Vibe Translator checks only its own subscription
            const res = await fetch(`${endpoint}?email=${encodeURIComponent(cleanEmail)}&product=VIBE&_t=${Date.now()}`);
            const data = await res.json();

            // STRICT DECOUPLING: Must be PREMIUM plan AND product must be VIBE (or ALL). GST users will NOT get Pro!
            const prod = String(data?.product || data?.requestedProduct || '').toUpperCase();
            const isVibeProduct = (prod === 'VIBE' || prod === 'VIBE_TRANSLATOR' || prod === 'ALL');
            const isPro = data && (String(data.plan).toUpperCase() === 'PREMIUM' || String(data.plan).toUpperCase() === 'PRO') && isVibeProduct;

            chrome.storage.sync.remove('userLoggedOut', () => {
                chrome.storage.sync.set({
                    userEmail: cleanEmail,
                    userName: displayName,
                    isPremium: isPro
                }, () => {
                    showStatus(isPro ? `Welcome back! Unlimited Pro Active.` : `Welcome, ${cleanEmail}! 5 free daily translations unlocked.`, 'success');
                    refreshUI();
                });
            });
        } catch (err) {
            // Save email even if offline so user can access free tier
            chrome.storage.sync.remove('userLoggedOut', () => {
                chrome.storage.sync.set({ userEmail: cleanEmail, userName: displayName, isPremium: false }, () => {
                    showStatus(`Welcome, ${cleanEmail}!`, 'success');
                    refreshUI();
                });
            });
        }
    }

    // Sign Out
    if (btnSignout) {
        btnSignout.addEventListener('click', () => {
            chrome.storage.sync.set({ userLoggedOut: true }, () => {
                chrome.storage.sync.remove(['userEmail', 'isPremium', 'userName'], () => {
                    showStatus('Signed out successfully.', 'info', true);
                    refreshUI();
                });
            });
        });
    }

    // Upgrade CTA click
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: upgradeUrl });
        });
    }

    // Target language switcher
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            const selectedLang = langSelect.value;
            const selectedName = langSelect.options[langSelect.selectedIndex].text;
            chrome.storage.sync.set({ targetLanguage: selectedLang }, () => {
                showStatus(`Translation dialect set to ${selectedName}`, 'success', true);
            });

            try {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs && tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "vibe_language_changed",
                            targetLanguage: selectedLang
                        }).catch(() => {});
                    }
                });
            } catch (err) {}
        });
    }
});
