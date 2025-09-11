/**
 * Minimal Gemini REST client for auditing formatting classification.
 */
type LineItem = { text: string; format: string; index: number };

export async function auditWithGemini(chunk: LineItem[]): Promise<Array<{ lineIndex: number; correctFormat: string }>> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Authentication token not found");

  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";
  const endpoint = `${apiBase}/llm/generate`;

  const system = [
    "You are an expert Arabic screenplay format validator.",
    "Valid formats: scene-header-1, scene-header-2, scene-header-location, action, character, parenthetical, dialogue, transition, basmala.",
    "Context rules:",
    "- A line after a character name that is not in parentheses is dialogue.",
    "- Parentheticals are enclosed in parentheses and typically follow a character.",
    "- Scene header line1 contains رقم المشهد ومعلومات الزمن/الداخل-الخارج.",
    "- The next line after header is the location and is centered.",
    "- Dialogue block text belongs to the character above it.",
    "Return JSON only: [{\"lineIndex\": n, \"correctFormat\": \"dialogue\"}]"
  ].join("\n");

  const userPayload = JSON.stringify({
    lines: chunk.map(({ text, format, index }) => ({ index, text, format }))
  });

  const body = {
    contents: [
      { role: "user", parts: [{ text: system }] },
      { role: "user", parts: [{ text: userPayload }] }
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error("Gemini API error " + res.status);
  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  // Be defensive: try/catch JSON
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}