// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusMsg = document.getElementById('status-msg');

    function showStatus(text, isSuccess) {
        statusMsg.innerText = text;
        statusMsg.className = 'status-msg ' + (isSuccess ? 'status-success' : 'status-info');
    }

    // Load existing custom key if present
    chrome.storage.sync.get(['customGeminiApiKey'], (data) => {
        if (data.customGeminiApiKey) {
            input.value = data.customGeminiApiKey;
            showStatus("Custom API key is currently active.", true);
        } else {
            showStatus("Built-in local testing key is enabled.", false);
        }
    });

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
