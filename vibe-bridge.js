// vibe-bridge.js
// Optional fallback test key (users can also provide key via extension popup)
const DEFAULT_TEST_KEY = '';

const LANGUAGE_CONFIGS = {
    hindi: {
        name: "Hindi (English letters / Hinglish)",
        description: "authentic casual Hindi written in English/Latin script (Hinglish)",
        slangGuide: `- Slang/substance: "saraku adipa" / "mandhu" -> "daaru peeti hogi" / "daaru peena"
- Filler phrases: "vishyam Ena na..." -> "toh scene kya hai na..." or "baat yeh hai ki..."
- Rhetorical checks: "Ni pathiya pa?" -> "Dekha tune yaar?" or "Soch sakte ho?"
- Quantifiers: "konjam" -> "thoda", "oru 5 to 10 members" -> "koi 5 to 10 members"
- Address: "macha/mowa" -> "yaar/bhai"`,
        fewShotUser: "Convert to Hindi (written in English letters):\nNa Tamil girl born and bought up in bangalore so konjam Tamil konjam kannada ..so vishyam Ena na... Do u ppl actually judge the girls stay in bangalore..my friends almost oru 5 to 10 members who stay in tamilnadu Enkita kekuranga hey bangalore la iruka apo ni pub pova saraku adipa kandipa commit airupa I mean wtf? Ni pathiya pa? Edhuku ipdi solranga not only my friends enaku online la friends ana strangers kuda apdi dha kekuranga...y do ppl judge us?? It hurts brooo!!!!",
        fewShotModel: "Main Tamil girl hoon born and brought up in bangalore toh thoda Tamil thoda kannada ..toh scene kya hai na... Do u ppl actually judge the girls staying in bangalore..mere friends almost koi 5 to 10 members jo tamilnadu mein rehte hain Mujhse puchte hain \"arey bangalore mein hai toh tu pub jaati hogi daaru peeti hogi pakka committed hogi\" I mean wtf? Dekha tune yaar? Kyu aisa bolte hain not only my friends mujhe online jo dost bane strangers wo bhi aise hi puchte hain...y do ppl judge us?? It hurts brooo!!!!"
    },
    tamil: {
        name: "Tamil (English letters)",
        description: "authentic casual Tamil written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "daaru/alcohol/mandhu" -> "sarakku"
- Filler phrases: "baat yeh hai ki..." / "scene yeh hai..." -> "matter / vishayam enna na..."
- Rhetorical checks: "dekha tune yaar?" -> "paathiya da/pa?" or "soch sakte ho?" -> "yosikka mudiyutha?"
- Address: "bhai/yaar/mowa" -> "macha/bro/thala"
- Quantifiers: "thoda" -> "konjam", "kuch log" -> "sila peru"`,
        fewShotUser: "Convert to Tamil (written in English letters):\nMain Delhi ka ladka hoon born and brought up in Noida.. toh scene kya hai na... Do u ppl actually judge the guys staying in Noida.. mere friends mujhse puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? Kyu aisa bolte hain?? It hurts brooo!!!!",
        fewShotModel: "Naan Delhi payyan born and brought up in Noida.. so vishayam enna na... Do u ppl actually judge the guys staying in Noida.. en friends enkitta kekkuranga 'nee pub pova sarakku adipa' I mean wtf? Paathiya pa? Edhukku ipdi solraanga?? It hurts brooo!!!!"
    },
    telugu: {
        name: "Telugu (English letters)",
        description: "authentic casual Telugu written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "daaru/sarakku" -> "mandhu"
- Filler phrases: "baat yeh hai ki..." -> "vishayam / scene enti ante..."
- Rhetorical checks: "dekha tune yaar?" -> "chusava bro/mowa?"
- Address: "bhai/yaar/macha" -> "mowa/mama/bro"
- Quantifiers: "thoda" -> "koncham", "kuch log" -> "oka 5-10 mandi"`,
        fewShotUser: "Convert to Telugu (written in English letters):\nMain Delhi ka ladka hoon born and brought up in Noida.. toh scene kya hai na... Do u ppl actually judge the guys staying in Noida.. mere friends mujhse puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? Kyu aisa bolte hain?? It hurts brooo!!!!",
        fewShotModel: "Nenu Delhi abbayini born and brought up in Noida.. so vishayam enti ante... Do u ppl actually judge the guys staying in Noida.. ma friends nannu adugutunnaru 'nuvvu pub ki veltava mandhu taagutava' I mean wtf? Chusava mowa? Enduku ila antaru?? It hurts brooo!!!!"
    },
    malayalam: {
        name: "Malayalam (English letters)",
        description: "authentic casual Malayalam written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "daaru/sarakku/mandhu" -> "kallu/madhyam/sadhanam"
- Filler phrases: "baat yeh hai ki..." -> "kaaryam enthanu vechaal..."
- Rhetorical checks: "dekha tune yaar?" -> "kandille machane?"
- Address: "bhai/yaar" -> "machane/bro/aliyan"
- Quantifiers: "thoda" -> "kurachu"`,
        fewShotUser: "Convert to Malayalam (written in English letters):\nMain ek ladka hoon born and brought up in Bangalore.. toh scene kya hai na... Do u ppl actually judge people staying here.. mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? Kyu aisa bolte hain?? It hurts brooo!!!!",
        fewShotModel: "Njan oru aanaanu born and brought up in Bangalore.. so karyam enthanu vechaal... Do u ppl actually judge people staying here.. ente friends chodikkunnu 'nee pubil pokumo kallu kudikkumo' I mean wtf? Kandille machane? Enthina ingane parayunne?? It hurts brooo!!!!"
    },
    kannada: {
        name: "Kannada (English letters)",
        description: "authentic casual Kannada written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "daaru/sarakku/mandhu" -> "kudi/saraku"
- Filler phrases: "baat yeh hai ki..." -> "vishaya enandre..."
- Rhetorical checks: "dekha tune yaar?" -> "nodidya macha?"
- Address: "bhai/yaar" -> "macha/maga/bro"
- Quantifiers: "thoda" -> "swalpa"`,
        fewShotUser: "Convert to Kannada (written in English letters):\nMain Bangalore mein rehta hoon.. toh scene kya hai na... mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Naanu Bangalore alli irodu.. so vishaya enandre... nanna friends kelthare 'neenu pub ge hogthiya saraku kudithiya' I mean wtf? Nodidya maga? It hurts brooo!!!!"
    },
    bengali: {
        name: "Bengali (English letters)",
        description: "authentic casual Bengali written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "daaru/sarakku" -> "mod/daaru"
- Filler phrases: "baat yeh hai ki..." -> "ashol byapar ta holo..."
- Rhetorical checks: "dekha tune yaar?" -> "dekhli toh bhai?"
- Address: "bhai/yaar" -> "bhai/dada/yaar"
- Quantifiers: "thoda" -> "ektu"`,
        fewShotUser: "Convert to Bengali (written in English letters):\nMain Kolkata ka ladka hoon.. toh scene kya hai na... mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Ami Kolkata-r chele.. toh ashol byapar ta holo... amar bondhura jiggesh kore 'tui pub jaash mod khash naki' I mean wtf? Dekhli toh bhai? It hurts brooo!!!!"
    },
    punjabi: {
        name: "Punjabi (English letters)",
        description: "authentic casual Punjabi written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "sarakku/mandhu" -> "daaru/sharaab"
- Filler phrases: "baat yeh hai ki..." -> "gal eh hai ki..."
- Rhetorical checks: "dekha tune yaar?" -> "vekhya fer 22ji/yaar?"
- Address: "bhai/yaar" -> "veere/22ji/yaar/paaji"
- Quantifiers: "thoda" -> "thora"`,
        fewShotUser: "Convert to Punjabi (written in English letters):\nMain Delhi ka ladka hoon.. toh scene kya hai na... mere dost puchde ne 'tu pub jaanda hovenga daaru peenda hovenga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Main Delhi da munda aan.. te gal eh hai ki... mere dost puchde ne 'tu pub jaanda hovenga daaru peenda hovenga' I mean wtf? Vekhya fer veere? It hurts brooo!!!!"
    },
    marathi: {
        name: "Marathi (English letters)",
        description: "authentic casual Marathi written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "sarakku/mandhu" -> "daaru"
- Filler phrases: "baat yeh hai ki..." -> "mudda asa ahe ki..."
- Rhetorical checks: "dekha tune yaar?" -> "baghitalas ka bhava?"
- Address: "bhai/yaar" -> "bhava/re/mitra"
- Quantifiers: "thoda" -> "thoda/kahi"`,
        fewShotUser: "Convert to Marathi (written in English letters):\nMain Pune ka ladka hoon.. toh scene kya hai na... mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Mi Pune cha mulga ahe.. tar mudda asa ahe ki... majhe mitra vichartat 'tu pub madhe jat asashil daaru pit asashil' I mean wtf? Baghitalas ka bhava? It hurts brooo!!!!"
    },
    gujarati: {
        name: "Gujarati (English letters)",
        description: "authentic casual Gujarati written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "sarakku/mandhu" -> "daaru"
- Filler phrases: "baat yeh hai ki..." -> "vaat em chhe ke..."
- Rhetorical checks: "dekha tune yaar?" -> "joyu ne bhai?"
- Address: "bhai/yaar" -> "bhai/dost/yaar"
- Quantifiers: "thoda" -> "thodu"`,
        fewShotUser: "Convert to Gujarati (written in English letters):\nMain Ahmedabad ka ladka hoon.. toh scene kya hai na... mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Hoon Ahmedabad no chhokro chhu.. toh vaat em chhe ke... mara friends mane puchhe chhe 'tu pub jato hoish daaru peeto hoish' I mean wtf? Joyu ne bhai? It hurts brooo!!!!"
    },
    odia: {
        name: "Odia (English letters)",
        description: "authentic casual Odia written in English/Latin script (conversational internet texting)",
        slangGuide: `- Slang/substance: "sarakku/mandhu" -> "madha/daaru"
- Filler phrases: "baat yeh hai ki..." -> "katha heuchi ki..."
- Rhetorical checks: "dekha tune yaar?" -> "dekhilu ta bhai?"
- Address: "bhai/yaar" -> "bhai/sangaa"
- Quantifiers: "thoda" -> "tike"`,
        fewShotUser: "Convert to Odia (written in English letters):\nMain Bhubaneswar ka ladka hoon.. toh scene kya hai na... mere dost puchte hain 'tu pub jaata hoga daaru peeta hoga' I mean wtf? Dekha tune yaar? It hurts brooo!!!!",
        fewShotModel: "Muin Bhubaneswar ra pua.. toh katha heuchi ki... mora sanga mane pacharantee 'tu pub jau thibu madha piu thibu' I mean wtf? Dekhilu ta sangaa? It hurts brooo!!!!"
    },
    english: {
        name: "English (Casual Internet)",
        description: "casual, natural conversational Indian internet English (like Reddit/Twitter rants)",
        slangGuide: `- Slang/substance: "saraku/mandhu/daaru" -> "booze / hitting pubs"
- Filler phrases: "vishyam enna na / baat yeh hai ki" -> "so the scene is..." / "here's the thing..."
- Rhetorical checks: "paathiya / dekha tune" -> "can you believe that?" / "you see this?"
- Address: "macha/bhai/mowa" -> "bro/guys"
- Keep the colloquial energy high without stiff dictionary English`,
        fewShotUser: "Convert to English (casual internet style):\nNa Tamil girl born and bought up in bangalore so konjam Tamil konjam kannada ..so vishyam Ena na... Do u ppl actually judge the girls stay in bangalore..my friends almost oru 5 to 10 members who stay in tamilnadu Enkita kekuranga hey bangalore la iruka apo ni pub pova saraku adipa kandipa commit airupa I mean wtf? Ni pathiya pa? Edhuku ipdi solranga not only my friends enaku online la friends ana strangers kuda apdi dha kekuranga...y do ppl judge us?? It hurts brooo!!!!",
        fewShotModel: "I'm a Tamil girl born and brought up in Bangalore, so a bit of Tamil and a bit of Kannada.. so here's the scene... Do u guys actually judge girls staying in Bangalore? Like 5 to 10 of my friends back in Tamil Nadu keep asking me 'hey you live in Bangalore so you must be hitting pubs, drinking booze and definitely committed', I mean wtf? Can you believe this? Why do people say this—not just my friends, even strangers who became friends online ask the exact same thing... why do people judge us? It hurts brooo!!!!"
    }
};

function buildSystemPrompt(langKey) {
    const config = LANGUAGE_CONFIGS[langKey] || LANGUAGE_CONFIGS.hindi;
    return `You are an expert translator specializing in natural, conversational internet dialect adaptation (specifically converting any Indian regional language or slang into ${config.description}).

Your goal is not a formal or literal translation, but an exact "vibe and register match" tailored for Reddit, Instagram, or casual chat.

CRITICAL RULES:
1. ALWAYS write exclusively in the English/Latin alphabet (just like young Indians text on WhatsApp, Reddit, and Instagram). Never use native Indic scripts (such as Devanagari, Tamil, Telugu, Malayalam, Bengali, etc.).
2. Preserve the exact emotional cadence, tone, punctuation, and emoji placement from the source text.
3. Maintain English words/phrases as they are if they were already written in English in the original text (e.g., "born and brought up", "I mean wtf?", "It hurts brooo!!!!").
4. Map regional slang to equivalent casual ${config.name} internet slang:
${config.slangGuide}
5. Keep the sentence structure loose and conversational, reflecting how bilingual urban Indian youth text, rather than textbook grammar.
6. If the input contains "TITLE:" and "BODY:" sections, preserve "TITLE:" and "BODY:" headers in the output. Otherwise, output only the translated text. Do not add formal intros, conclusions, or quotation wrappers.`;
}

const MAX_DAILY_TRIALS = 10;

function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_gemini") {
        
        chrome.storage.local.get(['usageDate', 'usageCount'], (localUsage) => {
            const today = getTodayString();
            let currentCount = (localUsage.usageDate === today) ? (localUsage.usageCount || 0) : 0;

            if (currentCount >= MAX_DAILY_TRIALS) {
                console.warn(`Daily trial limit reached (${currentCount}/${MAX_DAILY_TRIALS})`);
                sendResponse({
                    error: `Daily trial limit reached (${MAX_DAILY_TRIALS}/${MAX_DAILY_TRIALS} used today). Resets at midnight!`,
                    translated: null,
                    limitReached: true,
                    usedToday: currentCount,
                    maxTrials: MAX_DAILY_TRIALS
                });
                return;
            }

            chrome.storage.sync.get(['customGeminiApiKey', 'targetLanguage'], (storageData) => {
                const apiKey = storageData.customGeminiApiKey || DEFAULT_TEST_KEY;
                const targetLang = (request.targetLanguage || storageData.targetLanguage || 'hindi').toLowerCase();
                const config = LANGUAGE_CONFIGS[targetLang] || LANGUAGE_CONFIGS.hindi;

                if (!apiKey) {
                    console.warn("Gemini API key is not configured.");
                    sendResponse({
                        error: "Gemini API key missing. Please enter your key in the extension popup.",
                        translated: null
                    });
                    return;
                }

                const requestPayload = {
                    system_instruction: {
                        parts: [{ text: buildSystemPrompt(targetLang).trim() }]
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: config.fewShotUser }]
                        },
                        {
                            role: "model",
                            parts: [{ text: config.fewShotModel }]
                        },
                        {
                            role: "user",
                            parts: [{ text: `Convert to ${config.name}:\n${request.text}` }]
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

                const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

                (async () => {
                    let lastError = null;
                    for (const model of CANDIDATE_MODELS) {
                        try {
                            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(requestPayload)
                            });

                            const data = await response.json();
                            if (!response.ok) {
                                const errorMsg = data.error?.message || `HTTP ${response.status}`;
                                console.warn(`Model ${model} returned error: ${errorMsg}. Trying backup model...`);
                                lastError = errorMsg;
                                continue;
                            }

                            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.[0]?.text) {
                                const translatedText = data.candidates[0].content.parts[0].text;
                                currentCount += 1;
                                chrome.storage.local.set({ usageDate: today, usageCount: currentCount });

                                sendResponse({
                                    translated: translatedText,
                                    error: null,
                                    usedToday: currentCount,
                                    maxTrials: MAX_DAILY_TRIALS
                                });
                                return;
                            } else {
                                lastError = "No translation candidate returned";
                            }
                        } catch (err) {
                            console.warn(`Fetch error on ${model}:`, err);
                            lastError = err.message;
                        }
                    }

                    sendResponse({ error: lastError || "All Gemini models failed", translated: null });
                })();
            });
        });

        return true;
    }
});