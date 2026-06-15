// OpenRouter image generation via Gemini 3.1 Flash Image Preview
// Used exclusively for slide image generation in Mun Shot

const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

export async function generateImageViaOpenRouter(
  prompt: string
): Promise<{ dataUrl: string } | { error: string }> {
  if (!OPENROUTER_KEY) {
    return { error: "OPENROUTER_API_KEY is not configured on the server." };
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://munshot.app",
        "X-Title": "Mun Shot"
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("OpenRouter image generation failed:", res.status, text.slice(0, 600));
      return { error: `OpenRouter ${res.status}: ${text.slice(0, 400)}` };
    }

    const json = await res.json();
    const message = json?.choices?.[0]?.message;

    if (!message?.images || message.images.length === 0) {
      console.log("OpenRouter response without images:", JSON.stringify(json).slice(0, 600));
      return { error: "OpenRouter returned no images." };
    }

    // Extract the first image data URL
    const imageUrl = message.images[0].image_url?.url;
    if (!imageUrl) {
      console.log("OpenRouter image missing URL:", JSON.stringify(message.images[0]).slice(0, 400));
      return { error: "OpenRouter image missing data URL." };
    }

    return { dataUrl: imageUrl };
  } catch (e) {
    return { error: `OpenRouter request failed: ${(e as Error).message}` };
  }
}
