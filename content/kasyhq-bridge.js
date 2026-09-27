// ═══════════════════════════════════════════════════════════════
//  Vibe Translator — kasyhq.com Bridge Content Script
//  © 2026 KasyHQ. All Rights Reserved.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (window.__vibeBridgeLoaded) return;
  window.__vibeBridgeLoaded = true;

  console.log('[Vibe Translator Bridge] Bridge active on', location.origin);

  // 1. Check if user email is stored in local storage (only if user has not explicitly signed out)
  function checkStoredEmail() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['userLoggedOut', 'userEmail'], (data) => {
          if (data && data.userLoggedOut) return;
          if (data && data.userEmail) return; // already logged in
          const email = localStorage.getItem('vibe_user_email') || localStorage.getItem('rp_user_email');
          if (email && typeof email === 'string' && email.includes('@')) {
            chrome.runtime.sendMessage({
              type: 'SYNC_USER_EMAIL',
              request: 'sync-user-email',
              email: email.trim().toLowerCase(),
              source: 'kasyhq-localstorage'
            }).catch(() => {});
          }
        });
      }
    } catch (_) {}
  }

  checkStoredEmail();

  // 2. Listen to real-time window postMessage broadcasts from kasyhq.com auth
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    if (event.source !== window) return;

    const data = event.data;
    if (!data) return;

    // Support both kasyhq-studio and audit-tool-web message envelopes
    if (data.source === 'kasyhq-studio' || data.source === 'audit-tool-web') {
      const email = data.email || data.userEmail || (data.user && data.user.email);
      if (email && typeof email === 'string' && email.includes('@')) {
        console.log('[Vibe Translator Bridge] Forwarding auth broadcast to extension:', email);
        chrome.runtime.sendMessage({
          type: 'SYNC_USER_EMAIL',
          request: 'sync-user-email',
          email: email.trim().toLowerCase(),
          source: 'kasyhq-broadcast'
        }).then((res) => {
          console.log('[Vibe Translator Bridge] Extension sync response:', res);
        }).catch((err) => {
          console.warn('[Vibe Translator Bridge] Extension communication notice:', err.message);
        });
      }
    }
  });
})();
