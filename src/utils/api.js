// ===== GROQ API HELPERS =====
export async function callClaude(prompt, maxTokens = 2000) {
  const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
  if (!GROQ_KEY) throw new Error("GROQ API KEY MISSING — Add VITE_GROQ_KEY to .env and Vercel");
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq API Error ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq");
  
  return text;
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
    // Continue to repair the response below
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
