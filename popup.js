// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('target-language-select');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusMsg = document.getElementById('status-msg');
    const getKeyBtn = document.getElementById('get-key-btn');
    const trialsProgress = document.getElementById('trials-progress');
    const trialsUsedText = document.getElementById('trials-used-text');
    const trialsBadge = document.getElementById('trials-badge');

    const MAX_DAILY_TRIALS = 10;

    function getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function showStatus(text, isSuccess) {
        statusMsg.innerText = text;
        statusMsg.className = 'status-msg ' + (isSuccess ? 'status-success' : 'status-info');
    }

    function updateTrialsUI() {
        const today = getTodayKey();
        chrome.storage.local.get(['usageDate', 'usageCount'], (data) => {
            const count = (data.usageDate === today) ? (data.usageCount || 0) : 0;
            const remaining = Math.max(0, MAX_DAILY_TRIALS - count);
            const percentage = Math.min(100, Math.round((count / MAX_DAILY_TRIALS) * 100));

            if (trialsProgress) {
                trialsProgress.style.width = `${percentage}%`;
            }
            if (trialsUsedText) {
                trialsUsedText.innerText = `${count} / ${MAX_DAILY_TRIALS} used today (${remaining} left)`;
            }
            if (trialsBadge) {
                if (remaining === 0) {
                    trialsBadge.innerText = 'Limit Reached';
                    trialsBadge.style.background = 'rgba(217, 58, 0, 0.2)';
                    trialsBadge.style.color = '#ff4500';
                } else {
                    trialsBadge.innerText = `${remaining} Left Today`;
                    trialsBadge.style.background = 'rgba(255, 69, 0, 0.15)';
                    trialsBadge.style.color = '#ff6b35';
                }
            }
        });
    }

    // Load existing settings
    chrome.storage.sync.get(['customGeminiApiKey', 'targetLanguage'], (data) => {
        if (data.targetLanguage && langSelect) {
            langSelect.value = data.targetLanguage;
        }
        if (data.customGeminiApiKey) {
            input.value = data.customGeminiApiKey;
            showStatus("Custom API key is currently active.", true);
        } else {
            showStatus("Enter your Gemini API key from AI Studio.", false);
        }
    });

    updateTrialsUI();

    // Open Google AI Studio API keys in a new tab
    if (getKeyBtn) {
        getKeyBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://aistudio.google.com/api-keys' });
        });
    }

    if (langSelect) {
        langSelect.addEventListener('change', () => {
            const selectedLang = langSelect.value;
            const selectedName = langSelect.options[langSelect.selectedIndex].text;
            chrome.storage.sync.set({ targetLanguage: selectedLang }, () => {
                showStatus(`Translation set to ${selectedName}`, true);
            });
        });
    }

    saveBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) {
            chrome.storage.sync.remove(['customGeminiApiKey'], () => {
                showStatus("Key cleared.", false);
            });
            return;
        }

        chrome.storage.sync.set({ customGeminiApiKey: val }, () => {
            showStatus("Custom API key saved successfully!", true);
        });
    });

    resetBtn.addEventListener('click', () => {
        chrome.storage.sync.remove(['customGeminiApiKey'], () => {
            input.value = '';
            showStatus("API key reset.", false);
        });
    });
});
