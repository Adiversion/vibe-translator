// vibe-bridge.js
// Optional fallback test key (users can also provide key via extension popup)
const DEFAULT_TEST_KEY = '';

const SYSTEM_INSTRUCTIONS = `
You are an expert translator specializing in natural, conversational internet dialect adaptation (specifically converting Tanglish/regional Indian slang into authentic casual Hinglish in Latin script).

Your goal is not a formal or literal translation, but an exact "vibe and register match" tailored for Reddit, Instagram, or casual chat.

Guidelines:
1. Preserve the exact emotional cadence, tone, punctuation, and emoji placement from the source text.
2. Maintain English words/phrases as they are if they were already written in English in the original text (e.g., "born and brought up", "I mean wtf?", "It hurts brooo!!!!").
3. Map regional slang to equivalent casual Hindi/Hinglish internet slang:
   - Filler phrases: "vishyam Ena na..." -> "toh scene kya hai na..." or "baat yeh hai ki..."
   - Slang/substance references: "saraku adipa" -> "daaru peeti hogi"
   - Rhetorical checks: "Ni pathiya pa?" -> "Dekha tune yaar?" or "Soch sakte ho?"
   - Quantifiers: "konjam" -> "thoda", "oru 5 to 10 members" -> "koi 5 to 10 members"
4. Keep the sentence structure loose and conversational, reflecting how bilingual urban Indian youth text, rather than textbook Hindi.
5. If the input contains "TITLE:" and "BODY:" sections, preserve "TITLE:" and "BODY:" headers in the output. Otherwise, output only the translated text. Do not add formal intros, conclusions, or quotation wrappers.
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_gemini") {
        
        chrome.storage.sync.get(['customGeminiApiKey'], (storageData) => {
            const apiKey = storageData.customGeminiApiKey || DEFAULT_TEST_KEY;

            if (!apiKey) {
                console.warn("Gemini API key is not configured.");
                sendResponse({
                    error: "Gemini API key missing. Please enter your key in the extension popup.",
                    translated: null
                });
                return;
            }

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const requestPayload = {
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTIONS.trim() }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{
                            text: "Convert to Hinglish:\nNa Tamil girl born and bought up in bangalore so konjam Tamil konjam kannada ..so vishyam Ena na... Do u ppl actually judge the girls stay in bangalore..my friends almost oru 5 to 10 members who stay in tamilnadu Enkita kekuranga hey bangalore la iruka apo ni pub pova saraku adipa kandipa commit airupa I mean wtf? Ni pathiya pa? Edhuku ipdi solranga not only my friends enaku online la friends ana strangers kuda apdi dha kekuranga...y do ppl judge us?? It hurts brooo!!!!"
                        }]
                    },
                    {
                        role: "model",
                        parts: [{
                            text: "Main Tamil girl hoon born and brought up in bangalore toh thoda Tamil thoda kannada ..toh scene kya hai na... Do u ppl actually judge the girls staying in bangalore..mere friends almost koi 5 to 10 members jo tamilnadu mein rehte hain Mujhse puchte hain \"arey bangalore mein hai toh tu pub jaati hogi daaru peeti hogi pakka committed hogi\" I mean wtf? Dekha tune yaar? Kyu aisa bolte hain not only my friends mujhe online jo dost bane strangers wo bhi aise hi puchte hain...y do ppl judge us?? It hurts brooo!!!!"
                        }]
                    },
                    {
                        role: "user",
                        parts: [{
                            text: `Convert to Hinglish:\n${request.text}`
                        }]
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