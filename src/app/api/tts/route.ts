import { openaiCompatible } from "@ai-sdk/openai-compatible";
import { NextRequest, NextResponse } from "next/server";

const TTS_MODEL = process.env.TTS_MODEL || "tts-1";
const TTS_VOICE = process.env.TTS_VOICE || "alloy";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const ttsApiKey = process.env.TTS_API_KEY || process.env.OPENAI_API_KEY;
    const ttsBaseUrl = process.env.TTS_BASE_URL || "https://api.openai.com/v1";

    if (!ttsApiKey) {
      return NextResponse.json(
        { error: "TTS API key not configured" },
        { status: 500 },
      );
    }

    // Use OpenAI compatible provider for TTS
    const _provider = openaiCompatible({
      name: "tts-provider",
      apiKey: ttsApiKey,
      baseURL: ttsBaseUrl,
    });

    const response = await fetch(`${ttsBaseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ttsApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("TTS API error:", error);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status },
      );
    }

    // Get the audio data as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio data with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
