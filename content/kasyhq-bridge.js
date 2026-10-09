// ═══════════════════════════════════════════════════════════════
//  Vibe Translator — kasyhq.com Bridge Content Script
//  © 2026 KasyHQ. All Rights Reserved.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (window.__vibeBridgeLoaded) return;
  window.__vibeBridgeLoaded = true;

  console.log('[Vibe Translator Bridge] Bridge active on', location.origin);

  let tokenSent = false;

  // 1. Inspect URL parameters and hash for Google OAuth token
  function checkUrlToken() {
    if (tokenSent) return false;
    try {
      const hash = window.location.hash ? window.location.hash.replace(/^#/, '?') : '';
      const search = window.location.search || '';
      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(search);
      const token = hashParams.get('access_token') || searchParams.get('access_token');
      if (token && typeof token === 'string' && token.length > 10) {
        tokenSent = true;
        console.log('[Vibe Translator Bridge] Found OAuth token in URL fragment, forwarding to extension...');
        chrome.runtime.sendMessage({
          action: 'handle_oauth_token',
          token: token,
          source: 'kasyhq-url-hash'
        }).then((res) => {
          console.log('[Vibe Translator Bridge] OAuth token handled by extension:', res);
          try { window.close(); } catch (_) {}
        }).catch((err) => {
          console.warn('[Vibe Translator Bridge] Could not forward token:', err.message);
        });
        return true;
      }
    } catch (_) {}
    return false;
  }

  // 2. Check pending OAuth stashed by kasyhq.com in localStorage
  function checkPendingOAuth() {
    if (tokenSent) return false;
    try {
      const pendingRaw = localStorage.getItem('kasyhq_oauth_pending');
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (parsed && parsed.accessToken && (Date.now() - (parsed.ts || 0) < 5 * 60 * 1000)) {
          tokenSent = true;
          console.log('[Vibe Translator Bridge] Found stashed OAuth token in localStorage...');
          chrome.runtime.sendMessage({
            action: 'handle_oauth_token',
            token: parsed.accessToken,
            source: 'kasyhq-oauth-pending'
          }).then((res) => {
            console.log('[Vibe Translator Bridge] Pending OAuth token synced:', res);
            try { window.close(); } catch (_) {}
          }).catch(() => {});
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  // 3. Check if user email / profile is already stored in local storage
  function checkStoredEmail() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['userLoggedOut', 'userEmail'], (data) => {
          if (data && data.userLoggedOut) return;
          if (data && data.userEmail) return; // already logged in

          // Check kasyhq_user_profile
          try {
            const profileRaw = localStorage.getItem('kasyhq_user_profile');
            if (profileRaw) {
              const profile = JSON.parse(profileRaw);
              if (profile && profile.email && typeof profile.email === 'string' && profile.email.includes('@')) {
                chrome.runtime.sendMessage({
                  type: 'SYNC_USER_EMAIL',
                  request: 'sync-user-email',
                  email: profile.email.trim().toLowerCase(),
                  source: 'kasyhq-profile'
                }).catch(() => {});
                return;
              }
            }
          } catch (_) {}

          // Check legacy keys
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

  function runAllChecks() {
    if (!checkUrlToken()) {
      if (!checkPendingOAuth()) {
        checkStoredEmail();
      }
    }
  }

  // Immediate check at document_start
  runAllChecks();

  // Retry checks as DOM loads and SPA scripts execute
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllChecks);
  }
  window.addEventListener('load', runAllChecks);
  [200, 500, 1000, 2000].forEach(delay => setTimeout(runAllChecks, delay));

  // Listen to cross-tab storage events
  window.addEventListener('storage', (event) => {
    if (event.key === 'kasyhq_oauth_pending') checkPendingOAuth();
    if (event.key === 'kasyhq_user_profile' || event.key === 'vibe_user_email') checkStoredEmail();
  });

  // 4. Listen to real-time window postMessage broadcasts from kasyhq.com auth
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    if (event.source !== window) return;

    const data = event.data;
    if (!data) return;

    // Handle OAuth result postMessage
    if (data.source === 'kasyhq-oauth' && data.accessToken) {
      if (!tokenSent) {
        tokenSent = true;
        chrome.runtime.sendMessage({
          action: 'handle_oauth_token',
          token: data.accessToken,
          source: 'kasyhq-oauth-postmessage'
        }).then(() => {
          try { window.close(); } catch (_) {}
        }).catch(() => {});
      }
    }

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
