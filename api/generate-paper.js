export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, maxTokens } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const GROQ_KEYS = [
    process.env.VITE_GROQ_KEY_1,
    process.env.VITE_GROQ_KEY_2,
    process.env.VITE_GROQ_KEY_3,
    process.env.VITE_GROQ_KEY_4,
    process.env.VITE_GROQ_KEY_5,
  ].filter(Boolean);

  if (GROQ_KEYS.length === 0) {
    return res.status(500).json({ error: "No Groq API keys configured on server" });
  }

  let lastError;
  const startIdx = Math.floor(Math.random() * GROQ_KEYS.length);

  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const keyIndex = (startIdx + attempt) % GROQ_KEYS.length;
    const key = GROQ_KEYS[keyIndex];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: maxTokens || 4000,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.status === 401 || response.status === 429) {
        const err = await response.json().catch(() => ({}));
        lastError = new Error(`Groq key #${keyIndex + 1} failed (${response.status}): ${err?.error?.message || response.statusText}`);
        continue;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error ${response.status}: ${err?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response from Groq");

      return res.status(200).json({ text });
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(500).json({ error: lastError?.message || "All Groq keys failed" });
}
