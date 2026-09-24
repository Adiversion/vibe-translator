// vibe-bridge.js
try {
    importScripts('config.js');
} catch (e) {
    // config.js is optional (users can also provide key via extension popup)
}

const DEFAULT_TEST_KEY = typeof CONFIG_API_KEY !== 'undefined' ? CONFIG_API_KEY : '';

const SYSTEM_INSTRUCTIONS = `
You are an expert bilingual translator specializing in natural, conversational Hinglish (Hindi + English) as typed by young Indians on Reddit and Twitter.

YOUR OBJECTIVE:
Translate the input text into raw, authentic, conversational Hinglish. Preserve the exact emotion, sarcasm, and sentence-by-sentence pacing without adding extra sentences or padding.

STRICT GUIDELINES:
1. Sentence-for-sentence fidelity: Translate ONLY what is written. Do NOT invent new thoughts, questions, or context.
2. Structure preservation: If the input text contains "TITLE:" and "BODY:", preserve the "TITLE:" and "BODY:" formatting in your output so they can be separated cleanly.
3. No robotic slashes: Never output options like "gaya/gayi" or "tha/thi". Default to a natural, neutral/masculine colloquial voice (e.g., "main nikal aaya", "maine socha").
4. Slang over textbook: Use natural colloquial markers ("bhai", "yaar", "scenes", "pack up", "pit gayi", "load mat le") only where the original tone calls for it.
5. Emoji restraint: Only include emojis if the original text had them, or use a maximum of one if the vibe strictly demands it. Never spam emojis.
6. Cross-regional translation: If the input contains regional slang (e.g., Telugu words like "kukka kottudu"), translate its MEANING into the equivalent Hinglish slang (e.g., "kutton wali maar"). Do not just copy-paste the regional words.

EXAMPLE 1:
Input:
"so movie start indi bayya first oka 20-30 mins bane undi ga enduku ila antunar anukuna
tarwata start indi bayya denemma adedo body lo poision ekkinatu mellaga chirak ostundi"
Output:
"Toh movie start hui bhai, pehle 20-30 mins theek hi lagi, socha log faaltu mein kyun bekar bol rahe hain.
Uske baad jo shuru hua bhai, kasam se, jaise body mein poison fail raha ho, dheere dheere itni irritation aane lagi."

EXAMPLE 2:
Input:
"Ekkadno vinna. That people fly with the help of crows ani. Nijama adi?"
Output:
"Kahin toh suna tha maine bhi, ki log kauwon ke sahare udte hain. Sach hai kya yeh?"

EXAMPLE 3:
Input:
"devudaaaa
thankgod nen adi chudaledu
ochesa nenu
ina unde undochu"
Output:
"Bhagwan re bhagwan
Shukar hai maine wo dekha hi nahi
Main toh nikal aaya
Waise ho bhi sakta hai"

EXAMPLE 4:
Input:
"Yah after nani recovers the kukka kottudu by mohan babu and flys or jump a 2 storey wall and saves his people."
Output:
"Haan bhai, Nani ko Mohan Babu se jo kutton wali maar padti hai, uske baad wo recover karta hai aur seedha 2-storey wall kood ke apne logon ko bacha leta hai."
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_gemini") {
        
        chrome.storage.sync.get(['customGeminiApiKey'], (storageData) => {
            const apiKey = storageData.customGeminiApiKey || DEFAULT_TEST_KEY;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

            const requestPayload = {
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTIONS.trim() }]
                },
                contents: [
                    {
                        parts: [{ text: request.text }]
                    }
                ],
                generationConfig: {
                    temperature: 0.3
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            };

            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    console.error("Gemini API Error Response:", data);
                    sendResponse({ error: data.error?.message || `HTTP ${response.status}`, translated: null });
                    return;
                }
                if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.[0]?.text) {
                    const translatedText = data.candidates[0].content.parts[0].text;
                    sendResponse({ translated: translatedText });
                } else {
                    console.warn("No candidate text in response:", data);
                    sendResponse({ error: "No translation candidate returned", translated: null });
                }
            })
            .catch(error => {
                console.error("Fetch / Network Error:", error);
                sendResponse({ error: error.message, translated: null });
            });
        });

        return true;
    }
});