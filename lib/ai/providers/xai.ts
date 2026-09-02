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

export class XAIProvider extends AIProvider {
  public readonly id = "xai";
  public readonly name = "xAI Grok";

  public readonly capabilities: ProviderCapabilities = {
    chat: true,
    streaming: true,
    vision: true,
    documents: false,
    imageGeneration: true,
    speechToText: false,
    textToSpeech: false,
    webSearch: true,
    toolCalling: true,
    structuredOutput: true,
  };

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.XAI_API_KEY && env.XAI_API_KEY.trim().length > 0);
  }

  public async getModels(): Promise<ModelDefinition[]> {
    return [
      {
        id: "grok-3",
        name: "Grok 3",
        provider: this.id,
        description: "xAI's flagship model with advanced reasoning and live web search",
        capabilities: this.capabilities,
        contextWindow: 131072,
        maxOutputTokens: 8192,
      },
      {
        id: "grok-2-vision-1212",
        name: "Grok 2 Vision",
        provider: this.id,
        description: "Grok model with image understanding capabilities",
        capabilities: { ...this.capabilities, vision: true },
        contextWindow: 32768,
        maxOutputTokens: 4096,
      },
    ];
  }

  private formatMessages(request: AIRequest) {
    const formatted: { role: string; content: string }[] = [];

    if (request.systemPrompt) {
      formatted.push({ role: "system", content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      let text = "";
      for (const c of msg.content) {
        if (c.text) text += c.text + "\n";
      }
      if (text.trim()) {
        formatted.push({ role: msg.role === "assistant" ? "assistant" : "user", content: text.trim() });
      }
    }

    return formatted;
  }

  public async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      return {
        provider: this.id,
        model: request.model || "grok-3",
        text: `xAI Grok provider is active in demonstration mode. Set \`XAI_API_KEY\` in \`.env.local\` to connect xAI API endpoints.`,
        finishReason: "stop",
      };
    }

    const env = getServerEnv();
    const model = request.model || "grok-3";
    const messages = this.formatMessages(request);
    const startTime = Date.now();

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: request.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: errData.error?.message || `xAI API error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";

      return {
        provider: this.id,
        model,
        text: content,
        finishReason: "stop",
        latencyMs: Date.now() - startTime,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        },
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "xAI API request failed",
        statusCode: 500,
      });
    }
  }

  public async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      const demoText = `xAI Grok streaming response initialized. Set \`XAI_API_KEY\` in \`.env.local\` for live Grok 3 streaming.`;
      const words = demoText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const isLast = i === words.length - 1;
        yield {
          provider: this.id,
          model: request.model || "grok-3",
          textDelta: words[i] + (isLast ? "" : " "),
          isComplete: isLast,
          finishReason: isLast ? "stop" : undefined,
        };
      }
      return;
    }

    const env = getServerEnv();
    const model = request.model || "grok-3";
    const messages = this.formatMessages(request);

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: request.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: `xAI stream error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      if (!res.body) {
        throw new AppError({
          code: "STREAM_ERROR",
          message: "xAI stream body empty",
          statusCode: 500,
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
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") {
            yield {
              provider: this.id,
              model,
              textDelta: "",
              isComplete: true,
              finishReason: "stop",
            };
            return;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.substring(6));
              const delta = json.choices?.[0]?.delta?.content || "";
              if (delta) {
                yield {
                  provider: this.id,
                  model,
                  textDelta: delta,
                  isComplete: false,
                };
              }
            } catch {
              // Ignore partial lines
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "xAI stream failed",
        statusCode: 500,
      });
    }
  }
}

