// Gemini + Imagen helpers — NON-STREAMING.
// We call generateContent once, then parse THINK/RESULT lines from the full
// response. The client receives one JSON payload: { thoughts, result }.

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
// Using Gemini 3.1 Flash Lite for text reasoning
const TEXT_MODEL = "gemini-3.1-flash-lite";
const IMAGE_MODEL = "imagen-4.0-generate-001";

const TEXT_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
const IMAGE_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${GEMINI_KEY}`;

const SYSTEM = `You are Mun Shot, an AI presentation architect.

Output protocol — you MUST follow it exactly:
1. Emit 3 to 5 SHORT reasoning lines (max ~12 words each), each on its own line,
   each prefixed exactly with "THINK: ". Lowercase, no bullets, no markdown.
2. Then emit ONE final line that begins with "RESULT: " followed by a single JSON object
   matching the schema in the user task. No prose after the JSON. No code fences.

Always finish with RESULT — that line is mandatory. Keep THINK lines short to leave room for RESULT.
Never put RESULT before THINK. Never wrap RESULT in \`\`\`. Never add commentary after the JSON.`;

export type TaskOutcome = { thoughts: string[]; result: unknown } | { error: string };

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function tryParseJSON(raw: string): unknown | null {
  const cleaned = stripFences(raw).trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parseThinkResult(text: string): { thoughts: string[]; resultJson: string } {
  const lines = text.split(/\r?\n/);
  const thoughts: string[] = [];
  let resultJson = "";
  let inResult = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!inResult && /^think\s*:/i.test(line)) {
      thoughts.push(line.replace(/^think\s*:\s*/i, "").trim());
    } else if (/^result\s*:/i.test(line)) {
      inResult = true;
      resultJson += line.replace(/^result\s*:\s*/i, "").trim();
    } else if (inResult) {
      resultJson += line;
    }
  }
  return { thoughts, resultJson };
}

export async function runTextTask(taskPrompt: string, imageDataUrl?: string): Promise<TaskOutcome> {
  if (!GEMINI_KEY) return { error: "GEMINI_API_KEY is not configured on the server." };

  const userParts: any[] = [{ text: taskPrompt }];

  // Add image if provided (for style reference analysis)
  if (imageDataUrl) {
    const match = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (match) {
      userParts.push({
        inlineData: {
          mimeType: `image/${match[1]}`,
          data: match[2]
        }
      });
    }
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: userParts }],
    generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 8192 },
  };

  let res: Response;
  try {
    res = await fetch(TEXT_URL(TEXT_MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: `Gemini request failed: ${(e as Error).message}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.log("Gemini text task failed:", res.status, text.slice(0, 600));
    return { error: `Gemini ${res.status}: ${text.slice(0, 400)}` };
  }

  const json = await res.json().catch(() => null) as any;
  const responseParts = json?.candidates?.[0]?.content?.parts ?? [];
  const fullText = responseParts.map((p: any) => p?.text ?? "").join("");
  if (!fullText) {
    console.log("Gemini empty response:", JSON.stringify(json).slice(0, 600));
    return { error: "Gemini returned an empty response." };
  }

  const { thoughts, resultJson } = parseThinkResult(fullText);
  const fromMarker = resultJson ? tryParseJSON(resultJson) : null;
  if (fromMarker) return { thoughts, result: fromMarker };

  const fromFull = tryParseJSON(fullText);
  if (fromFull) {
    return {
      thoughts: thoughts.length ? thoughts : ["↳ result recovered without RESULT marker."],
      result: fromFull,
    };
  }

  console.log("Gemini produced no parseable result. Raw:", fullText.slice(0, 800));
  return { error: `Gemini did not return valid JSON. raw: ${fullText.slice(0, 240)}…` };
}

export async function generateImage(prompt: string): Promise<{ dataUrl: string } | { error: string }> {
  if (!GEMINI_KEY) return { error: "GEMINI_API_KEY is not configured on the server." };

  try {
    const res = await fetch(IMAGE_URL(IMAGE_MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("Imagen call failed:", res.status, text.slice(0, 600));
      return { error: `Imagen ${res.status}: ${text.slice(0, 400)}` };
    }
    const json = await res.json();
    const b64 =
      json?.predictions?.[0]?.bytesBase64Encoded ??
      json?.predictions?.[0]?.image?.bytesBase64Encoded;
    if (!b64) {
      console.log("Imagen response without bytes:", JSON.stringify(json).slice(0, 600));
      return { error: "Imagen returned no image bytes." };
    }
    return { dataUrl: `data:image/png;base64,${b64}` };
  } catch (e) {
    return { error: `Imagen request failed: ${(e as Error).message}` };
  }
}
