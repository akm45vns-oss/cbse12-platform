// ===== GROQ API HELPERS =====
// Collect all available keys (VITE_GROQ_KEY_1 … VITE_GROQ_KEY_5)
const GROQ_KEYS = [
  import.meta.env.VITE_GROQ_KEY_1,
  import.meta.env.VITE_GROQ_KEY_2,
  import.meta.env.VITE_GROQ_KEY_3,
  import.meta.env.VITE_GROQ_KEY_4,
  import.meta.env.VITE_GROQ_KEY_5,
].filter(Boolean);

let _groqKeyIndex = 0;

export async function callClaude(prompt, maxTokens = 2000) {
  if (GROQ_KEYS.length === 0) {
    throw new Error("GROQ API KEYS MISSING — Add VITE_GROQ_KEY_1…VITE_GROQ_KEY_5 to .env");
  }

  // Try each key in rotation; skip if rate-limited or invalid
  let lastError;
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const keyIndex = (_groqKeyIndex + attempt) % GROQ_KEYS.length;
    const key = GROQ_KEYS[keyIndex];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      })
    });

    // On 401 (invalid) or 429 (rate limit) try next key
    if (res.status === 401 || res.status === 429) {
      const err = await res.json().catch(() => ({}));
      lastError = new Error(`Groq key #${keyIndex + 1} failed (${res.status}): ${err?.error?.message || res.statusText}`);
      // Advance rotation so next call tries the next key first
      _groqKeyIndex = (keyIndex + 1) % GROQ_KEYS.length;
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Groq API Error ${res.status}: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq");

    // Successful — advance index so load is spread across keys
    _groqKeyIndex = (keyIndex + 1) % GROQ_KEYS.length;
    return text;
  }

  throw lastError || new Error("All Groq API keys failed. Please check your keys.");
}

// ===== JSON REPAIR HELPER =====
export function extractJSON(text) {
  let cleaned = text.trim().replace(/```json\n?|```\n?/g, "").trim();
  const start = cleaned.indexOf("[");
  if (start === -1) throw new Error("No JSON array found in response");
  
  cleaned = cleaned.slice(start);
  
  // Try parsing as-is first
  try {
    const r = JSON.parse(cleaned);
    if (Array.isArray(r) && r.length > 0) return r;
  } catch {
    // JSON parsing failed, will attempt repair below
  }
  
  // Repair: find last complete object ending with }
  const lastGood = cleaned.lastIndexOf("},");
  if (lastGood === -1) {
    const onlyOne = cleaned.lastIndexOf("}");
    if (onlyOne === -1) throw new Error("Could not find any complete JSON objects");
    cleaned = cleaned.slice(0, onlyOne + 1) + "]";
  } else {
    cleaned = cleaned.slice(0, lastGood + 1) + "]";
  }
  
  const r = JSON.parse(cleaned);
  if (!Array.isArray(r) || r.length === 0) throw new Error("Parsed array is empty");
  return r;
}
