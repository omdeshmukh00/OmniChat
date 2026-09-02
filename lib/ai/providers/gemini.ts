import { AIProvider } from "../provider";
import {
  AIChunk,
  AIRequest,
  AIResponse,
  ModelDefinition,
  ProviderCapabilities,
} from "../types";
import { getServerEnv } from "@/lib/security/env";
import { AppError } from "@/lib/security/errors";

export class GeminiProvider extends AIProvider {
  public readonly id = "gemini";
  public readonly name = "Google Gemini";

  public readonly capabilities: ProviderCapabilities = {
    chat: true,
    streaming: true,
    vision: true,
    documents: true,
    imageGeneration: false,
    speechToText: false,
    textToSpeech: false,
    webSearch: true,
    toolCalling: true,
    structuredOutput: true,
  };

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(
      env.GOOGLE_GENERATIVE_AI_API_KEY &&
        env.GOOGLE_GENERATIVE_AI_API_KEY.trim().length > 0
    );
  }

  public async getModels(): Promise<ModelDefinition[]> {
    return [
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        provider: this.id,
        description: "Ultra-fast, high-efficiency multimodal model for instant responses",
        capabilities: this.capabilities,
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        isDefault: true,
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        provider: this.id,
        description: "Google's stable high-speed multimodal vision model",
        capabilities: this.capabilities,
        contextWindow: 1000000,
        maxOutputTokens: 8192,
      },
    ];
  }

  private formatContents(request: AIRequest) {
    const contents: { role: string; parts: any[] }[] = [];

    for (let i = 0; i < request.messages.length; i++) {
      const msg = request.messages[i];
      const isLastUserMsg = i === request.messages.length - 1 && msg.role === "user";
      const role = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [];

      for (const c of msg.content) {
        if (c.text) parts.push({ text: c.text });
      }

      // Include attached image binary data as inlineData & document text for Vision/Doc capabilities
      if (isLastUserMsg && request.attachments && request.attachments.length > 0) {
        for (const file of request.attachments) {
          if (file.dataBase64) {
            parts.push({
              inlineData: {
                mimeType: file.mimeType || "image/png",
                data: file.dataBase64,
              },
            });
          }
          if (file.extractedText) {
            parts.push({
              text: `\n\n[Attached File Content: ${file.name}]\n${file.extractedText}`,
            });
          }
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    return contents;
  }

  public async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      return {
        provider: this.id,
        model: request.model || "gemini-3.6-flash",
        text: `Google Gemini provider is active in demonstration mode. Set \`GOOGLE_GENERATIVE_AI_API_KEY\` in \`.env.local\` to enable live Google GenAI endpoints.`,
        finishReason: "stop",
      };
    }

    const env = getServerEnv();
    const primaryModel = request.model || "gemini-3.6-flash";
    const candidateModels = Array.from(
      new Set([primaryModel, "gemini-3.6-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"])
    );
    const contents = this.formatContents(request);
    const startTime = Date.now();

    let lastErrorMsg = "";
    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GOOGLE_GENERATIVE_AI_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          return {
            provider: this.id,
            model: m,
            text,
            finishReason: "stop",
            latencyMs: Date.now() - startTime,
          };
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastErrorMsg = errJson.error?.message || `Gemini API HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || "Request failed";
      }
    }

    throw new AppError({
      code: "PROVIDER_ERROR",
      message: lastErrorMsg || "Gemini API request failed",
      statusCode: 500,
    });
  }

  public async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      const demoText = `Google Gemini streaming response initialized. Set \`GOOGLE_GENERATIVE_AI_API_KEY\` in \`.env.local\` for live Gemini streaming.`;
      const words = demoText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const isLast = i === words.length - 1;
        yield {
          provider: this.id,
          model: request.model || "gemini-3.6-flash",
          textDelta: words[i] + (isLast ? "" : " "),
          isComplete: isLast,
          finishReason: isLast ? "stop" : undefined,
        };
      }
      return;
    }

    const env = getServerEnv();
    const primaryModel = request.model || "gemini-3.6-flash";
    const candidateModels = Array.from(
      new Set([primaryModel, "gemini-3.6-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"])
    );
    const contents = this.formatContents(request);

    let res: Response | null = null;
    let activeModel = primaryModel;
    let lastErrorMsg = "";

    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${env.GOOGLE_GENERATIVE_AI_API_KEY}`;
        const attemptRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (attemptRes.ok && attemptRes.body) {
          res = attemptRes;
          activeModel = m;
          break;
        } else {
          const errJson = await attemptRes.json().catch(() => ({}));
          lastErrorMsg = errJson.error?.message || `Gemini API HTTP ${attemptRes.status}`;
          console.warn(`Gemini model ${m} notice (${attemptRes.status}): ${lastErrorMsg}. Trying fallback...`);
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || "Stream attempt failed";
      }
    }

    if (!res || !res.body) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: lastErrorMsg || "All Gemini candidate models are currently experiencing high demand. Please try again in a moment.",
        statusCode: 503,
      });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.substring(6));
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              yield {
                provider: this.id,
                model: activeModel,
                textDelta: text,
                isComplete: false,
              };
            }
          } catch {
            // Ignore partial JSON lines
          }
        }
      }
    }

    yield {
      provider: this.id,
      model: activeModel,
      textDelta: "",
      isComplete: true,
      finishReason: "stop",
    };
  }
}
