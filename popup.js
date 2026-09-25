// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('target-language-select');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusMsg = document.getElementById('status-msg');

    function showStatus(text, isSuccess) {
        statusMsg.innerText = text;
        statusMsg.className = 'status-msg ' + (isSuccess ? 'status-success' : 'status-info');
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
            showStatus("Ready • Built-in local key active.", false);
        }
    });

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
                showStatus("Key cleared. Default testing key active.", false);
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
            showStatus("Reset to default testing key.", false);
        });
    });
});
